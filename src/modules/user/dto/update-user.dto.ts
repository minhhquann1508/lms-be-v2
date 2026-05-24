import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ValidationErrorCode } from '@src/common/constants';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Tên hiển thị của người dùng.',
    example: 'Nguyen Van A',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: ValidationErrorCode.FULL_NAME_INVALID_TYPE })
  @MinLength(2, { message: ValidationErrorCode.FULL_NAME_TOO_SHORT })
  @MaxLength(255, { message: ValidationErrorCode.FULL_NAME_TOO_LONG })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'URL ảnh đại diện công khai.',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length ? trimmedValue : null;
  })
  @IsString({ message: ValidationErrorCode.AVATAR_INVALID_TYPE })
  @MaxLength(1000, { message: ValidationErrorCode.AVATAR_TOO_LONG })
  avatar?: string | null;
}
