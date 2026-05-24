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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChapterService } from './chapter.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { RolesGuard } from '@src/common/guards';
import {
  OptionalBooleanQuery,
  OptionalBooleanQueryValue,
  Roles,
} from '@src/common/decorators';
import { ROLES } from '@src/common/constants/roles';
import { Chapter } from './entities/chapter.entity';
import { PaginatedResponse } from '@src/common/types';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';

@ApiTags('chapters')
@ApiBearerAuth()
@Controller('chapters')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiResponse({
    status: 201,
    description: 'Chapter created successfully',
    type: Chapter,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async create(@Body() createChapterDto: CreateChapterDto): Promise<Chapter> {
    return await this.chapterService.create(createChapterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chapters' })
  @ApiResponse({
    status: 200,
    description: 'List of chapters',
    type: [Chapter],
  })
  @ApiQuery({ name: 'courseId', description: 'Course UUID', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Limit per page', required: false })
  @ApiQuery({ name: 'search', description: 'Search query', required: false })
  @ApiQuery({
    name: 'isPublished',
    description: 'Filter by published status',
    required: false,
  })
  async findAll(
    @Query('courseId') courseId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @OptionalBooleanQuery('isPublished')
    isPublished?: OptionalBooleanQueryValue,
  ): Promise<PaginatedResponse<Chapter>> {
    const filterOptions = {
      courseId,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
      isPublished: isPublished as boolean | undefined,
    };
    return await this.chapterService.findAll(filterOptions);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chapter by ID' })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({ status: 200, description: 'Chapter details', type: Chapter })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async findOne(@Param('id') id: string): Promise<Chapter> {
    return await this.chapterService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update a chapter' })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({ status: 200, description: 'Chapter updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async update(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ): Promise<void> {
    await this.chapterService.update(id, updateChapterDto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chapter (soft delete)' })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({ status: 200, description: 'Chapter deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.chapterService.remove(id);
  }

  @Get(':id/lectures')
  @ApiOperation({ summary: 'Get all lectures by chapter ID' })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of lectures',
    type: [Lecture],
  })
  async getAllLecturesByChapterId(@Param('id') id: string): Promise<Lecture[]> {
    return await this.chapterService.getAllLecturesByChapterId(id);
  }
}
