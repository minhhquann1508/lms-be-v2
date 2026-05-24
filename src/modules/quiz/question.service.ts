import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '@src/modules/quiz/entities/question.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';
import { CreateQuestionDto } from '@src/modules/quiz/dto/create-question.dto';
import { UpdateQuestionDto } from '@src/modules/quiz/dto/update-question.dto';
import { CreateQuestionOptionDto } from '@src/modules/quiz/dto/create-question-option.dto';
import { UpdateQuestionOptionDto } from '@src/modules/quiz/dto/update-question-option.dto';
import { QuizService } from '@src/modules/quiz/quiz.service';
import { ValidationErrorCode } from '@src/common/constants';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optionRepository: Repository<QuestionOption>,
    private readonly quizService: QuizService,
  ) {}

  async create(quizId: string, dto: CreateQuestionDto): Promise<Question> {
    await this.quizService.findById(quizId);

    if (!dto.order) {
      const maxOrder = await this.questionRepository.findOne({
        where: { quizId },
        order: { order: 'DESC' },
      });
      dto.order = (maxOrder?.order ?? 0) + 1;
    }

    const question = this.questionRepository.create({
      ...dto,
      quizId,
    });
    return this.questionRepository.save(question);
  }

  async findByQuizId(quizId: string): Promise<Question[]> {
    return this.questionRepository.find({
      where: { quizId },
      relations: ['options'],
      order: { order: 'ASC', options: { order: 'ASC' } },
    });
  }

  async findById(questionId: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['options'],
      order: { options: { order: 'ASC' } },
    });
    if (!question) {
      throw new BadRequestException(ValidationErrorCode.QUESTION_NOT_FOUND);
    }
    return question;
  }

  async update(
    quizId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ): Promise<Question> {
    await this.quizService.findById(quizId);
    const question = await this.findById(questionId);
    Object.assign(question, dto);
    return this.questionRepository.save(question);
  }

  async delete(quizId: string, questionId: string): Promise<void> {
    await this.quizService.findById(quizId);
    const question = await this.findById(questionId);
    await this.questionRepository.softDelete(question.id);
  }

  async createOption(
    quizId: string,
    questionId: string,
    dto: CreateQuestionOptionDto,
  ): Promise<QuestionOption> {
    await this.quizService.findById(quizId);
    const question = await this.findById(questionId);

    if (!dto.order) {
      const maxOrder = await this.optionRepository.findOne({
        where: { questionId },
        order: { order: 'DESC' },
      });
      dto.order = (maxOrder?.order ?? 0) + 1;
    }

    const option = this.optionRepository.create({
      ...dto,
      questionId: question.id,
    });
    return this.optionRepository.save(option);
  }

  async updateOption(
    quizId: string,
    questionId: string,
    optionId: string,
    dto: UpdateQuestionOptionDto,
  ): Promise<QuestionOption> {
    await this.quizService.findById(quizId);
    await this.findById(questionId);
    const option = await this.optionRepository.findOne({
      where: { id: optionId },
    });
    if (!option) {
      throw new BadRequestException(ValidationErrorCode.OPTION_NOT_FOUND);
    }
    Object.assign(option, dto);
    return this.optionRepository.save(option);
  }

  async deleteOption(
    quizId: string,
    questionId: string,
    optionId: string,
  ): Promise<void> {
    await this.quizService.findById(quizId);
    await this.findById(questionId);
    const option = await this.optionRepository.findOne({
      where: { id: optionId },
    });
    if (!option) {
      throw new BadRequestException(ValidationErrorCode.OPTION_NOT_FOUND);
    }
    await this.optionRepository.remove(option);
  }
}
