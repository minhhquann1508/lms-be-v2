import { ValidationErrorCode } from '@src/common/constants';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateQuestionOptionDto {
  @IsString({ message: ValidationErrorCode.OPTION_CONTENT_REQUIRED })
  @IsNotEmpty({ message: ValidationErrorCode.OPTION_CONTENT_REQUIRED })
  content: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @IsInt({ message: ValidationErrorCode.OPTION_ORDER_REQUIRED })
  @IsOptional()
  order?: number;
}
