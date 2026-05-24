import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@src/common/decorators';
import { RolesGuard } from '@src/common/guards';
import { ROLES } from '@src/common/constants/roles';
import { AccessTokenPayload } from '@src/common/types';
import { QuizAttemptService } from '@src/modules/quiz/quiz-attempt.service';
import { SubmitAttemptDto } from '@src/modules/quiz/dto/submit-attempt.dto';
import { QuizAttempt } from '@src/modules/quiz/entities/quiz-attempt.entity';

@ApiTags('quiz-attempts')
@Controller('quizzes')
@UseGuards(RolesGuard)
export class QuizAttemptController {
  constructor(private readonly attemptService: QuizAttemptService) {}

  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER)
  @Post(':quizId/attempts')
  @ApiOperation({ summary: 'Start a quiz attempt' })
  async startAttempt(
    @Param('quizId') quizId: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<QuizAttempt> {
    return this.attemptService.startAttempt(quizId, user.userId);
  }

  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER)
  @Post(':quizId/attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit a quiz attempt' })
  async submitAttempt(
    @Param('quizId') quizId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<QuizAttempt> {
    return this.attemptService.submitAttempt(attemptId, user.userId, dto);
  }

  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER)
  @Get(':quizId/attempts/my')
  @ApiOperation({ summary: 'Get my attempts for a quiz' })
  async getMyAttempts(
    @Param('quizId') quizId: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<QuizAttempt[]> {
    return this.attemptService.getMyAttempts(quizId, user.userId);
  }

  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER)
  @Get(':quizId/attempts/:attemptId')
  @ApiOperation({ summary: 'Get attempt detail' })
  async getAttemptDetail(
    @Param('quizId') quizId: string,
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<QuizAttempt> {
    return this.attemptService.getAttemptDetail(attemptId, user.userId);
  }
}

