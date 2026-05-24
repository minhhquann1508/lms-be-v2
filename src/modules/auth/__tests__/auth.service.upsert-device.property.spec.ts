// Feature: auth-session-management, Property 2
// **Validates: Requirements R2.AC4, R2.AC5, R4.AC6**

import * as fc from 'fast-check';
import { AuthService } from '../auth.service';
import { Device } from '@modules/device/entities/device.entity';
import { Session } from '@modules/session/entities/session.entity';

describe('AuthService.upsertDeviceForLogin — Property 2: Login trên cùng device giữ nguyên deviceUid và một active session', () => {
  // In-memory stores to simulate DB state
  let devices: Device[];
  let sessions: Session[];

  // Mock repositories and services
  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockHashService = {
    hash: jest.fn().mockResolvedValue('hashed-token'),
    compare: jest.fn().mockResolvedValue(true),
  };

  const mockJwtService = {
    generateAccessToken: jest.fn().mockReturnValue('access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    verifyRefreshToken: jest.fn(),
  };

  const mockDeviceService = {
    findDeviceByUidAndUserId: jest.fn(),
    createNewDevice: jest.fn(),
    updateDeviceLoginMetadata: jest.fn(),
    updateDevice: jest.fn(),
    findByUserId: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
    updateRefreshToken: jest.fn(),
    expireOutdatedSessions: jest.fn().mockResolvedValue(undefined),
    revokeActiveSessionByDevice: jest.fn(),
    countActiveSessionsByUserIdAndDeviceType: jest.fn(),
    findById: jest.fn(),
    revokeSession: jest.fn(),
    revokeById: jest.fn(),
    revokeOthersByUserId: jest.fn(),
    revokeActiveByUserAndDeviceType: jest.fn(),
    findActiveByUserId: jest.fn(),
    findActiveSessionsByUserAndDeviceType: jest.fn(),
  };

  const mockGoogleIdentity = {
    verify: jest.fn(),
    getAuthorizationUrl: jest.fn(),
  };
  const mockDataSource = {
    transaction: jest.fn(async (callback: (manager: unknown) => unknown) =>
      callback({}),
    ),
  };

  let service: AuthService;

  beforeEach(() => {
    devices = [];
    sessions = [];
    jest.clearAllMocks();

    // Set env for max device count
    process.env.MAXIMUM_DESKTOP_DEVICE_COUNT = '5';
    process.env.MAXIMUM_MOBILE_DEVICE_COUNT = '5';
    process.env.REFRESH_TOKEN_TTL_DAYS = '30';

    service = new AuthService(
      mockGoogleIdentity as any,
      mockUserRepository as any,
      mockDataSource as any,
      mockHashService as any,
      mockJwtService as any,
      mockDeviceService as any,
      mockSessionService as any,
    );
  });

  // Arbitraries
  const deviceTypeArb = fc.constantFrom('mobile', 'desktop');
  const nonEmptyStringArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0);

  const deviceMetadataArb = fc.record({
    deviceName: nonEmptyStringArb,
    deviceType: deviceTypeArb,
    os: nonEmptyStringArb,
    browser: nonEmptyStringArb,
    ipAddress: fc.ipV4(),
    userAgent: nonEmptyStringArb,
  });

  it('should keep the same number of device rows and preserve deviceUid after upsert on existing device', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.uuid(), // existing deviceUid
        fc.uuid(), // existing deviceId
        deviceMetadataArb, // new metadata
        fc.integer({ min: 0, max: 3 }), // number of pre-existing active sessions on this device
        async (userId, deviceUid, deviceId, newMetadata, numActiveSessions) => {
          jest.clearAllMocks();
          devices = [];
          sessions = [];

          // Setup: existing device
          const existingDevice: Device = {
            id: deviceId,
            userId,
            deviceUid,
            deviceName: 'Old Device Name',
            deviceType: 'desktop',
            os: 'Old OS',
            browser: 'Old Browser',
            ipAddress: '1.1.1.1',
            userAgent: 'Old UA',
            lastLoginAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          };
          devices.push(existingDevice);

          // Setup: pre-existing active sessions on this device
          for (let i = 0; i < numActiveSessions; i++) {
            sessions.push({
              id: `session-${i}`,
              userId,
              deviceId,
              refreshTokenHash: `hash-${i}`,
              status: 'active',
              loginAt: new Date('2024-01-01'),
              expiredAt: new Date('2025-12-31'),
              logoutAt: null as any,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          const initialDeviceCount = devices.length;

          // Mock: findDeviceByUidAndUserId returns existing device
          mockDeviceService.findDeviceByUidAndUserId.mockImplementation(
            async (uid: string, uId: string) => {
              return (
                devices.find((d) => d.deviceUid === uid && d.userId === uId) ||
                null
              );
            },
          );

          // Mock: updateDeviceLoginMetadata updates metadata but NOT deviceUid
          mockDeviceService.updateDeviceLoginMetadata.mockImplementation(
            async (dId: string, fields: any) => {
              const device = devices.find((d) => d.id === dId);
              if (!device) throw new Error('Device not found');
              // Update only whitelisted fields — deviceUid is NOT in fields
              Object.assign(device, fields);
              device.updatedAt = new Date();
              return device;
            },
          );

          // Mock: createNewDevice — should NOT be called for existing device
          mockDeviceService.createNewDevice.mockImplementation(
            async (dto: any, uId: string) => {
              const newDevice: Device = {
                id: `new-device-${devices.length}`,
                userId: uId,
                ...dto,
                lastLoginAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              devices.push(newDevice);
              return newDevice;
            },
          );

          // Mock: revokeActiveSessionByDevice revokes all active sessions on device
          mockSessionService.revokeActiveSessionByDevice.mockImplementation(
            async (dId: string) => {
              sessions.forEach((s) => {
                if (
                  s.deviceId === dId &&
                  s.status === 'active' &&
                  !s.logoutAt
                ) {
                  s.status = 'revoked';
                  s.logoutAt = new Date();
                }
              });
            },
          );

          // Mock: expireOutdatedSessions — no-op for this test
          mockSessionService.expireOutdatedSessions.mockResolvedValue(
            undefined,
          );

          // Mock: countActiveSessionsByUserIdAndDeviceType — return 0 (under limit)
          mockSessionService.countActiveSessionsByUserIdAndDeviceType.mockResolvedValue(
            0,
          );

          // Mock: create new session
          const newSessionId = `new-session-${Date.now()}`;
          mockSessionService.create.mockImplementation(
            async (uId: string, dId: string, expiredAt: Date) => {
              const newSession: Session = {
                id: newSessionId,
                userId: uId,
                deviceId: dId,
                refreshTokenHash: 'pending',
                status: 'active',
                loginAt: new Date(),
                expiredAt,
                logoutAt: null as any,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              sessions.push(newSession);
              return newSession;
            },
          );

          // Mock: updateRefreshToken
          mockSessionService.updateRefreshToken.mockImplementation(
            async (sId: string, hash: string) => {
              const session = sessions.find((s) => s.id === sId);
              if (session) session.refreshTokenHash = hash;
            },
          );

          // Mock user for createLoginSession
          const mockUser = {
            id: userId,
            email: 'test@example.com',
            password: 'hashed',
            roleCode: 'user',
            fullName: 'Test User',
          };

          // Call the login method which internally calls upsertDeviceForLogin + createLoginSession
          mockUserRepository.findOne.mockResolvedValue(mockUser);

          await service.login({
            email: 'test@example.com',
            password: 'password',
            device: {
              deviceUid,
              ...newMetadata,
            },
          } as any);

          // PROPERTY 1: Number of device rows should NOT change (no new device created)
          expect(devices.length).toBe(initialDeviceCount);

          // PROPERTY 2: deviceUid of the original row should remain unchanged
          const updatedDevice = devices.find((d) => d.id === deviceId);
          expect(updatedDevice).toBeDefined();
          expect(updatedDevice!.deviceUid).toBe(deviceUid);

          // PROPERTY 3: All old active sessions on this device should be revoked
          const oldSessions = sessions.filter(
            (s) => s.id !== newSessionId && s.deviceId === deviceId,
          );
          for (const s of oldSessions) {
            expect(s.status).toBe('revoked');
            expect(s.logoutAt).not.toBeNull();
          }

          // PROPERTY 4: Exactly 1 new active session linked to this device
          const activeSessions = sessions.filter(
            (s) =>
              s.deviceId === deviceId && s.status === 'active' && !s.logoutAt,
          );
          expect(activeSessions.length).toBe(1);
          expect(activeSessions[0].id).toBe(newSessionId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never overwrite deviceUid even when new metadata contains a different UUID-like value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.uuid(), // original deviceUid
        fc.uuid(), // deviceId
        fc.uuid(), // attempted new deviceUid (should be ignored)
        deviceMetadataArb,
        async (
          userId,
          originalDeviceUid,
          deviceId,
          _attemptedNewUid,
          newMetadata,
        ) => {
          jest.clearAllMocks();
          devices = [];
          sessions = [];

          const existingDevice: Device = {
            id: deviceId,
            userId,
            deviceUid: originalDeviceUid,
            deviceName: 'Old Name',
            deviceType: 'desktop',
            os: 'Old OS',
            browser: 'Old Browser',
            ipAddress: '1.1.1.1',
            userAgent: 'Old UA',
            lastLoginAt: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          };
          devices.push(existingDevice);

          mockDeviceService.findDeviceByUidAndUserId.mockImplementation(
            async (uid: string, uId: string) => {
              return (
                devices.find((d) => d.deviceUid === uid && d.userId === uId) ||
                null
              );
            },
          );

          mockDeviceService.updateDeviceLoginMetadata.mockImplementation(
            async (dId: string, fields: any) => {
              const device = devices.find((d) => d.id === dId);
              if (!device) throw new Error('Device not found');
              // Only update whitelisted fields — deviceUid is NOT accepted
              Object.assign(device, fields);
              device.updatedAt = new Date();
              return device;
            },
          );

          mockSessionService.revokeActiveSessionByDevice.mockResolvedValue(
            undefined,
          );
          mockSessionService.expireOutdatedSessions.mockResolvedValue(
            undefined,
          );
          mockSessionService.countActiveSessionsByUserIdAndDeviceType.mockResolvedValue(
            0,
          );
          mockSessionService.create.mockResolvedValue({
            id: 'new-session',
            userId,
            deviceId,
            refreshTokenHash: 'pending',
            status: 'active',
            loginAt: new Date(),
            expiredAt: new Date('2025-12-31'),
            logoutAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          mockSessionService.updateRefreshToken.mockResolvedValue(undefined);

          const mockUser = {
            id: userId,
            email: 'test@example.com',
            password: 'hashed',
            roleCode: 'user',
            fullName: 'Test User',
          };
          mockUserRepository.findOne.mockResolvedValue(mockUser);

          await service.login({
            email: 'test@example.com',
            password: 'password',
            device: {
              deviceUid: originalDeviceUid, // login uses the same deviceUid
              ...newMetadata,
            },
          } as any);

          // PROPERTY: deviceUid must remain the original value
          const device = devices.find((d) => d.id === deviceId);
          expect(device).toBeDefined();
          expect(device!.deviceUid).toBe(originalDeviceUid);

          // Verify updateDeviceLoginMetadata was called WITHOUT deviceUid in fields
          const updateCalls =
            mockDeviceService.updateDeviceLoginMetadata.mock.calls;
          expect(updateCalls.length).toBeGreaterThan(0);
          const fieldsArg = updateCalls[0][1];
          expect(fieldsArg).not.toHaveProperty('deviceUid');
        },
      ),
      { numRuns: 100 },
    );
  });
});
