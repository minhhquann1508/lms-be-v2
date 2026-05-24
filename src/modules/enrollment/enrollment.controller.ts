import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Enrollment } from './entities/enrollment.entity';
import { CurrentUser, Roles } from '@src/common/decorators';
import { RolesGuard } from '@src/common/guards';
import { ROLES } from '@src/common/constants/roles';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AccessTokenPayload,
  EnrollmentFilter,
  EnrollmentStatus,
  PaginatedResponse,
} from '@src/common/types';
import { ReviewEnrollmentDto } from './dto/review-enrollment.dto';
import { UpdateEnrollmentLearningStateDto } from './dto/update-enrollment-learning-state.dto';
import { LearningEnrollmentDetail } from './enrollment.service';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER)
  @Post()
  @ApiOperation({ summary: 'Create a new enrollment' })
  @ApiResponse({
    status: 201,
    description: 'The enrollment has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data.' })
  async create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<Enrollment> {
    return await this.enrollmentService.createEnrollment(
      createEnrollmentDto,
      user.userId,
    );
  }

  // @UseGuards(RolesGuard)
  // @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  // @Post('/import-enrollments')
  // @ApiOperation({ summary: 'Create a new enrollment' })
  // @ApiResponse({
  //   status: 201,
  //   description: 'The enrollment has been successfully created.',
  // })
  // @ApiResponse({ status: 400, description: 'Bad request. Invalid input data.' })
  // async importUsersEnrollments(
  //   @Body() createEnrollmentDto: CreateEnrollmentDto,
  // ): Promise<Enrollment[]> {
  //   return await this.enrollmentService.importUsersEnrollments(
  //     createEnrollmentDto,
  //   );
  // }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER)
  @Get('my-enrollments')
  @ApiOperation({ summary: 'Get enrollments by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the list of enrollments for the specified user ID.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getMyEnrollments(
    @CurrentUser() user: AccessTokenPayload,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: EnrollmentStatus,
  ): Promise<PaginatedResponse<Enrollment>> {
    const filters: EnrollmentFilter = {
      page: Number(page),
      limit: Number(limit),
      search,
      status,
    };

    return await this.enrollmentService.getMyEnrollments(user.userId, filters);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER)
  @Get('my-course/:courseId')
  @ApiOperation({ summary: 'Get current user enrollment for a course' })
  @ApiResponse({
    status: 200,
    description: 'Return the latest enrollment for current user and course.',
  })
  async getMyEnrollmentByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<Enrollment | null> {
    return await this.enrollmentService.getEnrollmentByCourse(
      courseId,
      user.userId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Get('all')
  @ApiOperation({ summary: 'Get all enrollments cross-course (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Return all enrollments.',
  })
  async getAllEnrollments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: EnrollmentStatus,
  ): Promise<PaginatedResponse<Enrollment>> {
    const filters: EnrollmentFilter = {
      page: Number(page),
      limit: Number(limit),
      search,
      status,
    };

    return await this.enrollmentService.getAllEnrollments(filters);
  }

  @Get(':enrollmentId')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the enrollment for the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found.' })
  async getEnrollmentById(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<LearningEnrollmentDetail> {
    return await this.enrollmentService.getDetailEnrollment(
      enrollmentId,
      user.userId,
    );
  }

  @Patch(':enrollmentId/learning-state')
  @ApiOperation({
    summary: 'Update a learner personal state for an enrollment',
  })
  @ApiResponse({
    status: 200,
    description: 'Learning state updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found.' })
  async updateLearningState(
    @Param('enrollmentId') enrollmentId: string,
    @Body() updateEnrollmentLearningStateDto: UpdateEnrollmentLearningStateDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<LearningEnrollmentDetail> {
    return await this.enrollmentService.updateLearningState(
      enrollmentId,
      user.userId,
      updateEnrollmentLearningStateDto,
    );
  }

  @Get(':userId/user')
  @ApiOperation({ summary: 'Get enrollments by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the list of enrollments for the specified user ID.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getEnrollmentsByUserId(
    @Param('userId') userId: string,
  ): Promise<Enrollment[]> {
    return await this.enrollmentService.getEnrollmentsByUserId(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get enrollments for a course (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Return the list of enrollments for the specified course.',
  })
  async getCourseEnrollments(
    @Param('courseId') courseId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: EnrollmentStatus,
  ): Promise<PaginatedResponse<Enrollment>> {
    const filters: EnrollmentFilter = {
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      courseId,
    };

    return await this.enrollmentService.getCourseEnrollments(courseId, filters);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Patch(':enrollmentId/review')
  @ApiOperation({ summary: 'Approve or reject an enrollment (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment reviewed successfully.',
  })
  async reviewEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Body() reviewEnrollmentDto: ReviewEnrollmentDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<Enrollment> {
    return await this.enrollmentService.reviewEnrollment(
      enrollmentId,
      user.userId,
      reviewEnrollmentDto,
    );
  }
}
