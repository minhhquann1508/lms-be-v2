import { PartialType } from '@nestjs/swagger';
import { CreateQuizDto } from '@src/modules/quiz/dto/create-quiz.dto';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {}
