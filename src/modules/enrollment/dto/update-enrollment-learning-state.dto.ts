import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class EnrollmentLearningNoteDto {
  @ApiProperty({ example: '6a9cde07-24c7-4fe1-8522-b6af44d53184' })
  @IsString()
  @MaxLength(64)
  id!: string;

  @ApiProperty({ example: '18812aab-534f-4a6e-813c-7d0cf7476607' })
  @IsUUID()
  lectureId!: string;

  @ApiProperty({ example: 'Đoạn này giải thích rất rõ phần state machine.' })
  @IsString()
  @MaxLength(5000)
  content!: string;

  @ApiProperty({ example: 135 })
  @IsInt()
  @Min(0)
  timestampSeconds!: number;

  @ApiProperty({ example: '2026-05-23T10:15:00.000Z' })
  @IsISO8601()
  createdAt!: string;

  @ApiProperty({ example: '2026-05-23T10:17:00.000Z' })
  @IsISO8601()
  updatedAt!: string;
}

export class UpdateEnrollmentLearningStateDto {
  @ApiPropertyOptional({
    description: 'Lecture that should be reopened when the learner returns.',
    example: '18812aab-534f-4a6e-813c-7d0cf7476607',
  })
  @IsOptional()
  @IsUUID()
  activeLectureId?: string;

  @ApiPropertyOptional({
    type: [EnrollmentLearningNoteDto],
    description: 'Structured learning notes grouped by lecture and timestamp.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnrollmentLearningNoteDto)
  notes?: EnrollmentLearningNoteDto[];
}
