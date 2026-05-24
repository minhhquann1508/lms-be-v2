import {
  getRefreshTokenCookieOptions,
  clearRefreshTokenCookie,
} from '../cookie.util';
import * as fc from 'fast-check';

// Feature: auth-session-management, Property: cookie options invariants
describe('cookie.util — property-based tests', () => {
  /**
   * Validates: Requirements R10.AC1
   * Property: For any REFRESH_TOKEN_TTL_DAYS ∈ ℤ⁺ in [1, 365], maxAge === days * 86_400_000
   */
  it('maxAge equals days * 86_400_000 for any positive integer TTL in [1, 365]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 365 }), (days) => {
        const opts = getRefreshTokenCookieOptions({
          REFRESH_TOKEN_TTL_DAYS: String(days),
        });
        expect(opts.maxAge).toBe(days * 86_400_000);
      }),
    );
  });

  /**
   * Validates: Requirements R10.AC2, R10.AC3
   * Property: NODE_ENV === 'production' ⇒ secure === true; otherwise secure === false
   */
  it('secure is true only when NODE_ENV is production', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('production'),
          fc.constant('development'),
          fc.constant('test'),
          fc.constant('staging'),
          fc.constant(''),
          fc.constant(undefined),
        ),
        (nodeEnv) => {
          const env: NodeJS.ProcessEnv = {};
          if (nodeEnv !== undefined) {
            env.NODE_ENV = nodeEnv;
          }
          const opts = getRefreshTokenCookieOptions(env);
          if (nodeEnv === 'production') {
            expect(opts.secure).toBe(true);
          } else {
            expect(opts.secure).toBe(false);
          }
        },
      ),
    );
  });

  /**
   * Validates: Requirements R10.AC4, R10.AC2, R10.AC3
   * Property: httpOnly is always true, sameSite is always 'lax', path is always '/'
   */
  it('httpOnly is always true, sameSite is always lax, path is always /', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        fc.oneof(
          fc.constant('production'),
          fc.constant('development'),
          fc.constant('test'),
          fc.constant(''),
          fc.constant(undefined),
        ),
        (days, nodeEnv) => {
          const env: NodeJS.ProcessEnv = {
            REFRESH_TOKEN_TTL_DAYS: String(days),
          };
          if (nodeEnv !== undefined) {
            env.NODE_ENV = nodeEnv;
          }
          const opts = getRefreshTokenCookieOptions(env);
          expect(opts.httpOnly).toBe(true);
          expect(opts.sameSite).toBe('lax');
          expect(opts.path).toBe('/');
        },
      ),
    );
  });
});

describe('cookie.util', () => {
  describe('getRefreshTokenCookieOptions', () => {
    it('should return httpOnly: true in all environments', () => {
      const opts = getRefreshTokenCookieOptions({ NODE_ENV: 'development' });
      expect(opts.httpOnly).toBe(true);

      const prodOpts = getRefreshTokenCookieOptions({
        NODE_ENV: 'production',
      });
      expect(prodOpts.httpOnly).toBe(true);
    });

    it('should return secure: true when NODE_ENV is production', () => {
      const opts = getRefreshTokenCookieOptions({ NODE_ENV: 'production' });
      expect(opts.secure).toBe(true);
    });

    it('should return secure: false when NODE_ENV is not production', () => {
      const opts = getRefreshTokenCookieOptions({ NODE_ENV: 'development' });
      expect(opts.secure).toBe(false);

      const opts2 = getRefreshTokenCookieOptions({ NODE_ENV: 'test' });
      expect(opts2.secure).toBe(false);

      const opts3 = getRefreshTokenCookieOptions({});
      expect(opts3.secure).toBe(false);
    });

    it('should return sameSite: lax in all environments', () => {
      const opts = getRefreshTokenCookieOptions({ NODE_ENV: 'production' });
      expect(opts.sameSite).toBe('lax');

      const opts2 = getRefreshTokenCookieOptions({ NODE_ENV: 'development' });
      expect(opts2.sameSite).toBe('lax');
    });

    it('should return path: /', () => {
      const opts = getRefreshTokenCookieOptions({});
      expect(opts.path).toBe('/');
    });

    it('should compute maxAge from REFRESH_TOKEN_TTL_DAYS env (default 30)', () => {
      const opts = getRefreshTokenCookieOptions({});
      expect(opts.maxAge).toBe(30 * 86_400_000);
    });

    it('should compute maxAge from custom REFRESH_TOKEN_TTL_DAYS', () => {
      const opts = getRefreshTokenCookieOptions({
        REFRESH_TOKEN_TTL_DAYS: '7',
      });
      expect(opts.maxAge).toBe(7 * 86_400_000);
    });

    it('should default to 30 days when REFRESH_TOKEN_TTL_DAYS is invalid', () => {
      const opts = getRefreshTokenCookieOptions({
        REFRESH_TOKEN_TTL_DAYS: 'abc',
      });
      expect(opts.maxAge).toBe(30 * 86_400_000);
    });
  });

  describe('clearRefreshTokenCookie', () => {
    it('should call res.clearCookie with refreshToken and correct options', () => {
      const mockRes = {
        clearCookie: jest.fn(),
      } as any;

      const env = { NODE_ENV: 'production', REFRESH_TOKEN_TTL_DAYS: '14' };
      clearRefreshTokenCookie(mockRes, env);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        getRefreshTokenCookieOptions(env),
      );
    });
  });
});
