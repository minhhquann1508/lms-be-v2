import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationErrorCode } from '@src/common/constants';
import { CreateDeviceDto } from '@src/modules/device/dto/create-device.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: ValidationErrorCode.EMAIL_INVALID })
  @IsNotEmpty({ message: ValidationErrorCode.EMAIL_REQUIRED })
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecureP@ss123',
  })
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.PASSWORD_REQUIRED })
  password!: string;

  @ApiProperty({
    description: 'Device information',
    type: CreateDeviceDto,
  })
  @ValidateNested()
  @Type(() => CreateDeviceDto)
  @IsObject({ message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.DEVICE_REQUIRED })
  device!: CreateDeviceDto;

  @ApiPropertyOptional({
    description:
      'Force login by revoking other active sessions of the same device type',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: ValidationErrorCode.INVALID_TYPE })
  force?: boolean;

  @ApiPropertyOptional({
    description:
      'Revoke a specific session before login (used to free a device slot). ' +
      'When provided, the session identified by this ID will be revoked prior to device-limit checks.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  revokeSessionId?: string;
}
