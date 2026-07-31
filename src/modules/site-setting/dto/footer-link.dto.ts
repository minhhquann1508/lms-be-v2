import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FooterLinkDto {
  @ApiProperty({ example: 'Trang chủ' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: '/' })
  @IsNotEmpty()
  @IsString()
  url: string;
}
