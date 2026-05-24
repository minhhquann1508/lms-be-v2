import { ValidationErrorCode } from '@src/common/constants';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateQuizDto {
  @IsString({ message: ValidationErrorCode.QUIZ_TITLE_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.QUIZ_TITLE_REQUIRED })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString({ message: ValidationErrorCode.QUIZ_TYPE_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.QUIZ_TYPE_REQUIRED })
  type: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsInt()
  @IsOptional()
  passingScore?: number;

  @IsBoolean({ message: ValidationErrorCode.QUIZ_STATUS_REQUIRED })
  @IsOptional()
  isPublished?: boolean;

  @IsUUID()
  @IsOptional()
  courseId?: string;

  @IsUUID()
  @IsOptional()
  chapterId?: string;
}
