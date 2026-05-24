import { ValidationErrorCode } from '@src/common/constants';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLectureDto {
  @IsString({ message: ValidationErrorCode.LECTURE_NAME_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.LECTURE_NAME_REQUIRED })
  name: string;

  @IsString({ message: ValidationErrorCode.LECTURE_DESCRIPTION_REQUIRED })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: ValidationErrorCode.LECTURE_ORDER_REQUIRED })
  @IsOptional()
  order: number;

  @IsBoolean({ message: ValidationErrorCode.LECTURE_STATUS_REQUIRED })
  isPublished: boolean;

  @IsString({ message: ValidationErrorCode.LECTURE_CHAPTER_ID_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.LECTURE_CHAPTER_ID_REQUIRED })
  chapterId: string;

  @IsString()
  @IsOptional()
  quizId?: string;
}
