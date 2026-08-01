import { Request } from 'express';

export const UPLOADS_STATIC_PREFIXES = ['/uploads/', '/api/uploads/'];

export function buildUploadUrl(req: Request, filename: string): string {
  const protocolHeader = req.headers['x-forwarded-proto'];
  const protocol =
    typeof protocolHeader === 'string'
      ? protocolHeader.split(',')[0].trim()
      : req.protocol;

  return `${protocol}://${req.get('host')}/api/uploads/${filename}`;
}
