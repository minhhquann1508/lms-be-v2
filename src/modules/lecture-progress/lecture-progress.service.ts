import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorCode } from '@src/common/constants';
import { EnrollmentService } from '@src/modules/enrollment/enrollment.service';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';
import { CreateLectureProgressDto } from '@src/modules/lecture-progress/dto/create-lecture-progress.dto';
import {
  LectureProgressAction,
  UpdateLectureProgressDto,
} from '@src/modules/lecture-progress/dto/update-lecture-progress.dto';
import { LectureProgress } from '@src/modules/lecture-progress/entities/lecture-progress.entity';
import { EnrollmentLectureProgressSnapshot } from '@src/modules/lecture-progress/lecture-progress.controller';

@Injectable()
export class LectureProgressService {
  constructor(
    @InjectRepository(LectureProgress)
    private readonly lectureProgressRepository: Repository<LectureProgress>,

    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,

    private readonly enrollmentService: EnrollmentService,
  ) {}

  async createLectureProgress(
    createLectureProgressDto: CreateLectureProgressDto,
  ): Promise<LectureProgress> {
    const lecture = await this.findLectureForEnrollment(
      createLectureProgressDto.lectureId,
      createLectureProgressDto.enrollmentId,
    );

    const existingProgress = await this.lectureProgressRepository.findOne({
      where: {
        enrollmentId: createLectureProgressDto.enrollmentId,
        lectureId: createLectureProgressDto.lectureId,
      },
    });

    if (existingProgress) {
      return existingProgress;
    }

    const lectureProgress = this.lectureProgressRepository.create({
      ...createLectureProgressDto,
      duration: lecture.duration,
      watchedSeconds: 0,
      isCompleted: false,
      updatedAt: new Date(),
    });

    return await this.lectureProgressRepository.save(lectureProgress);
  }

  async getEnrollmentProgressSnapshot(
    enrollmentId: string,
    userId: string,
  ): Promise<EnrollmentLectureProgressSnapshot> {
    await this.enrollmentService.findOwnedEnrollment(enrollmentId, userId);
    return await this.buildEnrollmentProgressSnapshot(enrollmentId);
  }

  async syncLectureProgress(
    updateLectureProgressDto: UpdateLectureProgressDto,
    userId: string,
  ): Promise<EnrollmentLectureProgressSnapshot> {
    const enrollment = await this.enrollmentService.findOwnedEnrollment(
      updateLectureProgressDto.enrollmentId,
      userId,
    );
    const lecture = await this.findLectureForEnrollment(
      updateLectureProgressDto.lectureId,
      enrollment.id,
    );

    let lectureProgress = await this.lectureProgressRepository.findOne({
      where: {
        enrollmentId: enrollment.id,
        lectureId: lecture.id,
      },
    });

    lectureProgress ??= this.lectureProgressRepository.create({
      enrollmentId: enrollment.id,
      lectureId: lecture.id,
      duration: lecture.duration,
      watchedSeconds: 0,
      isCompleted: false,
    });

    const nextState = this.computeNextProgressState(
      lectureProgress,
      updateLectureProgressDto.watchedSeconds,
      updateLectureProgressDto.action,
      updateLectureProgressDto.duration,
    );

    lectureProgress.watchedSeconds = nextState.watchedSeconds;
    lectureProgress.isCompleted = nextState.isCompleted;
    lectureProgress.duration = nextState.duration || lecture.duration;
    lectureProgress.updatedAt = new Date();

    await this.lectureProgressRepository.save(lectureProgress);

    return await this.recomputeEnrollmentProgress(enrollment.id);
  }

  async updateLectureProgress(
    lectureProgressId: string,
    watchedSeconds: number,
  ): Promise<LectureProgress> {
    const lectureProgress = await this.lectureProgressRepository.findOne({
      where: { id: lectureProgressId },
    });

    if (!lectureProgress) {
      throw new NotFoundException(
        ValidationErrorCode.LECTURE_PROGRESS_NOT_FOUND,
      );
    }

    const nextState = this.computeNextProgressState(
      lectureProgress,
      watchedSeconds,
      LectureProgressAction.TIMEUPDATE,
    );

    lectureProgress.watchedSeconds = nextState.watchedSeconds;
    lectureProgress.isCompleted = nextState.isCompleted;
    lectureProgress.updatedAt = new Date();

    return await this.lectureProgressRepository.save(lectureProgress);
  }

  private async recomputeEnrollmentProgress(
    enrollmentId: string,
  ): Promise<EnrollmentLectureProgressSnapshot> {
    const lectureIds = await this.getTrackableLectureIds(enrollmentId);
    const totalLectures = lectureIds.length;

    const lectureProgresses =
      totalLectures === 0
        ? []
        : await this.lectureProgressRepository.find({
            where: { enrollmentId },
          });

    const lectureProgressMap = new Map(
      lectureProgresses.map((item) => [item.lectureId, item]),
    );

    const completedLectures = lectureIds.filter(
      (lectureId) => lectureProgressMap.get(lectureId)?.isCompleted,
    ).length;

    const progress =
      totalLectures === 0
        ? 0
        : Math.round((completedLectures / totalLectures) * 100);
    const completedAt =
      totalLectures > 0 && completedLectures === totalLectures
        ? new Date()
        : null;

    await this.enrollmentService.updateProgress(
      enrollmentId,
      progress,
      completedAt,
    );

    return {
      enrollmentId,
      progress,
      completedAt,
      totalLectures,
      completedLectures,
      lectureProgresses,
    };
  }

  private async buildEnrollmentProgressSnapshot(
    enrollmentId: string,
  ): Promise<EnrollmentLectureProgressSnapshot> {
    const enrollment = await this.enrollmentService.findById(enrollmentId);
    const lectureIds = await this.getTrackableLectureIds(enrollmentId);
    const lectureProgresses = await this.lectureProgressRepository.find({
      where: { enrollmentId },
    });

    const completedLectures = lectureIds.filter((lectureId) =>
      lectureProgresses.some(
        (lectureProgress) =>
          lectureProgress.lectureId === lectureId &&
          lectureProgress.isCompleted,
      ),
    ).length;

    return {
      enrollmentId,
      progress: enrollment.progress,
      completedAt: enrollment.completedAt,
      totalLectures: lectureIds.length,
      completedLectures,
      lectureProgresses,
    };
  }

  private async getTrackableLectureIds(
    enrollmentId: string,
  ): Promise<string[]> {
    const enrollment = await this.enrollmentService.findById(enrollmentId);

    const lectures = await this.lectureRepository
      .createQueryBuilder('lecture')
      .innerJoin('lecture.chapter', 'chapter')
      .select(['lecture.id'])
      .where('chapter.courseId = :courseId', { courseId: enrollment.courseId })
      .andWhere('chapter.deletedAt IS NULL')
      .andWhere('lecture.deletedAt IS NULL')
      .andWhere('chapter.isPublished = :chapterPublished', {
        chapterPublished: true,
      })
      .andWhere('lecture.isPublished = :lecturePublished', {
        lecturePublished: true,
      })
      .orderBy('chapter.order', 'ASC')
      .addOrderBy('lecture.order', 'ASC')
      .getMany();

    return lectures.map((lecture) => lecture.id);
  }

  private async findLectureForEnrollment(
    lectureId: string,
    enrollmentId: string,
  ): Promise<Lecture> {
    const enrollment = await this.enrollmentService.findById(enrollmentId);

    const lecture = await this.lectureRepository
      .createQueryBuilder('lecture')
      .innerJoinAndSelect('lecture.chapter', 'chapter')
      .where('lecture.id = :lectureId', { lectureId })
      .andWhere('lecture.deletedAt IS NULL')
      .andWhere('chapter.deletedAt IS NULL')
      .andWhere('chapter.courseId = :courseId', {
        courseId: enrollment.courseId,
      })
      .getOne();

    if (!lecture) {
      throw new BadRequestException(ValidationErrorCode.LECTURE_NOT_FOUND);
    }

    return lecture;
  }

  private computeNextProgressState(
    lectureProgress: LectureProgress,
    watchedSeconds: number,
    action: LectureProgressAction,
    reportedDuration?: number,
  ): Pick<LectureProgress, 'watchedSeconds' | 'isCompleted' | 'duration'> {
    const effectiveDuration = Math.max(
      lectureProgress.duration,
      Math.floor(reportedDuration ?? 0),
      Math.floor(watchedSeconds),
    );
    const normalizedWatchedSeconds = Math.max(
      0,
      effectiveDuration > 0
        ? Math.min(watchedSeconds, effectiveDuration)
        : watchedSeconds,
    );
    const completionThreshold = this.getCompletionThreshold(effectiveDuration);

    let nextWatchedSeconds = lectureProgress.watchedSeconds;

    switch (action) {
      case LectureProgressAction.ENDED:
        nextWatchedSeconds =
          effectiveDuration > 0 ? effectiveDuration : normalizedWatchedSeconds;
        break;
      case LectureProgressAction.TIMEUPDATE:
      case LectureProgressAction.PAUSE:
        nextWatchedSeconds = Math.max(
          lectureProgress.watchedSeconds,
          normalizedWatchedSeconds,
        );
        break;
      case LectureProgressAction.SEEKED:
        nextWatchedSeconds = lectureProgress.watchedSeconds;
        break;
    }

    const isCompleted =
      lectureProgress.isCompleted ||
      action === LectureProgressAction.ENDED ||
      (effectiveDuration > 0 && nextWatchedSeconds >= completionThreshold);

    return {
      duration: effectiveDuration,
      watchedSeconds: nextWatchedSeconds,
      isCompleted,
    };
  }

  private getCompletionThreshold(duration: number): number {
    if (duration <= 0) {
      return 0;
    }

    return Math.max(duration - 5, duration * 0.95);
  }
}
