/**
 * Fail-fast: ensure OAUTH_STATE_SECRET is configured in production.
 * Only checks this single env var — other startup validations (DB, config)
 * remain handled by NestJS's own error handling.
 * @see Requirements R11.AC6
 */
export function assertOAuthStateSecret(): void {
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.OAUTH_STATE_SECRET
  ) {
    console.error(
      '[FATAL] OAUTH_STATE_SECRET is required in production but was not set.',
    );
    throw new Error('OAUTH_STATE_SECRET is required in production');
  }
}
