import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import { Question } from '@src/modules/quiz/entities/question.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';
import { QuizAttempt } from '@src/modules/quiz/entities/quiz-attempt.entity';
import { QuizAnswer } from '@src/modules/quiz/entities/quiz-answer.entity';
import { Course } from '@src/modules/course/entities/course.entity';
import { QuizService } from '@src/modules/quiz/quiz.service';
import { QuestionService } from '@src/modules/quiz/question.service';
import { QuizExportImportService } from '@src/modules/quiz/quiz-export-import.service';
import { QuizAttemptService } from '@src/modules/quiz/quiz-attempt.service';
import { QuizManageController } from '@src/modules/quiz/quiz-manage.controller';
import {
  QuizController,
  QuestionController,
} from '@src/modules/quiz/quiz.controller';
import { QuizAttemptController } from '@src/modules/quiz/quiz-attempt.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      Question,
      QuestionOption,
      QuizAttempt,
      QuizAnswer,
      Course,
    ]),
  ],
  controllers: [
    QuizController,
    QuestionController,
    QuizManageController,
    QuizAttemptController,
  ],
  providers: [QuizService, QuestionService, QuizExportImportService, QuizAttemptService],
  exports: [
    TypeOrmModule,
    QuizService,
    QuestionService,
    QuizExportImportService,
    QuizAttemptService,
  ],
})
export class QuizModule {}
