import * as crypto from 'crypto';
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  HttpException,
  Get,
  Query,
  Res,
  Req,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CookieOptions, Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from '@modules/auth/auth.service';
import { OAuthStateService } from '@modules/auth/oauth-state.service';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { GoogleLoginDto } from '@modules/auth/dto/google-login.dto';
import { User } from '@modules/user/entities/user.entity';
import { LoginResponse } from '@src/common/types';
import { Public } from '@src/common/decorators';
import { getRefreshTokenCookieOptions } from '@modules/auth/utils/cookie.util';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthStateService: OAuthStateService,
  ) {}

  private get refreshTokenCookieOptions(): CookieOptions {
    // Đọc cấu hình động từ env qua util chung — đảm bảo cùng options khi set/clear cookie
    // và đồng bộ TTL với REFRESH_TOKEN_TTL_DAYS (R10.AC1, R10.AC5).
    return getRefreshTokenCookieOptions(process.env);
  }

  private resolveDeviceType(userAgent?: string): 'mobile' | 'desktop' {
    return userAgent?.toLowerCase().includes('mobi') ? 'mobile' : 'desktop';
  }

  private encodeRedirectDetails(details: unknown): string | undefined {
    if (!details) return undefined;
    return Buffer.from(JSON.stringify(details)).toString('base64url');
  }

  @Public()
  @Throttle({ login_register: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - User already exists or validation error',
  })
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    await this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ login_register: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<LoginResponse, 'refreshToken' | 'sessionId'>> {
    const userAgent = req.headers['user-agent'] ?? 'Unknown';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ?? req.ip ?? 'Unknown';
    const deviceType = this.resolveDeviceType(userAgent);

    const result = await this.authService.login({
      ...loginDto,
      device: {
        ...loginDto.device,
        deviceType,
        userAgent,
        ipAddress,
      },
    });

    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.refreshTokenCookieOptions,
    );

    return {
      userInfo: result.userInfo,
      token: result.token,
    };
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google Login' })
  googleLogin(
    @Res() res: Response,
    @Query('lang') lang?: string,
    @Query('device_uid') deviceUid?: string,
  ): void {
    const state = Buffer.from(
      JSON.stringify({ lang: lang || 'vi', deviceUid: deviceUid || '' }),
    ).toString('base64');
    const url = this.authService.getGoogleAuthUrl(state);

    res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google Login Callback' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    let lang = 'vi';
    let deviceUid = '';

    if (state) {
      try {
        const decodedState = JSON.parse(
          Buffer.from(state, 'base64').toString('utf-8'),
        );
        lang = decodedState.lang ?? 'vi';
        deviceUid = decodedState.deviceUid ?? '';
      } catch (_e: unknown) {
        // Fallback or ignore if state is invalid
        lang = state ?? 'vi'; // In case it was just a string before
      }
    }

    const frontendBase = `${process.env.FRONTEND_URL}/${lang}/auth/google/callback`;

    try {
      const userAgent = req.headers['user-agent'] ?? 'Unknown';
      const ipAddress =
        (req.headers['x-forwarded-for'] as string) ?? req.ip ?? 'Unknown';
      const deviceType = this.resolveDeviceType(userAgent);

      // R2.AC1-3: Ưu tiên dùng deviceUid FE truyền lên (đã persist trong localStorage)
      // để tái dùng device record. Chỉ sinh mới khi FE không truyền (legacy client).
      // Validate UUID v4 để tránh client gửi giá trị rác làm BE coi là device mới.
      const UUID_V4_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const finalDeviceUid =
        deviceUid && UUID_V4_RE.test(deviceUid)
          ? deviceUid
          : crypto.randomUUID();

      const result = await this.authService.loginWithGoogle({
        code,
        device: {
          deviceUid: finalDeviceUid,
          deviceName: 'Browser Device',
          deviceType,
          os: 'Unknown',
          browser: 'Unknown',
          userAgent,
          ipAddress,
        },
      });

      res.cookie(
        'refreshToken',
        result.refreshToken,
        this.refreshTokenCookieOptions,
      );

      res.redirect(`${frontendBase}?token=${result.token}`);
    } catch (error: unknown) {
      // Extract error code from HttpException or fallback to generic error
      let errorCode = 'UNKNOWN_ERROR';
      let errorDetails: unknown;

      if (error instanceof HttpException) {
        const response = error.getResponse();
        if (typeof response === 'object' && response !== null) {
          errorCode =
            ((response as Record<string, unknown>).code as string) || errorCode;
          errorDetails = (response as Record<string, unknown>).details;
        }
      }

      const params = new URLSearchParams({ error: errorCode });
      const encodedDetails = this.encodeRedirectDetails(errorDetails);

      if (encodedDetails) {
        params.set('details', encodedDetails);
      }

      res.redirect(`${frontendBase}?${params.toString()}`);
    }
  }

  @Public()
  @Throttle({ refresh_token: { limit: 60, ttl: 60_000 } })
  @Get('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid refresh token or session',
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ token: string }> {
    const refreshToken = req.cookies.refreshToken;
    const result = await this.authService.refreshToken(refreshToken);

    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.refreshTokenCookieOptions,
    );

    return { token: result.token };
  }

  @Public()
  @Throttle({ login_register: { limit: 10, ttl: 60_000 } })
  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in with Google',
  })
  async loginWithGoogle(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<Omit<LoginResponse, 'refreshToken' | 'sessionId'>> {
    const userAgent = req.headers['user-agent'] ?? 'Unknown';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ?? req.ip ?? 'Unknown';

    const result = await this.authService.loginWithGoogle({
      ...googleLoginDto,
      device: {
        ...googleLoginDto.device,
        deviceType: this.resolveDeviceType(userAgent),
        userAgent,
        ipAddress,
      },
    });

    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.refreshTokenCookieOptions,
    );

    return {
      userInfo: result.userInfo,
      token: result.token,
    };
  }

  @Public()
  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<void> {
    const refreshToken = req.cookies.refreshToken;
    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken', this.refreshTokenCookieOptions);
  }

  @Public()
  @Throttle({ login_register: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(email);
    return {
      message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.',
    };
  }

  @Public()
  @Throttle({ login_register: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(
    @Body('token') token: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(token, email, password);
    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: User,
  })
  async getProfile(@Req() req: Request): Promise<Omit<User, 'password'>> {
    const user = req['user'] as { userId: string; sessionId?: string };

    // Prefer JWT payload (always available after guard), fallback to cookie
    if (user?.userId) {
      return await this.authService.getProfileByUserId(user.userId);
    }

    const refreshToken = req.cookies.refreshToken;
    return await this.authService.getProfile(refreshToken);
  }
}
