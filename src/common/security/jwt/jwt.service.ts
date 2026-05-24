import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService, JwtSignOptions } from '@nestjs/jwt';
import { AccessTokenPayload, RefreshTokenPayload } from '@src/common/types';

@Injectable()
export class JwtService {
  private readonly accessTokenExpiresIn = (process.env
    .JWT_ACCESS_TOKEN_EXPIRES_IN || '15m') as JwtSignOptions['expiresIn'];
  private readonly refreshTokenExpiresIn = (process.env
    .JWT_REFRESH_TOKEN_EXPIRES_IN || '30d') as JwtSignOptions['expiresIn'];

  constructor(private readonly jwt: NestJwtService) {}

  generateAccessToken(payload: AccessTokenPayload) {
    return this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  generateRefreshToken(payload: RefreshTokenPayload) {
    return this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  verifyAccessToken(token: string) {
    return this.jwt.verify(token, {
      secret: process.env.JWT_SECRET,
    });
  }

  verifyRefreshToken(token: string) {
    return this.jwt.verify(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }
}
