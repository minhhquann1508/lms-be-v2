import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDeviceDto } from '@src/modules/device/dto/create-device.dto';
import { ValidationErrorCode } from '@src/common/constants';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google OAuth request authorization code',
    example: '4/0AeaYSH...',
  })
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.REQUIRED })
  code: string;

  @ApiProperty({
    description: 'Device information',
    type: CreateDeviceDto,
  })
  @IsObject({ message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.DEVICE_REQUIRED })
  @ValidateNested()
  @Type(() => CreateDeviceDto)
  device: CreateDeviceDto;

  @ApiPropertyOptional({
    description:
      'Force login by revoking other active sessions of the same device type',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: ValidationErrorCode.INVALID_TYPE })
  force?: boolean;
}
