import { BadRequestException, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAttempt, QuizAttemptStatus } from '@src/modules/quiz/entities/quiz-attempt.entity';
import { QuizAnswer } from '@src/modules/quiz/entities/quiz-answer.entity';
import { Question } from '@src/modules/quiz/entities/question.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';
import { QuizService } from '@src/modules/quiz/quiz.service';
import { ValidationErrorCode } from '@src/common/constants';
import { SubmitAttemptDto } from '@src/modules/quiz/dto/submit-attempt.dto';

@Injectable()
export class QuizAttemptService {
  constructor(
    @InjectRepository(QuizAttempt)
    private readonly attemptRepository: Repository<QuizAttempt>,
    @InjectRepository(QuizAnswer)
    private readonly answerRepository: Repository<QuizAnswer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly quizService: QuizService,
  ) {}

  async startAttempt(quizId: string, userId: string): Promise<QuizAttempt> {
    await this.quizService.findById(quizId);

    const existing = await this.attemptRepository.findOne({
      where: { quizId, userId, status: QuizAttemptStatus.IN_PROGRESS },
      relations: ['answers'],
    });

    if (existing) {
      return existing;
    }

    const questions = await this.questionRepository.find({
      where: { quizId },
    });
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    const attempt = this.attemptRepository.create({
      quizId,
      userId,
      status: QuizAttemptStatus.IN_PROGRESS,
      totalPoints,
      startedAt: new Date(),
    });

    return this.attemptRepository.save(attempt);
  }

  async submitAttempt(
    attemptId: string,
    userId: string,
    dto: SubmitAttemptDto,
  ): Promise<QuizAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['quiz', 'quiz.questions', 'quiz.questions.options'],
    });

    if (!attempt) {
      throw new BadRequestException(ValidationErrorCode.QUIZ_ATTEMPT_NOT_FOUND);
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException(ValidationErrorCode.QUIZ_ATTEMPT_ACCESS_DENIED);
    }

    if (attempt.status === QuizAttemptStatus.COMPLETED) {
      throw new BadRequestException(ValidationErrorCode.QUIZ_ATTEMPT_ALREADY_COMPLETED);
    }

    const questions = attempt.quiz.questions.sort((a, b) => a.order - b.order);
    const answers = dto.answers;
    let totalEarned = 0;

    const answerEntities: QuizAnswer[] = [];

    for (const question of questions) {
      const userAnswer = answers.find((a) => a.questionId === question.id);
      const selectedOptionId = userAnswer?.selectedOptionId;

      if (question.type === 'multiple_choice' && selectedOptionId) {
        const correctOption = question.options.find((o) => o.isCorrect);
        const isCorrect = correctOption?.id === selectedOptionId;
        const pointsEarned = isCorrect ? question.points : 0;

        if (isCorrect) {
          totalEarned += question.points;
        }

        answerEntities.push(
          this.answerRepository.create({
            attemptId: attempt.id,
            questionId: question.id,
            selectedOptionId,
            isCorrect,
            pointsEarned,
          }),
        );
      } else {
        answerEntities.push(
          this.answerRepository.create({
            attemptId: attempt.id,
            questionId: question.id,
            selectedOptionId: selectedOptionId ?? undefined,
            isCorrect: undefined,
            pointsEarned: 0,
          }),
        );
      }
    }

    await this.answerRepository.save(answerEntities);

    const scorePercentage =
      attempt.totalPoints > 0
        ? Math.round((totalEarned / attempt.totalPoints) * 100)
        : 0;

    attempt.status = QuizAttemptStatus.COMPLETED;
    attempt.score = totalEarned;
    attempt.scorePercentage = scorePercentage;
    attempt.completedAt = new Date();
    attempt.answers = answerEntities;

    return this.attemptRepository.save(attempt);
  }

  async getMyAttempts(quizId: string, userId: string): Promise<QuizAttempt[]> {
    return this.attemptRepository.find({
      where: { quizId, userId },
      relations: ['answers'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAttemptDetail(attemptId: string, userId: string): Promise<QuizAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: [
        'quiz',
        'quiz.questions',
        'quiz.questions.options',
        'answers',
      ],
    });

    if (!attempt) {
      throw new BadRequestException(ValidationErrorCode.QUIZ_ATTEMPT_NOT_FOUND);
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException(ValidationErrorCode.QUIZ_ATTEMPT_ACCESS_DENIED);
    }

    return attempt;
  }
}

