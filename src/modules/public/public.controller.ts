import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '@src/modules/course/entities/course.entity';
import { Enrollment } from '@src/modules/enrollment/entities/enrollment.entity';
import { EnrollmentStatus } from '@src/common/types';
import { Public } from '@src/common/decorators';

@Controller('public')
export class PublicController {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  @Public()
  @Get('stats')
  async getStats() {
    const totalCourses = await this.courseRepository
      .createQueryBuilder('course')
      .where('course.isPublished = :published', { published: true })
      .andWhere('course.deletedAt IS NULL')
      .getCount();

    const totalStudents = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
      .getCount();

    const avgRating = await this.courseRepository
      .createQueryBuilder('course')
      .select('AVG(course.rating)', 'avg')
      .where('course.isPublished = :published', { published: true })
      .andWhere('course.deletedAt IS NULL')
      .getRawOne();

    return {
      totalCourses,
      totalStudents,
      averageRating: Number(avgRating?.avg ?? 0).toFixed(1),
    };
  }
}
