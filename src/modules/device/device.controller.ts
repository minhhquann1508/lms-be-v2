import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '@src/common/decorators';
import { AccessTokenPayload } from '@src/common/types';
import { DeviceService } from './device.service';
import { SessionService } from '@modules/session/session.service';
import { DeviceItemDto } from './dto/device-item.dto';
import { DeviceListResponseDto } from './dto/device-list-response.dto';

@ApiTags('devices')
@Controller('devices')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly sessionService: SessionService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'List devices of the current user' })
  @ApiResponse({ status: 200, type: DeviceListResponseDto })
  @ApiResponse({ status: 401, description: 'UNAUTHENTICATED' })
  async getMyDevices(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DeviceListResponseDto> {
    const [devices, activeSessions] = await Promise.all([
      this.deviceService.findByUserId(user.userId),
      this.sessionService.findActiveByUserId(user.userId),
    ]);

    // Build a Set of device IDs that have at least one active session
    const activeDeviceIds = new Set(activeSessions.map((s) => s.deviceId));

    const items: DeviceItemDto[] = devices.map((d) => ({
      id: d.id,
      deviceUid: d.deviceUid,
      deviceName: d.deviceName,
      deviceType: d.deviceType,
      os: d.os,
      browser: d.browser,
      ipAddress: d.ipAddress,
      lastLoginAt: d.lastLoginAt,
      hasActiveSession: activeDeviceIds.has(d.id),
      isCurrent: d.id === user.deviceId,
    }));

    return { items };
  }
}
