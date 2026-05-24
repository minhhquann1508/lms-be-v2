import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationErrorCode } from '@src/common/constants';
import { CreateDeviceDto } from '@src/modules/device/dto/create-device.dto';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: ValidationErrorCode.EMAIL_REQUIRED })
  @IsEmail({}, { message: ValidationErrorCode.EMAIL_INVALID })
  email!: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'SecureP@ss123',
    minLength: 6,
  })
  @IsNotEmpty({ message: ValidationErrorCode.PASSWORD_REQUIRED })
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  password!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsNotEmpty({ message: ValidationErrorCode.FULL_NAME_REQUIRED })
  @IsString({ message: ValidationErrorCode.FULL_NAME_INVALID_TYPE })
  fullName!: string;

  @ApiProperty({
    description: 'Device information',
    type: CreateDeviceDto,
  })
  @ValidateNested()
  @Type(() => CreateDeviceDto)
  @IsObject({ message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.DEVICE_REQUIRED })
  device!: CreateDeviceDto;
}
