// Feature: auth-session-management, Property: resolveDeviceType is total and matches user-agent regex
// **Validates: Requirements R1.AC3, R1.AC4, R1.AC6**

import * as fc from 'fast-check';
import { resolveDeviceType, DeviceType } from '../resolve-device-type';

describe('resolveDeviceType — property-based tests', () => {
  it('should return "mobile" for any user-agent containing "mobi" (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.string(), fc.string()).map(([prefix, suffix]) => {
          // Insert 'mobi' in random case somewhere in the string
          const mobiVariants = ['mobi', 'Mobi', 'MOBI', 'mOBI', 'MoBi'];
          const variant =
            mobiVariants[Math.floor(Math.random() * mobiVariants.length)];
          return `${prefix}${variant}${suffix}`;
        }),
        (ua) => {
          expect(resolveDeviceType(ua)).toBe('mobile');
        },
      ),
      { numRuns: 200 },
    );
  });

  it('should return "desktop" for any user-agent NOT containing "mobi" (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.toLowerCase().includes('mobi')),
        (ua) => {
          expect(resolveDeviceType(ua)).toBe('desktop');
        },
      ),
      { numRuns: 200 },
    );
  });

  it('should always return either "mobile" or "desktop" for any arbitrary string', () => {
    fc.assert(
      fc.property(fc.string(), (ua) => {
        const result = resolveDeviceType(ua);
        expect(['mobile', 'desktop']).toContain(result);
      }),
      { numRuns: 200 },
    );
  });

  // Edge cases
  describe('edge cases', () => {
    it('should return "desktop" when userAgent is undefined', () => {
      expect(resolveDeviceType(undefined)).toBe('desktop');
    });

    it('should return "desktop" when userAgent is empty string', () => {
      expect(resolveDeviceType('')).toBe('desktop');
    });

    it('should return "mobile" for a very long string containing "mobi"', () => {
      const longString = `${'x'.repeat(10_000)}Mobile${'y'.repeat(10_000)}`;
      expect(resolveDeviceType(longString)).toBe('mobile');
    });

    it('should return "desktop" for a very long string without "mobi"', () => {
      const longString = 'x'.repeat(20_000);
      expect(resolveDeviceType(longString)).toBe('desktop');
    });

    it('should detect "mobi" in real-world mobile user-agents', () => {
      const mobileUAs = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      ];
      for (const ua of mobileUAs) {
        expect(resolveDeviceType(ua)).toBe('mobile');
      }
    });

    it('should return "desktop" for real-world desktop user-agents', () => {
      const desktopUAs = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      ];
      for (const ua of desktopUAs) {
        expect(resolveDeviceType(ua)).toBe('desktop');
      }
    });
  });
});
