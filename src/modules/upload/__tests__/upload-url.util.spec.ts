import { buildUploadUrl, UPLOADS_STATIC_PREFIXES } from '../upload-url.util';

describe('upload URLs', () => {
  it('returns API-prefixed upload URL for same-origin production proxy', () => {
    const req = {
      headers: { 'x-forwarded-proto': 'https' },
      protocol: 'http',
      get: (name: string) =>
        name.toLowerCase() === 'host' ? 'online.myvo.vn' : undefined,
    } as any;

    expect(buildUploadUrl(req, 'image.png')).toBe(
      'https://online.myvo.vn/api/uploads/image.png',
    );
  });

  it('keeps direct and API static prefixes available', () => {
    expect(UPLOADS_STATIC_PREFIXES).toEqual(['/uploads/', '/api/uploads/']);
  });
});
