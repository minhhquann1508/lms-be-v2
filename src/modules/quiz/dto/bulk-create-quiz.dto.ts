import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class BulkCreateOptionDto {
  @IsString()
  content: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class BulkCreateQuestionDto {
  @IsString()
  content: string;

  @IsInt()
  points: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateOptionDto)
  options: BulkCreateOptionDto[];
}

export class BulkCreateQuizDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  type: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsInt()
  @IsOptional()
  passingScore?: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsUUID()
  @IsOptional()
  courseId?: string;

  @IsUUID()
  @IsOptional()
  chapterId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateQuestionDto)
  questions: BulkCreateQuestionDto[];
}
