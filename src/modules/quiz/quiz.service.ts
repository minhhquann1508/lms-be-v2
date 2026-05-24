import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import { Question } from '@src/modules/quiz/entities/question.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';
import { CreateQuizDto } from '@src/modules/quiz/dto/create-quiz.dto';
import { UpdateQuizDto } from '@src/modules/quiz/dto/update-quiz.dto';
import { BulkUpdateQuizDto, BulkQuestionDto, BulkOptionDto } from '@src/modules/quiz/dto/bulk-update-quiz.dto';
import { BulkCreateQuizDto } from '@src/modules/quiz/dto/bulk-create-quiz.dto';
import { generateSlug } from '@src/common/helpers';
import { ValidationErrorCode } from '@src/common/constants';
import { PaginatedResponse, QuizFilter } from '@src/common/types';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optionRepository: Repository<QuestionOption>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateQuizDto): Promise<Quiz> {
    const quiz = this.quizRepository.create({
      ...dto,
      slug: generateSlug(dto.title),
    });
    return this.quizRepository.save(quiz);
  }

  async findAll(filter?: QuizFilter): Promise<PaginatedResponse<Quiz>> {
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const qb = this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.course', 'course')
      .leftJoinAndSelect('quiz.chapter', 'chapter')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('quiz.createdAt', 'DESC');

    if (filter?.search) {
      qb.andWhere('quiz.title ILIKE :search', { search: `%${filter.search}%` });
    }
    if (filter?.type) {
      qb.andWhere('quiz.type = :type', { type: filter.type });
    }
    if (filter?.isPublished !== undefined) {
      qb.andWhere('quiz.is_published = :isPublished', {
        isPublished: filter.isPublished,
      });
    }
    if (filter?.courseId) {
      qb.andWhere('quiz.course_id = :courseId', { courseId: filter.courseId });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['course', 'chapter', 'questions', 'questions.options'],
      order: { questions: { order: 'ASC', options: { order: 'ASC' } } },
    });
    if (!quiz) {
      throw new BadRequestException(ValidationErrorCode.QUIZ_NOT_FOUND);
    }
    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto): Promise<Quiz> {
    const quiz = await this.findById(id);
    Object.assign(quiz, {
      ...dto,
      slug: dto.title ? generateSlug(dto.title) : quiz.slug,
    });
    return this.quizRepository.save(quiz);
  }

  async bulkCreate(dto: BulkCreateQuizDto): Promise<Quiz> {
    const quiz = this.quizRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      duration: dto.duration,
      passingScore: dto.passingScore,
      isPublished: dto.isPublished ?? false,
      courseId: dto.courseId,
      chapterId: dto.chapterId,
      slug: generateSlug(dto.title),
    });
    const savedQuiz = await this.quizRepository.save(quiz);

    for (const qDto of dto.questions) {
      const question = this.questionRepository.create({
        quizId: savedQuiz.id,
        content: qDto.content,
        points: qDto.points,
        order: dto.questions.indexOf(qDto) + 1,
      });
      const savedQuestion = await this.questionRepository.save(question);

      for (const oDto of qDto.options) {
        const option = this.optionRepository.create({
          questionId: savedQuestion.id,
          content: oDto.content,
          isCorrect: oDto.isCorrect,
          order: qDto.options.indexOf(oDto) + 1,
        });
        await this.optionRepository.save(option);
      }
    }

    return this.findById(savedQuiz.id);
  }

  async delete(id: string): Promise<void> {
    const quiz = await this.findById(id);
    await this.quizRepository.softDelete(quiz.id);
  }

  async bulkUpdate(id: string, dto: BulkUpdateQuizDto): Promise<Quiz> {
    const quiz = await this.findById(id);

    Object.assign(quiz, {
      title: dto.title,
      description: dto.description ?? quiz.description,
      type: dto.type,
      duration: dto.duration ?? quiz.duration,
      passingScore: dto.passingScore ?? quiz.passingScore,
      isPublished: dto.isPublished ?? quiz.isPublished,
      courseId: dto.courseId ?? quiz.courseId,
      chapterId: dto.chapterId ?? quiz.chapterId,
      slug: dto.title ? generateSlug(dto.title) : quiz.slug,
    });

    const updatedQuiz = await this.quizRepository.save(quiz);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingQuestions = await queryRunner.manager.find(Question, {
        where: { quizId: id },
        relations: ['options'],
      });
      const incomingIds = dto.questions.filter((q) => q.id).map((q) => q.id!);
      const incomingIdSet = new Set(incomingIds);

      for (const eq of existingQuestions) {
        if (!incomingIdSet.has(eq.id)) {
          await queryRunner.manager.softDelete(Question, eq.id);
        }
      }

      for (const qDto of dto.questions) {
        if (qDto.id && incomingIdSet.has(qDto.id)) {
          const question = await queryRunner.manager.findOne(Question, {
            where: { id: qDto.id },
            relations: ['options'],
          });
          if (question) {
            question.content = qDto.content;
            question.points = qDto.points;
            await queryRunner.manager.save(question);
            const existingOptions = question.options;
            const incomingOptIds = new Set(qDto.options.filter((o) => o.id).map((o) => o.id!));
            for (const eo of existingOptions) {
              if (!incomingOptIds.has(eo.id)) {
                await queryRunner.manager.remove(eo);
              }
            }
            for (const oDto of qDto.options) {
              if (oDto.id && incomingOptIds.has(oDto.id)) {
                const option = existingOptions.find((eo) => eo.id === oDto.id);
                if (option) {
                  option.content = oDto.content;
                  option.isCorrect = oDto.isCorrect;
                  await queryRunner.manager.save(option);
                }
              } else {
                const option = queryRunner.manager.create(QuestionOption, {
                  questionId: question.id,
                  content: oDto.content,
                  isCorrect: oDto.isCorrect,
                  order: qDto.options.indexOf(oDto) + 1,
                });
                await queryRunner.manager.save(option);
              }
            }
          }
        } else {
          const newQuestion = queryRunner.manager.create(Question, {
            quizId: id,
            content: qDto.content,
            points: qDto.points,
            order: dto.questions.indexOf(qDto) + 1,
          });
          await queryRunner.manager.save(newQuestion);
          for (const oDto of qDto.options) {
            const option = queryRunner.manager.create(QuestionOption, {
              questionId: newQuestion.id,
              content: oDto.content,
              isCorrect: oDto.isCorrect,
              order: qDto.options.indexOf(oDto) + 1,
            });
            await queryRunner.manager.save(option);
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return this.findById(id);
  }
}
