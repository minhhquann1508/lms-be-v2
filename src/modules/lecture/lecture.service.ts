import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { Lecture } from './entities/lecture.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JobService } from '@src/modules/job/job.service';
import { JobType } from '@src/common/types';
import * as path from 'path';
import * as fs from 'fs/promises';
import { generateSlug } from '@src/common/helpers';
import { ValidationErrorCode } from '@src/common/constants';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { ReorderLecturesDto } from '@src/modules/lecture/dto/reorder-lectures.dto';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';

@Injectable()
export class LectureService {
  constructor(
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    private readonly jobService: JobService,
  ) {}
  async create(
    createLectureDto: CreateLectureDto,
    file: Express.Multer.File,
  ): Promise<{ jobId: string }> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    if (!createLectureDto.order) {
      const maxOrderLecture = await this.lectureRepository.findOne({
        where: { chapterId: createLectureDto.chapterId },
        order: { order: 'DESC' },
      });
      createLectureDto.order = (maxOrderLecture?.order ?? 0) + 1;
    }

    const tempPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
    await fs.writeFile(tempPath, file.buffer);

    const lecture = this.lectureRepository.create({
      ...createLectureDto,
      slug: generateSlug(createLectureDto.name),
      videoUrl: '',
    });
    const savedLecture = await this.lectureRepository.save(lecture);

    const job = await this.jobService.addJob(JobType.UPLOAD_LECTURE_VIDEO, {
      ...createLectureDto,
      lectureId: savedLecture.id,
      tempFilePath: tempPath,
    });

    return {
      jobId: job.id,
    };
  }

  async findById(lectureId: string): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({
      where: { id: lectureId },
      relations: ['quiz'],
    });

    if (!lecture)
      throw new BadRequestException(ValidationErrorCode.LECTURE_NOT_FOUND);
    return lecture;
  }

  async sortLectureOrderIndex(lectureId: string, order: number): Promise<void> {
    const lecture = await this.findById(lectureId);
    lecture.order = order;
    await this.lectureRepository.save(lecture);
  }

  async updateLecture(
    lectureId: string,
    updateLectureDto: UpdateLectureDto,
    file?: Express.Multer.File,
  ): Promise<{ jobId?: string }> {
    const lecture = await this.findById(lectureId);
    Object.assign(lecture, {
      ...updateLectureDto,
      slug: generateSlug(updateLectureDto.name ?? lecture.name),
    });
    await this.lectureRepository.save(lecture);

    if (file) {
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });

      const tempPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
      await fs.writeFile(tempPath, file.buffer);

      const job = await this.jobService.addJob(JobType.UPLOAD_LECTURE_VIDEO, {
        lectureId: lecture.id,
        tempFilePath: tempPath,
      });

      return {
        jobId: job.id,
      };
    }

    return {};
  }

  async reorderLectures(dto: ReorderLecturesDto): Promise<void> {
    for (const item of dto.items) {
      await this.lectureRepository.update(item.id, { order: item.order });
    }
  }

  async deleteLecture(lectureId: string): Promise<void> {
    const lecture = await this.findById(lectureId);
    await this.lectureRepository.softDelete(lecture.id);
  }
}
