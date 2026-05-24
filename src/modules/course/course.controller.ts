import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CourseService } from '@modules/course/course.service';
import { CreateCourseDto } from '@modules/course/dto/create-course.dto';
import { UpdateCourseDto } from '@modules/course/dto/update-course.dto';
import {
  Public,
  Roles,
  CurrentUser,
  OptionalBooleanQuery,
  OptionalBooleanQueryValue,
} from '@src/common/decorators';
import {
  AccessTokenPayload,
  CourseFilter,
  PaginatedResponse,
} from '@src/common/types';
import { RolesGuard } from '@src/common/guards';
import { ROLES } from '@src/common/constants/roles';
import { Course } from './entities/course.entity';

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<Course> {
    return await this.courseService.create(createCourseDto, user.userId);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all courses (public)' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'isPublished',
    required: false,
    type: Boolean,
    description: 'Filter by published status',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: String,
    description: 'Filter by author ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field: createdAt, rating, price',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order: ASC or DESC',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @OptionalBooleanQuery('isPublished')
    isPublished?: OptionalBooleanQueryValue,
    @Query('authorId') authorId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'rating' | 'price',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<PaginatedResponse<Course>> {
    const courseFilter: CourseFilter = {
      page: Number(page),
      limit: Number(limit),
      search,
      isPublished: isPublished as boolean | undefined,
      authorId,
      categoryId,
      sortBy,
      sortOrder,
    };

    return await this.courseService.findAll(courseFilter);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Get('admin/:id')
  @ApiOperation({ summary: 'Get a course by ID for admin management' })
  @ApiResponse({ status: 200, description: 'Admin course details' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findAdminOne(@Param('id') id: string): Promise<Course> {
    return await this.courseService.findAdminOne(id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID (public)' })
  @ApiResponse({ status: 200, description: 'Course details' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findOne(@Param('id') id: string): Promise<Course> {
    return await this.courseService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<void> {
    await this.courseService.update(id, updateCourseDto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course (admin only)' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.courseService.remove(id);
  }
}
