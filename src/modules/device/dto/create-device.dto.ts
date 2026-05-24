import { ApiProperty } from '@nestjs/swagger';
import { ValidationErrorCode } from '@src/common/constants';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty()
  @IsUUID(undefined, { message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.REQUIRED })
  deviceUid: string;

  @ApiProperty()
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.REQUIRED })
  deviceName: string;

  @ApiProperty({ enum: ['mobile', 'desktop'] })
  @IsIn(['mobile', 'desktop'], { message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.REQUIRED })
  deviceType: string;

  @ApiProperty()
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.REQUIRED })
  os: string;

  @ApiProperty()
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  @IsNotEmpty({ message: ValidationErrorCode.REQUIRED })
  browser: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  ipAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: ValidationErrorCode.INVALID_TYPE })
  userAgent?: string;
}
