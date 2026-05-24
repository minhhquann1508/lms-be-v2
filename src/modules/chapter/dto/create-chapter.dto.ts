import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ValidationErrorCode } from '@src/common/constants';

export class CreateChapterDto {
  @ApiProperty({
    example: 'Introduction to TypeScript',
    description: 'Name of the chapter',
    maxLength: 255,
  })
  @IsString({ message: ValidationErrorCode.CHAPTER_NAME_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.CHAPTER_NAME_REQUIRED })
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'This chapter covers TypeScript basics...',
    description: 'Description of the chapter',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Order/position of the chapter in the course',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the chapter is published',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the course this chapter belongs to',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;
}
