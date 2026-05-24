import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from '@modules/course/dto/create-course.dto';
import { UpdateCourseDto } from '@modules/course/dto/update-course.dto';
import { DataSource, In, Repository } from 'typeorm';
import { Course } from '@modules/course/entities/course.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { generateSlug } from '@src/common/helpers';
import { CourseFilter, PaginatedResponse } from '@src/common/types';
import { ValidationErrorCode } from '@src/common/constants';
import { Chapter } from '@src/modules/chapter/entities/chapter.entity';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}
  async create(
    createCourseDto: CreateCourseDto,
    authorId: string,
  ): Promise<Course> {
    const slug = generateSlug(createCourseDto.name);

    const course = this.courseRepository.create({
      ...createCourseDto,
      slug,
      authorId,
    });

    return this.courseRepository.save(course);
  }

  async findAll(
    courseFilter: CourseFilter,
  ): Promise<PaginatedResponse<Course>> {
    const {
      page = 1,
      limit = 10,
      search,
      isPublished,
      authorId,
      categoryId,
      sortBy,
      sortOrder = 'DESC',
    } = courseFilter;

    const safeSortBy =
      sortBy === 'rating' || sortBy === 'price' ? sortBy : 'createdAt';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.author', 'author')
      .leftJoinAndSelect('course.category', 'category')
      .select([
        'course',
        'author.id',
        'author.fullName',
        'author.avatar',
        'category',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lecture.id)', 'lectureCount')
          .from(Lecture, 'lecture')
          .leftJoin('lecture.chapter', 'chapter')
          .where('chapter.courseId = course.id')
          .andWhere('chapter.deletedAt IS NULL')
          .andWhere('lecture.deletedAt IS NULL');
      }, 'course_lectureCount')
      .andWhere('course.deletedAt IS NULL')
      .orderBy(`course.${safeSortBy}`, safeOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(course.name LIKE :search OR course.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isPublished !== undefined) {
      queryBuilder.andWhere('course.isPublished = :isPublished', {
        isPublished,
      });
    }
    if (authorId) {
      queryBuilder.andWhere('course.authorId = :authorId', { authorId });
    }
    if (categoryId) {
      queryBuilder.andWhere('course.categoryId = :categoryId', { categoryId });
    }

    const [courses, count] = await queryBuilder.getManyAndCount();

    return {
      items: courses,
      total: count,
      page,
      limit,
    };
  }

  async findOne(
    id: string,
    options?: { includeUnpublishedLectureAssets?: boolean },
  ): Promise<Course> {
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.author', 'author')
      .leftJoinAndSelect('course.category', 'category')
      .leftJoinAndSelect('course.chapters', 'chapter')
      .leftJoinAndSelect('chapter.lectures', 'lecture')
      .select([
        'course',
        'author.id',
        'author.fullName',
        'author.avatar',
        'category',
        'chapter',
        'lecture',
      ])
      .where('course.id = :id', { id })
      .andWhere('course.deletedAt IS NULL')
      .getOne();

    if (!course) {
      throw new NotFoundException(ValidationErrorCode.COURSE_NOT_FOUND);
    }

    if (!options?.includeUnpublishedLectureAssets && course.chapters) {
      course.chapters = course.chapters
        .filter((chapter) => chapter.isPublished)
        .map((chapter) => ({
          ...chapter,
          lectures: (chapter.lectures ?? [])
            .filter((lecture) => lecture.isPublished)
            .map((lecture) => ({
              ...lecture,
              videoUrl: lecture.videoUrl,
              attributes: lecture.attributes,
            })),
        }));
    }

    return course;
  }

  async findAdminOne(id: string): Promise<Course> {
    return await this.findOne(id, { includeUnpublishedLectureAssets: true });
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<void> {
    const course = await this.findOne(id);

    const slug = generateSlug(updateCourseDto.name ?? course.name);

    await this.courseRepository.update(id, { ...updateCourseDto, slug });
  }

  async remove(courseId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const now = new Date();

      // 1. Get all chapters of the course to delete related lectures
      const chapters = await manager.getRepository(Chapter).find({
        select: ['id'],
        where: { courseId },
      });
      const chapterIds = chapters.map((chapter) => chapter.id);

      // 2. Soft delete Course
      await manager
        .getRepository(Course)
        .update({ id: courseId }, { deletedAt: now });

      // 3. Soft delete Chapters
      await manager
        .getRepository(Chapter)
        .update({ courseId }, { deletedAt: now });

      // 4. Soft delete Lectures if chapters exist
      if (chapterIds.length > 0) {
        await manager
          .getRepository(Lecture)
          .update({ chapterId: In(chapterIds) }, { deletedAt: now });
      }
    });
  }
}
