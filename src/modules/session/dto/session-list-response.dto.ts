import { ApiProperty } from '@nestjs/swagger';
import { SessionItemDto } from './session-item.dto';

export class SessionListResponseDto {
  @ApiProperty({ type: [SessionItemDto] })
  items: SessionItemDto[];
}
