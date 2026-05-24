import { ApiProperty } from '@nestjs/swagger';

export class SessionDeviceSummaryDto {
  @ApiProperty()
  deviceId: string;

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
}

export class SessionItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty({ type: SessionDeviceSummaryDto })
  device: SessionDeviceSummaryDto;

  @ApiProperty()
  loginAt: Date;

  @ApiProperty()
  expiredAt: Date;

  @ApiProperty()
  isCurrent: boolean;
}
