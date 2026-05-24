import { ValidationErrorCode } from '@src/common/constants';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQuestionDto {
  @IsString({ message: ValidationErrorCode.QUESTION_CONTENT_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.QUESTION_CONTENT_REQUIRED })
  content: string;

  @IsString({ message: ValidationErrorCode.QUESTION_TYPE_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.QUESTION_TYPE_REQUIRED })
  type: string;

  @IsInt({ message: ValidationErrorCode.QUESTION_POINTS_REQUIRED })
  @IsOptional()
  points?: number;

  @IsInt({ message: ValidationErrorCode.QUESTION_ORDER_REQUIRED })
  @IsOptional()
  order?: number;
}
