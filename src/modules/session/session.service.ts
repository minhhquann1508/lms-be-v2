import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from '@modules/device/entities/device.entity';
import { Session } from './entities/session.entity';
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async create(userId: string, deviceId: string, expiredAt: Date) {
    const session = this.sessionRepository.create({
      userId,
      deviceId,
      refreshTokenHash: 'pending',
      status: 'active',
      loginAt: new Date(),
      expiredAt,
    });
    return await this.sessionRepository.save(session);
  }

  async updateRefreshToken(id: string, refreshTokenHash: string) {
    await this.sessionRepository.update(id, { refreshTokenHash });
  }

  async expireOutdatedSessions(userId?: string): Promise<void> {
    const query = this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'active' })
      .andWhere('expired_at <= :now', { now: new Date() })
      .andWhere('logout_at IS NULL');

    if (userId) {
      query.andWhere('user_id = :userId', { userId });
    }

    await query.execute();
  }

  async countActiveSessionsByUserIdAndDeviceType(
    userId: string,
    deviceType: string,
    excludedDeviceId?: string,
  ): Promise<number> {
    await this.expireOutdatedSessions(userId);

    const query = this.sessionRepository
      .createQueryBuilder('session')
      .innerJoin(
        Device,
        'device',
        'device.id = session.deviceId AND device.deviceType = :deviceType',
        { deviceType },
      )
      .where('session.userId = :userId', { userId })
      .andWhere('session.status = :status', { status: 'active' })
      .andWhere('session.logoutAt IS NULL')
      .andWhere('session.expiredAt > :now', { now: new Date() });

    if (excludedDeviceId) {
      query.andWhere('session.deviceId != :excludedDeviceId', {
        excludedDeviceId,
      });
    }

    return await query.getCount();
  }

  async revokeActiveSessionByDevice(deviceId: string) {
    await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({
        status: 'revoked',
        logoutAt: new Date(),
      })
      .where('device_id = :deviceId', { deviceId })
      .andWhere('status = :status', { status: 'active' })
      .andWhere('logout_at IS NULL')
      .execute();
  }

  async findById(sessionId: string) {
    return await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        status: 'active',
        logoutAt: IsNull(),
        expiredAt: MoreThan(new Date()),
      },
    });
  }

  async revokeSession(sessionId: string) {
    await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({
        status: 'revoked',
        logoutAt: new Date(),
      })
      .where('id = :sessionId', { sessionId })
      .andWhere('logout_at IS NULL')
      .execute();
  }

  /**
   * Revoke a session by ID, scoped to a specific user.
   * Idempotent: returns status without throwing on non-existent or already-revoked sessions.
   *
   * - existed=false: session does not belong to user (or doesn't exist at all)
   * - revoked=false, existed=true: session belongs to user but is already not active
   * - revoked=true, existed=true: session was active and has been revoked
   *
   * Requirements: R6.AC2, R6.AC3, R6.AC4, R6.AC8
   */
  async revokeById(
    sessionId: string,
    userId: string,
  ): Promise<{ revoked: boolean; existed: boolean }> {
    // First, check if the session exists and belongs to this user
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      // Session doesn't exist or doesn't belong to user
      return { revoked: false, existed: false };
    }

    // Session exists and belongs to user — check if it's currently active
    if (
      session.status !== 'active' ||
      session.logoutAt !== null ||
      session.expiredAt <= new Date()
    ) {
      // Already revoked/expired — idempotent, no changes
      return { revoked: false, existed: true };
    }

    // Session is active — revoke it
    await this.sessionRepository.update(sessionId, {
      status: 'revoked',
      logoutAt: new Date(),
    });

    return { revoked: true, existed: true };
  }

  async revokeOthersByUserId(
    userId: string,
    currentSessionId: string,
  ): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({
        status: 'revoked',
        logoutAt: new Date(),
      })
      .where('user_id = :userId', { userId })
      .andWhere('id != :currentSessionId', { currentSessionId })
      .andWhere('status = :status', { status: 'active' })
      .andWhere('logout_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }

  async findActiveByUserId(
    userId: string,
  ): Promise<(Session & { device: Device })[]> {
    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndMapOne(
        'session.device',
        Device,
        'device',
        'device.id = session.deviceId',
      )
      .where('session.userId = :userId', { userId })
      .andWhere('session.status = :status', { status: 'active' })
      .andWhere('session.logoutAt IS NULL')
      .andWhere('session.expiredAt > :now', { now: new Date() })
      .orderBy('session.loginAt', 'DESC')
      .getMany();

    return sessions as (Session & { device: Device })[];
  }

  /**
   * Revoke all active sessions for a user on a specific device type,
   * excluding a given device. Used by force-login (R8.AC5).
   *
   * @param userId - The user whose sessions to revoke
   * @param deviceType - The device type to target ('mobile' | 'desktop')
   * @param excludedDeviceId - The device to exclude from revocation (current device)
   * @param manager - Optional EntityManager for running within a transaction
   * @returns Number of sessions revoked
   */
  async revokeActiveByUserAndDeviceType(
    userId: string,
    deviceType: string,
    excludedDeviceId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager
      ? manager.getRepository(Session)
      : this.sessionRepository;

    const result = await repo
      .createQueryBuilder()
      .update(Session)
      .set({
        status: 'revoked',
        logoutAt: new Date(),
      })
      .where(
        'device_id IN (SELECT id FROM devices WHERE user_id = :userId AND device_type = :deviceType)',
        { userId, deviceType },
      )
      .andWhere('device_id != :excludedDeviceId', { excludedDeviceId })
      .andWhere('status = :status', { status: 'active' })
      .andWhere('logout_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Find active sessions for a user filtered by device type, excluding a specific device.
   * Inner joins devices by device_type to return session entities with mapped device info.
   * Used to build the 409 ACCOUNT_IN_USE_ON_ANOTHER_DEVICE payload.
   *
   * Requirements: R8.AC1
   */
  async findActiveSessionsByUserAndDeviceType(
    userId: string,
    deviceType: string,
    excludedDeviceId: string,
  ): Promise<(Session & { device: Device })[]> {
    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .innerJoinAndMapOne(
        'session.device',
        Device,
        'device',
        'device.id = session.deviceId AND device.deviceType = :deviceType',
        { deviceType },
      )
      .where('session.userId = :userId', { userId })
      .andWhere('session.status = :status', { status: 'active' })
      .andWhere('session.logoutAt IS NULL')
      .andWhere('session.expiredAt > :now', { now: new Date() })
      .andWhere('session.deviceId != :excludedDeviceId', { excludedDeviceId })
      .getMany();

    return sessions as (Session & { device: Device })[];
  }
}
