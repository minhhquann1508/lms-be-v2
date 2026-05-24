import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { ValidationErrorCode } from '@src/common/constants';

export class CreateCourseDto {
  @ApiProperty({ example: 'Course Name' })
  @IsString({ message: ValidationErrorCode.COURSE_NAME_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.COURSE_NAME_REQUIRED })
  name!: string;

  @ApiProperty({ example: 'Course Thumbnail' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ example: 'Course Description' })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 799000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ example: 'uuid-category-id', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
