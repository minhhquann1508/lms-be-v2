import * as crypto from 'crypto';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ValidationErrorCode } from '@src/common/constants';

export interface OAuthStatePayload {
  lang: string;
  deviceUid: string;
}

interface SignedState extends OAuthStatePayload {
  nonce: string;
  exp: number;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes — R11.AC3

@Injectable()
export class OAuthStateService {
  private readonly secret = process.env.OAUTH_STATE_SECRET ?? '';
  private readonly logger = new Logger(OAuthStateService.name);

  /**
   * Signs an OAuth state payload with HMAC-SHA256.
   * Returns `${base64url(json)}.${hmac}` format.
   *
   * R11.AC1: state = {lang, deviceUid, nonce, exp} signed with HMAC-SHA256
   * R11.AC2: nonce = crypto.randomBytes(16).toString('hex')
   * R11.AC3: exp = Date.now() + 10 minutes
   */
  sign(payload: OAuthStatePayload): string {
    const state: SignedState = {
      ...payload,
      nonce: crypto.randomBytes(16).toString('hex'),
      exp: Date.now() + TTL_MS,
    };
    const json = Buffer.from(JSON.stringify(state)).toString('base64url');
    const hmac = crypto
      .createHmac('sha256', this.secret)
      .update(json)
      .digest('base64url');
    return `${json}.${hmac}`;
  }

  /**
   * Verifies an OAuth state string.
   * Checks format, HMAC signature (timing-safe), and expiration.
   * Throws HttpException with OAUTH_STATE_INVALID on any failure.
   *
   * R11.AC4: verify signature + check exp > Date.now()
   */
  verify(state: string): OAuthStatePayload {
    if (!state?.includes('.')) {
      throw new HttpException(ValidationErrorCode.OAUTH_STATE_INVALID, 400);
    }

    const dotIndex = state.indexOf('.');
    const json = state.substring(0, dotIndex);
    const hmac = state.substring(dotIndex + 1);

    const expected = crypto
      .createHmac('sha256', this.secret)
      .update(json)
      .digest('base64url');

    // Use timingSafeEqual to prevent timing side-channel attacks
    const hmacBuffer = Buffer.from(hmac);
    const expectedBuffer = Buffer.from(expected);

    if (
      hmacBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(hmacBuffer, expectedBuffer)
    ) {
      throw new HttpException(ValidationErrorCode.OAUTH_STATE_INVALID, 400);
    }

    let parsed: SignedState;
    try {
      parsed = JSON.parse(Buffer.from(json, 'base64url').toString('utf-8'));
    } catch {
      throw new HttpException(ValidationErrorCode.OAUTH_STATE_INVALID, 400);
    }

    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      throw new HttpException(ValidationErrorCode.OAUTH_STATE_INVALID, 400);
    }

    return { lang: parsed.lang, deviceUid: parsed.deviceUid };
  }
}
