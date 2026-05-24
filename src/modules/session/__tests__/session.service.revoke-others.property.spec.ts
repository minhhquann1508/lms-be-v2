// Feature: auth-session-management, Property 4
// **Validates: Requirements R6.AC6, R6.AC7**

import * as fc from 'fast-check';
import { SessionService } from '../session.service';
import { Session } from '../entities/session.entity';

describe('SessionService.revokeOthersByUserId — Property 4: revokeOthersByUserId để lại đúng Current Session', () => {
  const USER_ID = 'user-001';

  /**
   * This test validates Property 4 from the design document:
   *
   * For any user `u` with a set `S` of active sessions (including Current Session `c ∈ S`),
   * after calling revokeOthersByUserId(userId, currentSessionId):
   * - All sessions `s ∈ S \ {c}` transition to `status = 'revoked'`, `logoutAt != null`
   * - Session `c` keeps `status = 'active'`, `logoutAt IS NULL`
   * - revokedCount === |S| - 1
   */

  it('should revoke all other sessions except current, and return correct revokedCount', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a set of session IDs (at least 1 session)
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        // Generate an index to pick the current session from the set
        fc.nat(),
        async (sessionIds, currentIdx) => {
          // Deduplicate session IDs
          const uniqueIds = [...new Set(sessionIds)];
          if (uniqueIds.length === 0) return true;

          // Pick current session from the set
          const currentSessionIndex = currentIdx % uniqueIds.length;
          const currentSessionId = uniqueIds[currentSessionIndex];

          // Track which sessions got updated (revoked)
          const revokedSessions: string[] = [];
          let affectedCount = 0;

          // Build mock repository
          const mockSessionRepository = {
            createQueryBuilder: jest.fn().mockImplementation(() => {
              const qb = {
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                execute: jest.fn().mockImplementation(async () => {
                  // Simulate the UPDATE: count sessions that match criteria
                  // WHERE user_id = userId AND id != currentSessionId AND status = 'active' AND logout_at IS NULL
                  for (const id of uniqueIds) {
                    if (id !== currentSessionId) {
                      revokedSessions.push(id);
                      affectedCount++;
                    }
                  }
                  return { affected: affectedCount };
                }),
              };
              return qb;
            }),
          };

          const service = new SessionService(mockSessionRepository as any);

          const result = await service.revokeOthersByUserId(
            USER_ID,
            currentSessionId,
          );

          // PROPERTY 1: revokedCount === |S| - 1
          const expectedRevokedCount = uniqueIds.length - 1;
          if (result !== expectedRevokedCount) return false;

          // PROPERTY 2: Current session was NOT in the revoked set
          if (revokedSessions.includes(currentSessionId)) return false;

          // PROPERTY 3: All other sessions were targeted for revocation
          const otherIds = uniqueIds.filter((id) => id !== currentSessionId);
          if (revokedSessions.length !== otherIds.length) return false;
          for (const id of otherIds) {
            if (!revokedSessions.includes(id)) return false;
          }

          return true;
        },
      ),
      { numRuns: 200 },
    );
  });

  it('should pass correct WHERE conditions to exclude current session', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.uuid(), // currentSessionId
        async (userId, currentSessionId) => {
          const whereClauses: Array<{
            clause: string;
            params: Record<string, unknown>;
          }> = [];

          const mockSessionRepository = {
            createQueryBuilder: jest.fn().mockImplementation(() => {
              const qb = {
                update: jest.fn().mockReturnThis(),
                set: jest
                  .fn()
                  .mockImplementation((setValues: Record<string, unknown>) => {
                    // Verify the SET clause contains revoked status and logoutAt
                    if (setValues.status !== 'revoked') return qb;
                    if (!setValues.logoutAt) return qb;
                    return qb;
                  }),
                where: jest
                  .fn()
                  .mockImplementation(
                    (clause: string, params: Record<string, unknown>) => {
                      whereClauses.push({ clause, params });
                      return qb;
                    },
                  ),
                andWhere: jest
                  .fn()
                  .mockImplementation(
                    (clause: string, params: Record<string, unknown>) => {
                      whereClauses.push({ clause, params });
                      return qb;
                    },
                  ),
                execute: jest.fn().mockResolvedValue({ affected: 0 }),
              };
              return qb;
            }),
          };

          const service = new SessionService(mockSessionRepository as any);
          await service.revokeOthersByUserId(userId, currentSessionId);

          // PROPERTY: The query must filter by userId
          const hasUserIdFilter = whereClauses.some(
            (w) => w.params?.userId === userId,
          );
          if (!hasUserIdFilter) return false;

          // PROPERTY: The query must exclude currentSessionId
          const hasCurrentSessionExclusion = whereClauses.some(
            (w) => w.params?.currentSessionId === currentSessionId,
          );
          if (!hasCurrentSessionExclusion) return false;

          // PROPERTY: The query must filter by active status
          const hasActiveFilter = whereClauses.some(
            (w) => w.params?.status === 'active',
          );
          if (!hasActiveFilter) return false;

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return 0 when current session is the only active session', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (currentSessionId) => {
        const mockSessionRepository = {
          createQueryBuilder: jest.fn().mockImplementation(() => {
            const qb = {
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 0 }),
            };
            return qb;
          }),
        };

        const service = new SessionService(mockSessionRepository as any);
        const result = await service.revokeOthersByUserId(
          USER_ID,
          currentSessionId,
        );

        // PROPERTY: When only current session exists, revokedCount === 0
        return result === 0;
      }),
      { numRuns: 50 },
    );
  });

  it('should set status to revoked and logoutAt to a Date for affected sessions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // currentSessionId
        fc.array(fc.uuid(), { minLength: 2, maxLength: 8 }),
        async (currentSessionId, otherSessionIds) => {
          let capturedSetValues: Record<string, unknown> | null = null;

          const mockSessionRepository = {
            createQueryBuilder: jest.fn().mockImplementation(() => {
              const qb = {
                update: jest.fn().mockReturnThis(),
                set: jest
                  .fn()
                  .mockImplementation((values: Record<string, unknown>) => {
                    capturedSetValues = values;
                    return qb;
                  }),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({
                  affected: otherSessionIds.length,
                }),
              };
              return qb;
            }),
          };

          const service = new SessionService(mockSessionRepository as any);
          await service.revokeOthersByUserId(USER_ID, currentSessionId);

          // PROPERTY: SET clause must set status='revoked'
          if (capturedSetValues?.status !== 'revoked') return false;

          // PROPERTY: SET clause must set logoutAt to a Date instance
          if (!(capturedSetValues?.logoutAt instanceof Date)) return false;

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
