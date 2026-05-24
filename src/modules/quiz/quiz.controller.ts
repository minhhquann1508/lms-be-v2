import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '@src/common/decorators';
import { RolesGuard } from '@src/common/guards';
import { ROLES } from '@src/common/constants/roles';
import { PaginatedResponse, QuizFilter } from '@src/common/types';
import { QuizService } from '@src/modules/quiz/quiz.service';
import { QuestionService } from '@src/modules/quiz/question.service';
import { CreateQuizDto } from '@src/modules/quiz/dto/create-quiz.dto';
import { UpdateQuizDto } from '@src/modules/quiz/dto/update-quiz.dto';
import { BulkUpdateQuizDto } from '@src/modules/quiz/dto/bulk-update-quiz.dto';
import { BulkCreateQuizDto } from '@src/modules/quiz/dto/bulk-create-quiz.dto';
import { CreateQuestionDto } from '@src/modules/quiz/dto/create-question.dto';
import { UpdateQuestionDto } from '@src/modules/quiz/dto/update-question.dto';
import { CreateQuestionOptionDto } from '@src/modules/quiz/dto/create-question-option.dto';
import { UpdateQuestionOptionDto } from '@src/modules/quiz/dto/update-question-option.dto';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import { Question } from '@src/modules/quiz/entities/question.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all quizzes (public)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('courseId') courseId?: string,
  ): Promise<PaginatedResponse<Quiz>> {
    const filter: QuizFilter = { page, limit, search, type, courseId };
    return this.quizService.findAll(filter);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by id (public)' })
  async findById(@Param('id') id: string): Promise<Quiz> {
    return this.quizService.findById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a quiz (admin)' })
  async create(@Body() dto: CreateQuizDto): Promise<Quiz> {
    return this.quizService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post('bulk-create')
  @ApiOperation({ summary: 'Create a quiz with questions and options (admin)' })
  async bulkCreate(@Body() dto: BulkCreateQuizDto): Promise<Quiz> {
    return this.quizService.bulkCreate(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update a quiz (admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ): Promise<Quiz> {
    return this.quizService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Put(':id/bulk-update')
  @ApiOperation({ summary: 'Bulk update a quiz with questions and options (admin)' })
  async bulkUpdate(
    @Param('id') id: string,
    @Body() dto: BulkUpdateQuizDto,
  ): Promise<Quiz> {
    return this.quizService.bulkUpdate(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quiz (admin)' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.quizService.delete(id);
  }
}

@ApiTags('quiz-questions')
@Controller('quizzes')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post(':quizId/questions')
  @ApiOperation({ summary: 'Create a question (admin)' })
  async createQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuestionDto,
  ): Promise<Question> {
    return this.questionService.create(quizId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Put(':quizId/questions/:questionId')
  @ApiOperation({ summary: 'Update a question (admin)' })
  async updateQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.questionService.update(quizId, questionId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Delete(':quizId/questions/:questionId')
  @ApiOperation({ summary: 'Delete a question (admin)' })
  async deleteQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ): Promise<void> {
    return this.questionService.delete(quizId, questionId);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post(':quizId/questions/:questionId/options')
  @ApiOperation({ summary: 'Create an option for a question (admin)' })
  async createOption(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() dto: CreateQuestionOptionDto,
  ): Promise<QuestionOption> {
    return this.questionService.createOption(quizId, questionId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Put(':quizId/questions/:questionId/options/:optionId')
  @ApiOperation({ summary: 'Update an option (admin)' })
  async updateOption(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateQuestionOptionDto,
  ): Promise<QuestionOption> {
    return this.questionService.updateOption(quizId, questionId, optionId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Delete(':quizId/questions/:questionId/options/:optionId')
  @ApiOperation({ summary: 'Delete an option (admin)' })
  async deleteOption(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Param('optionId') optionId: string,
  ): Promise<void> {
    return this.questionService.deleteOption(quizId, questionId, optionId);
  }
}
