import { ApiProperty } from '@nestjs/swagger';

export class DeviceItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceUid: string;

  @ApiProperty()
  deviceName: string;

  @ApiProperty({ enum: ['mobile', 'desktop'] })
  deviceType: string;

  @ApiProperty()
  os: string;

  @ApiProperty()
  browser: string;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  lastLoginAt: Date;

  @ApiProperty()
  hasActiveSession: boolean;

  @ApiProperty()
  isCurrent: boolean;
}
