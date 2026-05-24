import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BunnyWebhookDto {
  @ApiProperty({ description: 'Video Library ID', example: 12345 })
  @IsNumber()
  VideoLibraryId: number;

  @ApiProperty({
    description: 'Video GUID',
    example: '12345678-1234-1234-1234-1234567890ab',
  })
  @IsString()
  VideoGuid: string;

  @ApiProperty({ description: 'Status', example: 1 })
  @IsNotEmpty()
  Status: number | string;
}
