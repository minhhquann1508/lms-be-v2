import { assertOAuthStateSecret } from '../common/helpers/assert-oauth-state-secret';

describe('assertOAuthStateSecret', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw when NODE_ENV is production and OAUTH_STATE_SECRET is not set', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.OAUTH_STATE_SECRET;

    expect(() => assertOAuthStateSecret()).toThrow(
      'OAUTH_STATE_SECRET is required in production',
    );
  });

  it('should throw when NODE_ENV is production and OAUTH_STATE_SECRET is empty string', () => {
    process.env.NODE_ENV = 'production';
    process.env.OAUTH_STATE_SECRET = '';

    expect(() => assertOAuthStateSecret()).toThrow(
      'OAUTH_STATE_SECRET is required in production',
    );
  });

  it('should not throw when NODE_ENV is production and OAUTH_STATE_SECRET is set', () => {
    process.env.NODE_ENV = 'production';
    process.env.OAUTH_STATE_SECRET = 'my-secret-key';

    expect(() => assertOAuthStateSecret()).not.toThrow();
  });

  it('should not throw when NODE_ENV is development regardless of OAUTH_STATE_SECRET', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.OAUTH_STATE_SECRET;

    expect(() => assertOAuthStateSecret()).not.toThrow();
  });

  it('should not throw when NODE_ENV is undefined regardless of OAUTH_STATE_SECRET', () => {
    delete process.env.NODE_ENV;
    delete process.env.OAUTH_STATE_SECRET;

    expect(() => assertOAuthStateSecret()).not.toThrow();
  });

  it('should log error before throwing in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.OAUTH_STATE_SECRET;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => assertOAuthStateSecret()).toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[FATAL] OAUTH_STATE_SECRET is required in production but was not set.',
    );

    consoleSpy.mockRestore();
  });
});
