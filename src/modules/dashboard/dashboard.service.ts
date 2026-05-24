import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DashboardCourseHighlights,
  DashboardCourseLeaderboardItem,
  DashboardOverview,
  EnrollmentStatus,
} from '@src/common/types';
import { Course } from '@src/modules/course/entities/course.entity';
import { Enrollment } from '@src/modules/enrollment/entities/enrollment.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';

type LeaderboardMode =
  | 'mostStudied'
  | 'highestRated'
  | 'mostDiscussed'
  | 'bestSelling'
  | 'needsAttention';

type DashboardCourseLeaderboardRaw = {
  id: string;
  name: string;
  thumbnail: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  price: string | number | null;
  rating: string | number | null;
  reviewCount: string | number | null;
  discussionCount: string | number | null;
  purchasedCount: string | number | null;
  averageProgress: string | number | null;
  revenue: string | number | null;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async getOverview(): Promise<DashboardOverview> {
    const [courseStats, purchaseStats, engagementStats] = await Promise.all([
      this.courseRepository
        .createQueryBuilder('course')
        .select('COUNT(course.id)', 'totalCourses')
        .addSelect(
          'COALESCE(AVG(NULLIF(course.rating, 0)), 0)',
          'averageRating',
        )
        .where('course.deletedAt IS NULL')
        .getRawOne<{
          totalCourses: string | null;
          averageRating: string | null;
        }>(),
      this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .innerJoin('enrollment.course', 'course')
        .select('COUNT(enrollment.id)', 'purchasedCourses')
        .addSelect('COALESCE(SUM(course.price), 0)', 'revenue')
        .where('enrollment.status = :status', {
          status: EnrollmentStatus.ACTIVE,
        })
        .andWhere('course.deletedAt IS NULL')
        .getRawOne<{
          purchasedCourses: string | null;
          revenue: string | null;
        }>(),
      this.courseRepository
        .createQueryBuilder('course')
        .select('COALESCE(SUM(course.reviewCount), 0)', 'totalReviews')
        .addSelect(
          'COALESCE(SUM(course.discussionCount), 0)',
          'totalDiscussions',
        )
        .where('course.deletedAt IS NULL')
        .getRawOne<{
          totalReviews: string | null;
          totalDiscussions: string | null;
        }>(),
    ]);

    return {
      totalCourses: Number(courseStats?.totalCourses ?? 0),
      purchasedCourses: Number(purchaseStats?.purchasedCourses ?? 0),
      averageRating: this.roundMetric(Number(courseStats?.averageRating ?? 0)),
      revenue: Number(purchaseStats?.revenue ?? 0),
      totalReviews: Number(engagementStats?.totalReviews ?? 0),
      totalDiscussions: Number(engagementStats?.totalDiscussions ?? 0),
    };
  }

  async getCourseHighlights(limit = 5): Promise<DashboardCourseHighlights> {
    const [
      mostStudied,
      highestRated,
      mostDiscussed,
      bestSelling,
      needsAttention,
    ] = await Promise.all([
      this.getCourseLeaderboard('mostStudied', limit),
      this.getCourseLeaderboard('highestRated', limit),
      this.getCourseLeaderboard('mostDiscussed', limit),
      this.getCourseLeaderboard('bestSelling', limit),
      this.getCourseLeaderboard('needsAttention', limit),
    ]);

    return {
      mostStudied,
      highestRated,
      mostDiscussed,
      bestSelling,
      needsAttention,
    };
  }

  private async getCourseLeaderboard(
    mode: LeaderboardMode,
    limit: number,
  ): Promise<DashboardCourseLeaderboardItem[]> {
    const query = this.createLeaderboardQuery(limit);

    switch (mode) {
      case 'mostStudied':
        query
          .orderBy('COUNT(enrollment.id)', 'DESC')
          .addOrderBy('COALESCE(AVG(enrollment.progress), 0)', 'DESC')
          .addOrderBy('course.rating', 'DESC');
        break;
      case 'highestRated':
        query
          .orderBy('course.rating', 'DESC')
          .addOrderBy('course.reviewCount', 'DESC')
          .addOrderBy('COUNT(enrollment.id)', 'DESC');
        break;
      case 'mostDiscussed':
        query
          .orderBy('course.discussionCount', 'DESC')
          .addOrderBy('course.rating', 'DESC')
          .addOrderBy('COUNT(enrollment.id)', 'DESC');
        break;
      case 'bestSelling':
        query
          .orderBy('COALESCE(COUNT(enrollment.id) * course.price, 0)', 'DESC')
          .addOrderBy('COUNT(enrollment.id)', 'DESC')
          .addOrderBy('course.rating', 'DESC');
        break;
      case 'needsAttention':
        query
          .orderBy('COUNT(enrollment.id)', 'ASC')
          .addOrderBy('course.discussionCount', 'ASC')
          .addOrderBy('course.reviewCount', 'ASC')
          .addOrderBy('course.createdAt', 'DESC');
        break;
    }

    const rows = await query.getRawMany<DashboardCourseLeaderboardRaw>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      thumbnail: row.thumbnail,
      authorName: row.authorName,
      authorAvatar: row.authorAvatar,
      price: Number(row.price ?? 0),
      rating: this.roundMetric(Number(row.rating ?? 0)),
      reviewCount: Number(row.reviewCount ?? 0),
      discussionCount: Number(row.discussionCount ?? 0),
      purchasedCount: Number(row.purchasedCount ?? 0),
      averageProgress: this.roundMetric(Number(row.averageProgress ?? 0)),
      revenue: Number(row.revenue ?? 0),
    }));
  }

  private createLeaderboardQuery(limit: number): SelectQueryBuilder<Course> {
    return (
      this.courseRepository
        .createQueryBuilder('course')
        .leftJoin('course.author', 'author')
        // Reuse aggregated enrollment stats so each dashboard section can load
        // independently without duplicating the same counting logic in the UI.
        .leftJoin(
          Enrollment,
          'enrollment',
          'enrollment.courseId = course.id AND enrollment.status = :status',
          { status: EnrollmentStatus.ACTIVE },
        )
        .select('course.id', 'id')
        .addSelect('course.name', 'name')
        .addSelect('course.thumbnail', 'thumbnail')
        .addSelect('author.fullName', 'authorName')
        .addSelect('author.avatar', 'authorAvatar')
        .addSelect('course.price', 'price')
        .addSelect('course.rating', 'rating')
        .addSelect('course.reviewCount', 'reviewCount')
        .addSelect('course.discussionCount', 'discussionCount')
        .addSelect('course.createdAt', 'createdAt')
        .addSelect('COUNT(enrollment.id)', 'purchasedCount')
        .addSelect('COALESCE(AVG(enrollment.progress), 0)', 'averageProgress')
        .addSelect(
          'COALESCE(COUNT(enrollment.id) * course.price, 0)',
          'revenue',
        )
        .where('course.deletedAt IS NULL')
        .groupBy('course.id')
        .addGroupBy('course.name')
        .addGroupBy('course.thumbnail')
        .addGroupBy('course.price')
        .addGroupBy('course.rating')
        .addGroupBy('course.reviewCount')
        .addGroupBy('course.discussionCount')
        .addGroupBy('course.createdAt')
        .addGroupBy('author.id')
        .addGroupBy('author.fullName')
        .addGroupBy('author.avatar')
        .limit(limit)
    );
  }

  private roundMetric(value: number): number {
    return Number(value.toFixed(1));
  }
}
