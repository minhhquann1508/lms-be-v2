import { HttpException } from '@nestjs/common';
import { OAuthStateService } from '../oauth-state.service';

describe('OAuthStateService', () => {
  const TEST_SECRET = 'test-secret-key-for-hmac';
  let service: OAuthStateService;

  beforeEach(() => {
    process.env.OAUTH_STATE_SECRET = TEST_SECRET;
    service = new OAuthStateService();
  });

  afterEach(() => {
    delete process.env.OAUTH_STATE_SECRET;
    jest.restoreAllMocks();
  });

  describe('sign', () => {
    it('should return a string in format "json.hmac"', () => {
      const result = service.sign({ lang: 'vi', deviceUid: 'abc-123' });
      expect(result).toContain('.');
      const parts = result.split('.');
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it('should include lang, deviceUid, nonce, and exp in the payload', () => {
      const result = service.sign({ lang: 'en', deviceUid: 'device-uid-1' });
      const [json] = result.split('.');
      const payload = JSON.parse(
        Buffer.from(json, 'base64url').toString('utf-8'),
      );

      expect(payload.lang).toBe('en');
      expect(payload.deviceUid).toBe('device-uid-1');
      expect(payload.nonce).toMatch(/^[0-9a-f]{32}$/);
      expect(typeof payload.exp).toBe('number');
    });

    it('should set exp to approximately 10 minutes from now', () => {
      const before = Date.now();
      const result = service.sign({ lang: 'vi', deviceUid: 'uid' });
      const after = Date.now();

      const [json] = result.split('.');
      const payload = JSON.parse(
        Buffer.from(json, 'base64url').toString('utf-8'),
      );

      const tenMinMs = 10 * 60 * 1000;
      expect(payload.exp).toBeGreaterThanOrEqual(before + tenMinMs);
      expect(payload.exp).toBeLessThanOrEqual(after + tenMinMs);
    });

    it('should generate unique nonces for each call', () => {
      const r1 = service.sign({ lang: 'vi', deviceUid: 'uid' });
      const r2 = service.sign({ lang: 'vi', deviceUid: 'uid' });

      const p1 = JSON.parse(
        Buffer.from(r1.split('.')[0], 'base64url').toString('utf-8'),
      );
      const p2 = JSON.parse(
        Buffer.from(r2.split('.')[0], 'base64url').toString('utf-8'),
      );

      expect(p1.nonce).not.toBe(p2.nonce);
    });
  });

  describe('verify', () => {
    it('should return the original payload for a valid state', () => {
      const state = service.sign({ lang: 'vi', deviceUid: 'my-device' });
      const result = service.verify(state);

      expect(result).toEqual({ lang: 'vi', deviceUid: 'my-device' });
    });

    it('should throw OAUTH_STATE_INVALID for empty string', () => {
      expect(() => service.verify('')).toThrow(HttpException);
      try {
        service.verify('');
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(400);
        expect((e as HttpException).getResponse()).toBe('OAUTH_STATE_INVALID');
      }
    });

    it('should throw OAUTH_STATE_INVALID for string without dot', () => {
      expect(() => service.verify('nodothere')).toThrow(HttpException);
    });

    it('should throw OAUTH_STATE_INVALID for tampered HMAC', () => {
      const state = service.sign({ lang: 'vi', deviceUid: 'uid' });
      const [json] = state.split('.');
      const tamperedState = `${json}.tampered-hmac`;

      expect(() => service.verify(tamperedState)).toThrow(HttpException);
    });

    it('should throw OAUTH_STATE_INVALID for tampered payload', () => {
      const state = service.sign({ lang: 'vi', deviceUid: 'uid' });
      const [, hmac] = state.split('.');

      const fakePayload = Buffer.from(
        JSON.stringify({
          lang: 'en',
          deviceUid: 'hacked',
          nonce: 'x',
          exp: Date.now() + 999999,
        }),
      ).toString('base64url');

      expect(() => service.verify(`${fakePayload}.${hmac}`)).toThrow(
        HttpException,
      );
    });

    it('should throw OAUTH_STATE_INVALID for expired state', () => {
      // Mock Date.now to create an already-expired state
      const realNow = Date.now;
      const pastTime = Date.now() - 11 * 60 * 1000; // 11 minutes ago
      jest.spyOn(Date, 'now').mockReturnValue(pastTime);

      const state = service.sign({ lang: 'vi', deviceUid: 'uid' });

      // Restore Date.now for verify
      jest.spyOn(Date, 'now').mockReturnValue(realNow());

      expect(() => service.verify(state)).toThrow(HttpException);
    });

    it('should throw OAUTH_STATE_INVALID for invalid base64url JSON', () => {
      // Create a valid HMAC for garbage data
      const crypto = require('crypto');
      const garbage = 'not-valid-base64url-json!!!';
      const hmac = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(garbage)
        .digest('base64url');

      expect(() => service.verify(`${garbage}.${hmac}`)).toThrow(HttpException);
    });

    it('should throw OAUTH_STATE_INVALID when signed with a different secret', () => {
      const state = service.sign({ lang: 'vi', deviceUid: 'uid' });

      // Create a new service with a different secret
      process.env.OAUTH_STATE_SECRET = 'different-secret';
      const otherService = new OAuthStateService();

      expect(() => otherService.verify(state)).toThrow(HttpException);
    });

    it('should use timingSafeEqual for HMAC comparison (length mismatch throws)', () => {
      const state = service.sign({ lang: 'vi', deviceUid: 'uid' });
      const [json] = state.split('.');
      // Short HMAC that differs in length from expected
      const shortHmac = 'abc';

      expect(() => service.verify(`${json}.${shortHmac}`)).toThrow(
        HttpException,
      );
    });
  });
});
