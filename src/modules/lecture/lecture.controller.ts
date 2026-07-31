import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Patch,
  Param,
  Get,
  Put,
  Delete,
} from '@nestjs/common';
import { LectureService } from './lecture.service';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { ReorderLecturesDto } from '@src/modules/lecture/dto/reorder-lectures.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '@src/common/decorators';
import { RolesGuard } from '@src/common/guards';
import { ROLES } from '@src/common/constants/roles';
import { FileInterceptor } from '@nestjs/platform-express';
import { ValidationErrorCode } from '@src/common/constants';
import { PatchLectureDto } from '@src/modules/lecture/dto/patch-lecture.dto';
import { UpdateLectureDto } from '@src/modules/lecture/dto/update-lecture.dto';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';

@Controller('lectures')
export class LectureController {
  constructor(private readonly lectureService: LectureService) {}

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a new lecture' })
  @ApiResponse({ status: 201, description: 'Lecture created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createLectureDto: CreateLectureDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Lecture> {
    return await this.lectureService.create(createLectureDto, file);
  }

  @ApiOperation({ summary: 'Get lecture by id' })
  @ApiResponse({ status: 200, description: 'Lecture found' })
  @ApiResponse({ status: 404, description: 'Lecture not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':lectureId')
  async findById(@Param('lectureId') lectureId: string): Promise<Lecture> {
    return await this.lectureService.findById(lectureId);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Patch(':lectureId')
  @ApiOperation({ summary: 'Sort lecture order index' })
  @ApiResponse({
    status: 200,
    description: 'Lecture order index sorted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sortLectureOrderIndex(
    @Param('lectureId') lectureId: string,
    @Body() patchLectureDto: PatchLectureDto,
  ): Promise<void> {
    await this.lectureService.sortLectureOrderIndex(
      lectureId,
      patchLectureDto.order,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Patch('reorder/batch')
  @ApiOperation({ summary: 'Reorder multiple lectures at once' })
  async reorderLectures(
    @Body() dto: ReorderLecturesDto,
  ): Promise<void> {
    await this.lectureService.reorderLectures(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Put(':lectureId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update lecture' })
  @ApiResponse({ status: 200, description: 'Lecture updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lecture not found' })
  async updateLecture(
    @Param('lectureId') lectureId: string,
    @Body() updateLectureDto: UpdateLectureDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Lecture> {
    return await this.lectureService.updateLecture(
      lectureId,
      updateLectureDto,
      file,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Delete(':lectureId')
  @ApiOperation({ summary: 'Delete lecture' })
  @ApiResponse({ status: 200, description: 'Lecture deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lecture not found' })
  async deleteLecture(@Param('lectureId') lectureId: string): Promise<void> {
    await this.lectureService.deleteLecture(lectureId);
  }
}
