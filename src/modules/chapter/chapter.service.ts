import { HttpException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateChapterDto } from '@src/modules/chapter/dto/create-chapter.dto';
import { UpdateChapterDto } from '@src/modules/chapter/dto/update-chapter.dto';
import { Chapter } from '@src/modules/chapter/entities/chapter.entity';
import { ValidationErrorCode } from '@src/common/constants';
import { generateSlug } from '@src/common/helpers';
import { PaginatedResponse } from '@src/common/types';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';

@Injectable()
export class ChapterService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,

    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(createChapterDto: CreateChapterDto): Promise<Chapter> {
    const slug = generateSlug(createChapterDto.name);

    if (!createChapterDto.order) {
      const maxOrderChapter = await this.chapterRepository.findOne({
        where: { courseId: createChapterDto.courseId },
        order: { order: 'DESC' },
      });
      createChapterDto.order = (maxOrderChapter?.order ?? 0) + 1;
    }

    const chapter = this.chapterRepository.create({
      ...createChapterDto,
      slug,
    });
    return await this.chapterRepository.save(chapter);
  }

  async findAll(filterOptions?: {
    courseId?: string;
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: boolean;
  }): Promise<PaginatedResponse<Chapter>> {
    const queryBuilder = this.chapterRepository.createQueryBuilder('chapter');
    if (filterOptions?.courseId) {
      queryBuilder.where('chapter.courseId = :courseId', {
        courseId: filterOptions.courseId,
      });
    }
    if (filterOptions?.search) {
      queryBuilder.andWhere(
        '(chapter.name LIKE :search OR chapter.description LIKE :search)',
        { search: `%${filterOptions.search}%` },
      );
    }

    if (filterOptions?.isPublished !== undefined) {
      queryBuilder.andWhere('chapter.isPublished = :isPublished', {
        isPublished: filterOptions.isPublished,
      });
    }
    const [chapters, total] = await queryBuilder
      .orderBy('chapter.order', 'ASC')
      .getManyAndCount();
    return {
      items: chapters,
      total,
      page: filterOptions?.page ?? 1,
      limit: filterOptions?.limit ?? 10,
    };
  }

  async findOne(id: string): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new HttpException(ValidationErrorCode.CHAPTER_NOT_FOUND, 404);
    }

    return chapter;
  }

  async update(id: string, updateChapterDto: UpdateChapterDto): Promise<void> {
    const chapter = await this.findOne(id);
    const slug = generateSlug(updateChapterDto.name ?? chapter.name);

    Object.assign(chapter, { ...updateChapterDto, slug });
    await this.chapterRepository.save(chapter);
  }

  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Lecture).softDelete({
        chapterId: id,
      });

      await manager.getRepository(Chapter).softDelete(id);
    });
  }

  async getAllLecturesByChapterId(chapterId: string): Promise<Lecture[]> {
    const lectures = await this.lectureRepository.find({
      where: { chapterId },
    });
    return lectures;
  }
}
