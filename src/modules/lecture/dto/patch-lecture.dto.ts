import { ValidationErrorCode } from '@src/common/constants';
import { IsNumber } from 'class-validator';

export class PatchLectureDto {
  @IsNumber({}, { message: ValidationErrorCode.LECTURE_ORDER_REQUIRED })
  order: number;
}
