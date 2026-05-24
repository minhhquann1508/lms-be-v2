import { PartialType } from '@nestjs/swagger';
import { CreateQuestionOptionDto } from '@src/modules/quiz/dto/create-question-option.dto';

export class UpdateQuestionOptionDto extends PartialType(
  CreateQuestionOptionDto,
) {}
