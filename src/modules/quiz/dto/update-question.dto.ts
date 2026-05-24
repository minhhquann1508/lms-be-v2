import { PartialType } from '@nestjs/swagger';
import { CreateQuestionDto } from '@src/modules/quiz/dto/create-question.dto';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
