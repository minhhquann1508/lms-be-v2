import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { LectureProgressService } from '@src/modules/lecture-progress/lecture-progress.service';
import { CreateLectureProgressDto } from '@src/modules/lecture-progress/dto/create-lecture-progress.dto';
import { UpdateLectureProgressDto } from '@src/modules/lecture-progress/dto/update-lecture-progress.dto';
import { LectureProgress } from '@src/modules/lecture-progress/entities/lecture-progress.entity';
import { CurrentUser } from '@src/common/decorators';
import { AccessTokenPayload } from '@src/common/types';

export interface EnrollmentLectureProgressSnapshot {
  enrollmentId: string;
  progress: number;
  completedAt: Date | null;
  totalLectures: number;
  completedLectures: number;
  lectureProgresses: LectureProgress[];
}

@ApiBearerAuth()
@Controller('lecture-progress')
export class LectureProgressController {
  constructor(
    private readonly lectureProgressService: LectureProgressService,
  ) {}

  @ApiOperation({ summary: 'Create a new lecture progress' })
  @ApiResponse({
    status: 201,
    description: 'The lecture progress has been successfully created.',
    type: LectureProgress,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Post()
  async create(
    @Body() createLectureProgressDto: CreateLectureProgressDto,
  ): Promise<LectureProgress> {
    return await this.lectureProgressService.createLectureProgress(
      createLectureProgressDto,
    );
  }

  @ApiOperation({ summary: 'Get progress snapshot for an enrollment' })
  @ApiParam({
    name: 'enrollmentId',
    description: 'Enrollment UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment progress snapshot loaded successfully.',
  })
  @Get('enrollment/:enrollmentId')
  async getEnrollmentProgress(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<EnrollmentLectureProgressSnapshot> {
    return await this.lectureProgressService.getEnrollmentProgressSnapshot(
      enrollmentId,
      user.userId,
    );
  }

  @ApiOperation({ summary: 'Sync lecture progress emitted by the player' })
  @ApiResponse({
    status: 200,
    description: 'Lecture progress synced successfully.',
  })
  @Put()
  async sync(
    @Body() updateLectureProgressDto: UpdateLectureProgressDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<EnrollmentLectureProgressSnapshot> {
    return await this.lectureProgressService.syncLectureProgress(
      updateLectureProgressDto,
      user.userId,
    );
  }
}
