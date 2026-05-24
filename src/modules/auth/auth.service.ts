import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { HashService } from '@src/common/security/hash/hash.service';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { GoogleLoginDto } from '@modules/auth/dto/google-login.dto';
import { CreateDeviceDto } from '@modules/device/dto/create-device.dto';
import { IDENTITY_PROVIDERS, ValidationErrorCode } from '@src/common/constants';
import { JwtService } from '@src/common/security/jwt/jwt.service';
import { IdentityProfile, LoginResponse } from '@src/common/types';
import { IdentityProvider } from '@modules/identity/identity.interface';
import { DeviceService } from '@modules/device/device.service';
import { SessionService } from '@modules/session/session.service';
import { Device } from '@modules/device/entities/device.entity';
import { EmailService } from '@modules/email/email.service';

@Injectable()
export class AuthService {
  private readonly refreshSessionDurationInDays = Number(
    process.env.REFRESH_TOKEN_TTL_DAYS || 30,
  );

  constructor(
    @Inject(IDENTITY_PROVIDERS.GOOGLE)
    private readonly googleIdentity: IdentityProvider,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly deviceService: DeviceService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
  ) {}

  async register(data: RegisterDto): Promise<void> {
    const user: User | null = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (user) {
      throw new HttpException(ValidationErrorCode.USER_ALREADY_EXISTS, 400);
    }

    const hashedPassword = await this.hashService.hash(data.password);

    await this.userRepository.save({
      ...data,
      password: hashedPassword,
      roleCode: 'user',
    });
  }

  async login(data: LoginDto): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (!user) {
      throw new HttpException(ValidationErrorCode.USER_NOT_FOUND, 404);
    }

    const isPasswordValid = await this.hashService.compare(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new HttpException(ValidationErrorCode.INVALID_PASSWORD, 401);
    }

    return await this.createLoginSession(user, data.device);
  }

  async loginWithGoogle(data: GoogleLoginDto): Promise<LoginResponse> {
    const profile = await this.googleIdentity.verify({ code: data.code });

    return await this.loginOrRegisterWithProfile(
      profile,
      data.device,
      data.force ?? false,
    );
  }

  getGoogleAuthUrl(state: string): string {
    if (this.googleIdentity.getAuthorizationUrl) {
      return this.googleIdentity.getAuthorizationUrl(state);
    }

    throw new HttpException('Method not implemented', 501);
  }

  private async loginOrRegisterWithProfile(
    profile: IdentityProfile,
    deviceData: CreateDeviceDto,
    force = false,
  ): Promise<LoginResponse> {
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await this.hashService.hash(randomPassword);

      user = this.userRepository.create({
        email: profile.email,
        password: hashedPassword,
        fullName: profile.name ?? profile.email?.split('@')[0] ?? 'User',
        avatar: profile.avatar,
        roleCode: 'user',
      });
      await this.userRepository.save(user);
    }

    return await this.createLoginSession(user, deviceData, force);
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> {
    const decodedToken = this.verifyRefreshTokenOrThrow(refreshToken);
    const sessionId = decodedToken.sessionId;

    const session = await this.sessionService.findById(sessionId);
    if (!session || session.logoutAt) {
      throw new HttpException(ValidationErrorCode.UNAUTHENTICATED, 401);
    }

    const isValid = await this.hashService.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isValid) {
      throw new HttpException(ValidationErrorCode.UNAUTHENTICATED, 401);
    }

    const user = await this.userRepository.findOne({
      where: { id: session.userId },
    });
    if (!user) {
      throw new HttpException(ValidationErrorCode.USER_NOT_FOUND, 404);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleCode: user.roleCode,
      deviceId: session.deviceId,
      sessionId: session.id,
    };

    const accessToken = this.jwtService.generateAccessToken(tokenPayload);
    const newRefreshToken = this.jwtService.generateRefreshToken(tokenPayload);

    const hashedRefreshToken = await this.hashService.hash(newRefreshToken);

    await this.sessionService.updateRefreshToken(
      session.id,
      hashedRefreshToken,
    );

    return {
      token: accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const decodedToken = this.verifyRefreshTokenOrThrow(refreshToken);
    const sessionId = decodedToken.sessionId;
    await this.sessionService.revokeSession(sessionId);
  }

  async getProfile(refreshToken: string): Promise<Omit<User, 'password'>> {
    const decodedToken = this.verifyRefreshTokenOrThrow(refreshToken);
    const sessionId = decodedToken.sessionId;

    const session = await this.sessionService.findById(sessionId);
    if (!session || session.logoutAt) {
      throw new HttpException(ValidationErrorCode.UNAUTHENTICATED, 401);
    }

    const user = await this.userRepository.findOne({
      where: { id: session.userId },
    });

    if (!user) {
      throw new HttpException(ValidationErrorCode.USER_NOT_FOUND, 404);
    }

    const { password: _password, ...userInfo } = user;
    return userInfo;
  }

  async getProfileByUserId(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException(ValidationErrorCode.USER_NOT_FOUND, 404);
    }

    const { password: _password, ...userInfo } = user;
    return userInfo;
  }

  private async createLoginSession(
    user: User,
    deviceData: CreateDeviceDto,
    force = false,
  ): Promise<LoginResponse> {
    return await this.dataSource.transaction(async (manager) => {
      // Step 0: Chủ động đánh dấu các session đã hết hạn theo `expired_at` thành 'expired'.
      // Cron mỗi giờ đã làm việc này (SessionCleanupService) nhưng giữa 2 lần cron có thể
      // tồn tại "zombie sessions" — JWT đã hết hạn nhưng row DB còn 'active'. Nếu deviceUid
      // mới khác (FE không persist tốt) thì session zombie này sẽ bị tính vào device limit
      // và user thấy 409 ngay khi vừa logout/refresh-token-expire xong (R8.AC1).
      await this.sessionService.expireOutdatedSessions(user.id);

      // Step 1: Upsert device (KHÔNG ghi đè deviceUid — R2.AC4-5)
      const device = await this.upsertDeviceForLogin(user.id, deviceData);

      // Step 2: Revoke active session on the same device (R4.AC6)
      await this.sessionService.revokeActiveSessionByDevice(device.id);

      // Step 3: If force=true, revoke all active sessions of same deviceType (R8.AC5)
      if (force) {
        try {
          await this.sessionService.revokeActiveByUserAndDeviceType(
            user.id,
            device.deviceType,
            device.id,
            manager,
          );
        } catch {
          throw new HttpException(
            {
              code: ValidationErrorCode.LOGIN_FORCE_REVOKE_FAILED,
              message: ValidationErrorCode.LOGIN_FORCE_REVOKE_FAILED,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      // Step 4: Count active sessions of same deviceType (excluding current device)
      // Skip limit check when force=true since we already revoked all other sessions above
      if (!force) {
        const activeSessionCount =
          await this.sessionService.countActiveSessionsByUserIdAndDeviceType(
            user.id,
            device.deviceType,
            device.id,
          );

        // Step 5: If exceeds limit, build 409 payload with activeDevices details (R8.AC1)
        if (
          activeSessionCount >=
          this.getMaximumActiveSessionsByDeviceType(device.deviceType)
        ) {
          const activeSessions =
            await this.sessionService.findActiveSessionsByUserAndDeviceType(
              user.id,
              device.deviceType,
              device.id,
            );

          throw new HttpException(
            {
              code: ValidationErrorCode.ACCOUNT_IN_USE_ON_ANOTHER_DEVICE,
              message: ValidationErrorCode.ACCOUNT_IN_USE_ON_ANOTHER_DEVICE,
              details: {
                activeDevices: activeSessions.map((s) => ({
                  deviceId: s.device.id,
                  deviceName: s.device.deviceName,
                  deviceType: s.device.deviceType,
                  os: s.device.os,
                  browser: s.device.browser,
                  ipAddress: s.device.ipAddress,
                  lastLoginAt: s.device.lastLoginAt,
                })),
              },
            },
            HttpStatus.CONFLICT,
          );
        }
      }

      // Step 6: Create session + generate tokens + hash refresh token
      const session = await this.sessionService.create(
        user.id,
        device.id,
        this.getSessionExpiryDate(),
      );

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleCode: user.roleCode,
        deviceId: device.id,
        sessionId: session.id,
      };

      const token = this.jwtService.generateAccessToken(tokenPayload);
      const refreshToken = this.jwtService.generateRefreshToken(tokenPayload);

      const hashedRefreshToken = await this.hashService.hash(refreshToken);

      await this.sessionService.updateRefreshToken(
        session.id,
        hashedRefreshToken,
      );

      const { password: _password, ...userInfo } = user;

      return {
        userInfo,
        token,
        refreshToken,
        sessionId: session.id,
      };
    });
  }

  private async upsertDeviceForLogin(
    userId: string,
    deviceData: CreateDeviceDto,
  ): Promise<Device> {
    const existingDevice = await this.deviceService.findDeviceByUidAndUserId(
      deviceData.deviceUid,
      userId,
    );

    if (!existingDevice) {
      return await this.deviceService.createNewDevice(deviceData, userId);
    }

    // R2.AC4-5: Update only whitelisted metadata fields, NEVER overwrite deviceUid
    return await this.deviceService.updateDeviceLoginMetadata(
      existingDevice.id,
      {
        deviceName: deviceData.deviceName,
        deviceType: deviceData.deviceType,
        os: deviceData.os,
        browser: deviceData.browser,
        ipAddress: deviceData.ipAddress,
        userAgent: deviceData.userAgent,
        lastLoginAt: new Date(),
      },
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await this.hashService.hash(token);
    user.resetToken = hashedToken;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await this.userRepository.save(user);

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await this.emailService.sendPasswordResetEmail(email, resetUrl);
  }

  async resetPassword(
    token: string,
    email: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user?.resetToken || !user.resetTokenExpires) {
      throw new HttpException(ValidationErrorCode.RESET_TOKEN_INVALID, 400);
    }

    if (new Date() > user.resetTokenExpires) {
      throw new HttpException(ValidationErrorCode.RESET_TOKEN_EXPIRED, 400);
    }

    const isValid = await this.hashService.compare(token, user.resetToken);
    if (!isValid) {
      throw new HttpException(ValidationErrorCode.RESET_TOKEN_INVALID, 400);
    }

    user.password = await this.hashService.hash(newPassword);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await this.userRepository.save(user);
  }

  private getMaximumActiveSessionsByDeviceType(deviceType: string): number {
    const envKey =
      deviceType === 'mobile'
        ? 'MAXIMUM_MOBILE_DEVICE_COUNT'
        : 'MAXIMUM_DESKTOP_DEVICE_COUNT';

    return Number(process.env[envKey] || 1);
  }

  private getSessionExpiryDate(): Date {
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + this.refreshSessionDurationInDays);
    return expiredAt;
  }

  private verifyRefreshTokenOrThrow(refreshToken?: string) {
    if (!refreshToken) {
      throw new HttpException(ValidationErrorCode.UNAUTHENTICATED, 401);
    }

    try {
      return this.jwtService.verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpException(ValidationErrorCode.UNAUTHENTICATED, 401);
    }
  }
}
