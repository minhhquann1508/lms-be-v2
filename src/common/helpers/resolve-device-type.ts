export type DeviceType = 'mobile' | 'desktop';

/**
 * Suy diễn deviceType từ User-Agent.
 * R1.AC6 — BE ưu tiên giá trị suy diễn từ UA cho cả lưu DB lẫn check limit.
 */
export function resolveDeviceType(userAgent?: string): DeviceType {
  return userAgent?.toLowerCase().includes('mobi') ? 'mobile' : 'desktop';
}
