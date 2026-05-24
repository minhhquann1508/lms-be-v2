import { ApiProperty } from '@nestjs/swagger';
import { DeviceItemDto } from './device-item.dto';

export class DeviceListResponseDto {
  @ApiProperty({ type: [DeviceItemDto] })
  items: DeviceItemDto[];
}
