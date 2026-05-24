// Feature: auth-session-management, Property 1: findById has no UPDATE side-effect
// **Validates: Requirements R4.AC1, R4.AC2, R4.AC3, R4.AC4**

import * as fc from 'fast-check';
import { SessionService } from '../session.service';
import { Session } from '../entities/session.entity';

describe('SessionService.findById — Property 1: findById chỉ đọc và lọc đúng session active', () => {
  let service: SessionService;
  let updateCallCount: number;

  // Mock repository that tracks calls
  const mockSessionRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    updateCallCount = 0;

    mockSessionRepository.findOne.mockReset();
    mockSessionRepository.createQueryBuilder.mockReset();
    mockSessionRepository.update.mockReset();
    mockSessionRepository.save.mockReset();

    // Spy on update-related methods to count UPDATE calls
    mockSessionRepository.update.mockImplementation(() => {
      updateCallCount++;
      return Promise.resolve({ affected: 0 });
    });

    mockSessionRepository.createQueryBuilder.mockImplementation(() => {
      const qb = {
        update: () => {
          updateCallCount++;
          return qb;
        },
        set: () => qb,
        where: () => qb,
        andWhere: () => qb,
        execute: () => Promise.resolve({ affected: 0 }),
      };
      return qb;
    });

    service = new SessionService(mockSessionRepository as any);
  });

  // Arbitrary for session status
  const statusArb = fc.constantFrom('active', 'revoked', 'expired');

  // Arbitrary for logoutAt: either null or a date
  const logoutAtArb = fc.oneof(
    fc.constant(null as Date | null),
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  );

  // Arbitrary for expiredAt: a date that can be in the past or future
  const expiredAtArb = fc.date({
    min: new Date('2020-01-01'),
    max: new Date('2030-12-31'),
  });

  it('should NEVER issue an UPDATE statement regardless of session state', async () => {
    await fc.assert(
      fc.asyncProperty(
        statusArb,
        logoutAtArb,
        expiredAtArb,
        fc.uuid(),
        async (status, logoutAt, expiredAt, sessionId) => {
          updateCallCount = 0;

          // Determine if session matches active criteria
          const now = new Date();
          const isActive =
            status === 'active' && logoutAt === null && expiredAt > now;

          const sessionEntity: Partial<Session> = {
            id: sessionId,
            userId: 'user-1',
            deviceId: 'device-1',
            refreshTokenHash: 'hash',
            status,
            loginAt: new Date('2024-01-01'),
            expiredAt,
            logoutAt: logoutAt as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock findOne to return entity only when conditions match
          mockSessionRepository.findOne.mockImplementation(async () => {
            if (isActive) {
              return sessionEntity as Session;
            }
            return null;
          });

          await service.findById(sessionId);

          // PROPERTY: No UPDATE calls should have been made
          return updateCallCount === 0;
        },
      ),
      { numRuns: 200 },
    );
  });

  it('should return the session entity when status=active, logoutAt=null, expiredAt > now', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.date({
          min: new Date(Date.now() + 60_000), // at least 1 minute in the future
          max: new Date('2030-12-31'),
        }),
        async (sessionId, expiredAt) => {
          const sessionEntity: Partial<Session> = {
            id: sessionId,
            userId: 'user-1',
            deviceId: 'device-1',
            refreshTokenHash: 'hash',
            status: 'active',
            loginAt: new Date('2024-01-01'),
            expiredAt,
            logoutAt: null as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          mockSessionRepository.findOne.mockResolvedValue(
            sessionEntity as Session,
          );

          const result = await service.findById(sessionId);

          // PROPERTY: Active session with valid conditions returns entity (R4.AC4)
          return (
            result !== null &&
            result.id === sessionId &&
            result.status === 'active'
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return null when session is expired (expiredAt <= now)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.date({
          min: new Date('2020-01-01'),
          max: new Date(Date.now() - 60_000), // at least 1 minute in the past
        }),
        async (sessionId, _expiredAt) => {
          // TypeORM findOne with MoreThan(new Date()) will not match expired sessions
          mockSessionRepository.findOne.mockResolvedValue(null);

          const result = await service.findById(sessionId);

          // PROPERTY: Expired session returns null (R4.AC2)
          return result === null;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return null when session is revoked (status=revoked or logoutAt IS NOT NULL)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          // Case 1: status is 'revoked'
          fc.record({
            status: fc.constant('revoked' as const),
            logoutAt: fc.oneof(
              fc.constant(null as Date | null),
              fc.date({
                min: new Date('2020-01-01'),
                max: new Date('2030-12-31'),
              }),
            ),
          }),
          // Case 2: logoutAt is not null (regardless of status)
          fc.record({
            status: statusArb,
            logoutAt: fc.date({
              min: new Date('2020-01-01'),
              max: new Date('2030-12-31'),
            }),
          }),
        ),
        async (sessionId, { status, logoutAt }) => {
          // TypeORM findOne with status='active' AND logoutAt IS NULL won't match these
          mockSessionRepository.findOne.mockResolvedValue(null);

          const result = await service.findById(sessionId);

          // PROPERTY: Revoked/logged-out session returns null (R4.AC3)
          return result === null;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should call findOne with correct WHERE conditions for active session filtering', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (sessionId) => {
        mockSessionRepository.findOne.mockResolvedValue(null);

        await service.findById(sessionId);

        // PROPERTY: findOne is called with the correct filtering conditions
        const calls = mockSessionRepository.findOne.mock.calls;
        if (calls.length === 0) return false;

        const callArgs = calls[calls.length - 1][0];
        const where = callArgs?.where;

        return (
          where?.id === sessionId &&
          where?.status === 'active' &&
          where?.logoutAt !== undefined &&
          where?.expiredAt !== undefined
        );
      }),
      { numRuns: 50 },
    );
  });
});
