// Tách thành utility để set và clear dùng CHUNG options (R10.AC5)
import { CookieOptions, Response } from 'express';

/**
 * Trả về CookieOptions cho refresh token cookie.
 * - httpOnly: true (R10.AC4)
 * - secure: true khi production (R10.AC2), false khi không phải production (R10.AC3)
 * - sameSite: 'lax' (D4 + R10.AC2-3)
 * - maxAge: REFRESH_TOKEN_TTL_DAYS * 86_400_000 ms (R10.AC1)
 * - path: '/'
 */
export function getRefreshTokenCookieOptions(
  env: NodeJS.ProcessEnv,
): CookieOptions {
  const days = Number(env.REFRESH_TOKEN_TTL_DAYS) || 30;
  const isProd = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: days * 86_400_000,
    path: '/',
  };
}

/**
 * Xoá cookie refreshToken với cùng options đã dùng khi set (R10.AC5).
 */
export function clearRefreshTokenCookie(
  res: Response,
  env: NodeJS.ProcessEnv,
): void {
  res.clearCookie('refreshToken', getRefreshTokenCookieOptions(env));
}
