import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class BulkOptionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  content: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class BulkQuestionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  content: string;

  @IsInt()
  points: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkOptionDto)
  options: BulkOptionDto[];
}

export class BulkUpdateQuizDto {
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
  @Type(() => BulkQuestionDto)
  questions: BulkQuestionDto[];
}
