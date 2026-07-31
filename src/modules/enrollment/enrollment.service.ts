import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ValidationErrorCode } from '@src/common/constants';
import { ROLES } from '@src/common/constants/roles';
import {
  EnrollmentFilter,
  EnrollmentStatus,
  PaginatedResponse,
} from '@src/common/types';
import { Course } from '@src/modules/course/entities/course.entity';
import { EmailService } from '@src/modules/email/email.service';
import { NotificationService } from '@src/modules/notification/notification.service';
import { User } from '@src/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { DirectEnrollDto } from './dto/direct-enroll.dto';
import { ReviewEnrollmentDto } from './dto/review-enrollment.dto';
import { UpdateEnrollmentLearningStateDto } from './dto/update-enrollment-learning-state.dto';
import { Enrollment } from './entities/enrollment.entity';

export interface EnrollmentLearningNote {
  id: string;
  lectureId: string;
  content: string;
  timestampSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentLearningState {
  version: 1;
  activeLectureId: string | null;
  notes: EnrollmentLearningNote[];
  legacyText?: string;
}

export interface LearningEnrollmentDetail extends Enrollment {
  learningState: EnrollmentLearningState;
}

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  async createEnrollment(
    createEnrollmentDto: CreateEnrollmentDto,
    userId: string,
  ): Promise<Enrollment> {
    const { courseId, notes, fullName, phone } = createEnrollmentDto;

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course || course.deletedAt) {
      throw new NotFoundException(ValidationErrorCode.COURSE_NOT_FOUND);
    }

    const existingActiveOrPending = await this.enrollmentRepository.findOne({
      where: [
        { courseId, userId, status: EnrollmentStatus.PENDING },
        { courseId, userId, status: EnrollmentStatus.ACTIVE },
      ],
      order: { updatedAt: 'DESC' },
    });

    if (existingActiveOrPending?.status === EnrollmentStatus.ACTIVE) {
      throw new ConflictException({
        code: ValidationErrorCode.ENROLLMENT_ALREADY_EXISTS,
        message: ValidationErrorCode.ENROLLMENT_ALREADY_EXISTS,
      });
    }

    if (existingActiveOrPending?.status === EnrollmentStatus.PENDING) {
      throw new ConflictException({
        code: ValidationErrorCode.ENROLLMENT_PENDING_APPROVAL,
        message: ValidationErrorCode.ENROLLMENT_PENDING_APPROVAL,
      });
    }

    const reusableEnrollment = await this.enrollmentRepository.findOne({
      where: { courseId, userId },
      order: { updatedAt: 'DESC' },
    });

    if (reusableEnrollment) {
      reusableEnrollment.status = EnrollmentStatus.PENDING;
      reusableEnrollment.notes = notes?.trim() ?? null;
      reusableEnrollment.fullName = fullName?.trim() ?? null;
      reusableEnrollment.phone = phone?.trim() ?? null;
      reusableEnrollment.progress = 0;
      reusableEnrollment.startAt = new Date();
      reusableEnrollment.completedAt = null;
      reusableEnrollment.approvedAt = null;
      reusableEnrollment.reviewedAt = null;
      reusableEnrollment.reviewedById = null;
      reusableEnrollment.reviewNote = null;
      reusableEnrollment.learningStateData = null;

      const savedEnrollment =
        await this.enrollmentRepository.save(reusableEnrollment);
      await this.notifyAdminsOnNewEnrollment(savedEnrollment);
      return savedEnrollment;
    }

    const enrollment = this.enrollmentRepository.create({
      courseId,
      notes: notes?.trim() ?? null,
      fullName: fullName?.trim() ?? null,
      phone: phone?.trim() ?? null,
      userId,
      status: EnrollmentStatus.PENDING,
      startAt: new Date(),
      learningStateData: null,
      approvedAt: null,
      reviewedAt: null,
      reviewedById: null,
      reviewNote: null,
    });

    const savedEnrollment = await this.enrollmentRepository.save(enrollment);
    await this.notifyAdminsOnNewEnrollment(savedEnrollment);
    return savedEnrollment;
  }

  async directEnroll(
    dto: DirectEnrollDto,
    adminId: string,
  ): Promise<{ created: number; skipped: number; enrollments: Enrollment[] }> {
    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
    });

    if (!course || course.deletedAt) {
      throw new NotFoundException(ValidationErrorCode.COURSE_NOT_FOUND);
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: dto.userIds })
      .getMany();

    const foundUserIds = new Set(users.map((u) => u.id));
    const enrollments: Enrollment[] = [];
    let created = 0;
    let skipped = 0;

    for (const userId of dto.userIds) {
      if (!foundUserIds.has(userId)) {
        skipped++;
        continue;
      }

      const existing = await this.enrollmentRepository.findOne({
        where: { userId, courseId: dto.courseId, status: EnrollmentStatus.ACTIVE },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const enrollment = this.enrollmentRepository.create({
        userId,
        courseId: dto.courseId,
        status: EnrollmentStatus.ACTIVE,
        progress: 0,
        startAt: new Date(),
        approvedAt: new Date(),
        reviewedById: adminId,
      });

      const saved = await this.enrollmentRepository.save(enrollment);
      enrollments.push(saved);
      created++;

      const user = users.find((u) => u.id === userId);
      if (user) {
        await this.notificationService.create({
          userId,
          type: 'enrollment.direct',
          title: 'Đã được thêm vào khoá học',
          message: `Bạn đã được thêm vào khoá học **${course.name}**. Bắt đầu học ngay!`,
          relatedEnrollmentId: saved.id,
        });
      }
    }

    return { created, skipped, enrollments };
  }

  async findById(enrollmentId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['course', 'user'],
    });

    if (!enrollment) {
      throw new NotFoundException(ValidationErrorCode.ENROLLMENT_NOT_FOUND);
    }

    return enrollment;
  }

  async findOwnedEnrollment(
    enrollmentId: string,
    userId: string,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, userId },
      relations: ['course', 'user'],
    });

    if (!enrollment) {
      throw new NotFoundException(ValidationErrorCode.ENROLLMENT_NOT_FOUND);
    }

    return enrollment;
  }

  async updateProgress(
    enrollmentId: string,
    progress: number,
    completedAt: Date | null,
  ): Promise<void> {
    await this.enrollmentRepository.update(enrollmentId, {
      progress,
      completedAt,
    });
  }

  async getEnrollmentByCourse(
    courseId: string,
    userId: string,
  ): Promise<Enrollment | null> {
    return this.enrollmentRepository.findOne({
      where: { courseId, userId },
      relations: ['course'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getEnrollmentsByUserId(userId: string): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({
      where: { userId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDetailEnrollment(
    enrollmentId: string,
    userId: string,
  ): Promise<LearningEnrollmentDetail> {
    const ownedEnrollment = await this.findOwnedEnrollment(
      enrollmentId,
      userId,
    );

    if (ownedEnrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new ForbiddenException({
        code: ValidationErrorCode.ENROLLMENT_ACCESS_DENIED,
        message: ValidationErrorCode.ENROLLMENT_ACCESS_DENIED,
      });
    }

    const enrollment = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect(
        'course.chapters',
        'chapter',
        'chapter.deletedAt IS NULL AND chapter.isPublished = :chapterPublished',
        { chapterPublished: true },
      )
      .leftJoinAndSelect(
        'chapter.lectures',
        'lecture',
        'lecture.deletedAt IS NULL AND lecture.isPublished = :lecturePublished',
        { lecturePublished: true },
      )
      .leftJoinAndSelect('lecture.quiz', 'lectureQuiz')
      .where('enrollment.id = :id', { id: enrollmentId })
      .andWhere('enrollment.userId = :userId', { userId })
      .andWhere('enrollment.status = :status', {
        status: EnrollmentStatus.ACTIVE,
      })
      .orderBy('chapter.order', 'ASC')
      .addOrderBy('lecture.order', 'ASC')
      .getOne();

    if (!enrollment) {
      throw new NotFoundException(ValidationErrorCode.ENROLLMENT_NOT_FOUND);
    }

    return this.mapLearningEnrollmentDetail(enrollment);
  }

  async updateLearningState(
    enrollmentId: string,
    userId: string,
    payload: UpdateEnrollmentLearningStateDto,
  ): Promise<LearningEnrollmentDetail> {
    const enrollment = await this.findOwnedEnrollment(enrollmentId, userId);

    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new ForbiddenException({
        code: ValidationErrorCode.ENROLLMENT_ACCESS_DENIED,
        message: ValidationErrorCode.ENROLLMENT_ACCESS_DENIED,
      });
    }

    const currentState = this.parseLearningState(
      enrollment.learningStateData ?? enrollment.notes,
    );

    const nextState: EnrollmentLearningState = {
      ...currentState,
      activeLectureId: payload.activeLectureId ?? currentState.activeLectureId,
      notes: payload.notes
        ? payload.notes.map((note) => ({
            id: note.id,
            lectureId: note.lectureId,
            content: note.content.trim(),
            timestampSeconds: Math.max(0, Math.floor(note.timestampSeconds)),
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          }))
        : currentState.notes,
    };

    enrollment.learningStateData = this.serializeLearningState(nextState);
    await this.enrollmentRepository.save(enrollment);

    return this.getDetailEnrollment(enrollmentId, userId);
  }

  async getMyEnrollments(
    userId: string,
    filter: EnrollmentFilter,
  ): Promise<PaginatedResponse<Enrollment>> {
    const { page = 1, limit = 10, search, status } = filter;

    const queryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .where('enrollment.userId = :userId', { userId })
      .orderBy('enrollment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(course.name LIKE :search OR course.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('enrollment.status = :status', { status });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getCourseEnrollments(
    courseId: string,
    filter: EnrollmentFilter,
  ): Promise<PaginatedResponse<Enrollment>> {
    const { page = 1, limit = 10, search, status } = filter;

    const queryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.user', 'user')
      .leftJoinAndSelect('enrollment.course', 'course')
      .where('enrollment.courseId = :courseId', { courseId })
      .addSelect(
        `CASE
          WHEN enrollment.status = '${EnrollmentStatus.PENDING}' THEN 0
          WHEN enrollment.status = '${EnrollmentStatus.ACTIVE}' THEN 1
          WHEN enrollment.status = '${EnrollmentStatus.REJECTED}' THEN 2
          ELSE 3
        END`,
        'status_order',
      )
      .orderBy('status_order', 'ASC')
      .addOrderBy('enrollment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(user.fullName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('enrollment.status = :status', { status });
    }

    const countQb = queryBuilder.clone();
    countQb.expressionMap.orderBys = {};
    const total = await countQb.getCount();
    const items = await queryBuilder.getMany();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getAllEnrollments(
    filter: EnrollmentFilter,
  ): Promise<PaginatedResponse<Enrollment>> {
    const { page = 1, limit = 10, search, status } = filter;

    const queryBuilder = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.user', 'user')
      .leftJoinAndSelect('enrollment.course', 'course')
      .addSelect(
        `CASE
          WHEN enrollment.status = '${EnrollmentStatus.PENDING}' THEN 0
          WHEN enrollment.status = '${EnrollmentStatus.ACTIVE}' THEN 1
          WHEN enrollment.status = '${EnrollmentStatus.REJECTED}' THEN 2
          ELSE 3
        END`,
        'status_order',
      )
      .orderBy('status_order', 'ASC')
      .addOrderBy('enrollment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(user.fullName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('enrollment.status = :status', { status });
    }

    const countQb = queryBuilder.clone();
    countQb.expressionMap.orderBys = {};
    const total = await countQb.getCount();
    const items = await queryBuilder.getMany();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  private async notifyAdminsOnNewEnrollment(
    enrollment: Enrollment,
  ): Promise<void> {
    const admins = await this.userRepository.find({
      where: [{ roleCode: ROLES.ADMIN }, { roleCode: ROLES.SUPER_ADMIN }],
    });

    const course = await this.courseRepository.findOne({
      where: { id: enrollment.courseId },
    });
    const user = await this.userRepository.findOne({
      where: { id: enrollment.userId },
    });

    for (const admin of admins) {
      await this.notificationService.create({
        userId: admin.id,
        title: 'Yêu cầu ghi danh mới',
        message: `${user?.fullName ?? 'Học viên'} vừa gửi yêu cầu ghi danh vào "${course?.name ?? 'khoá học'}".`,
        type: 'enrollment.new',
        link: `/admin/enrollments`,
        relatedEnrollmentId: enrollment.id,
      });
    }
  }

  async reviewEnrollment(
    enrollmentId: string,
    reviewerId: string,
    payload: ReviewEnrollmentDto,
  ): Promise<Enrollment> {
    const enrollment = await this.findById(enrollmentId);

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException({
        code: ValidationErrorCode.ENROLLMENT_ALREADY_REVIEWED,
        message: ValidationErrorCode.ENROLLMENT_ALREADY_REVIEWED,
      });
    }

    enrollment.status = payload.status;
    enrollment.reviewedAt = new Date();
    enrollment.reviewedById = reviewerId;
    enrollment.reviewNote = payload.reviewNote?.trim() ?? null;
    enrollment.approvedAt =
      payload.status === EnrollmentStatus.ACTIVE ? new Date() : null;

    if (payload.status === EnrollmentStatus.REJECTED) {
      enrollment.progress = 0;
      enrollment.completedAt = null;
      enrollment.learningStateData = null;
    }

    const savedEnrollment = await this.enrollmentRepository.save(enrollment);
    const user = await this.userRepository.findOne({
      where: { id: savedEnrollment.userId },
    });
    const course = await this.courseRepository.findOne({
      where: { id: savedEnrollment.courseId },
    });

    if (user && course) {
      const approved = payload.status === EnrollmentStatus.ACTIVE;

      await this.notificationService.create({
        userId: user.id,
        title: approved
          ? 'Ghi danh đã được chấp nhận'
          : 'Ghi danh chưa được chấp nhận',
        message: approved
          ? `Bạn đã được duyệt vào khoá học "${course.name}".`
          : `Yêu cầu ghi danh vào "${course.name}" chưa được chấp nhận.`,
        type: approved ? 'enrollment.approved' : 'enrollment.rejected',
        link: approved
          ? `/learning/${savedEnrollment.id}`
          : `/courses/${course.id}`,
        relatedEnrollmentId: savedEnrollment.id,
      });

      await this.emailService.sendEnrollmentReviewEmail({
        to: user.email,
        learnerName: user.fullName,
        courseName: course.name,
        approved,
        reviewNote: savedEnrollment.reviewNote,
      });
    }

    return savedEnrollment;
  }

  private mapLearningEnrollmentDetail(
    enrollment: Enrollment,
  ): LearningEnrollmentDetail {
    return {
      ...enrollment,
      learningState: this.parseLearningState(
        enrollment.learningStateData ?? enrollment.notes,
      ),
    };
  }

  private parseLearningState(
    rawLearningState?: string | null,
  ): EnrollmentLearningState {
    const defaultState: EnrollmentLearningState = {
      version: 1,
      activeLectureId: null,
      notes: [],
    };

    if (!rawLearningState) {
      return defaultState;
    }

    try {
      const parsed = JSON.parse(
        rawLearningState,
      ) as Partial<EnrollmentLearningState>;
      const notes = Array.isArray(parsed.notes)
        ? parsed.notes
            .filter((note): note is EnrollmentLearningNote =>
              this.isLearningNote(note),
            )
            .map((note) => ({
              id: note.id,
              lectureId: note.lectureId,
              content: note.content,
              timestampSeconds: note.timestampSeconds,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            }))
        : [];

      return {
        version: 1,
        activeLectureId:
          typeof parsed.activeLectureId === 'string'
            ? parsed.activeLectureId
            : null,
        notes,
        legacyText:
          typeof parsed.legacyText === 'string' ? parsed.legacyText : undefined,
      };
    } catch {
      return {
        ...defaultState,
        legacyText: rawLearningState,
      };
    }
  }

  private serializeLearningState(state: EnrollmentLearningState): string {
    const payload: EnrollmentLearningState = {
      version: 1,
      activeLectureId: state.activeLectureId ?? null,
      notes: state.notes.map((note) => ({
        id: note.id,
        lectureId: note.lectureId,
        content: note.content.trim(),
        timestampSeconds: Math.max(0, Math.floor(note.timestampSeconds)),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
      ...(state.legacyText?.trim()
        ? { legacyText: state.legacyText.trim() }
        : {}),
    };

    return JSON.stringify(payload);
  }

  private isLearningNote(note: unknown): note is EnrollmentLearningNote {
    if (!note || typeof note !== 'object') {
      return false;
    }

    const candidate = note as Partial<EnrollmentLearningNote>;

    return (
      typeof candidate.id === 'string' &&
      typeof candidate.lectureId === 'string' &&
      typeof candidate.content === 'string' &&
      typeof candidate.timestampSeconds === 'number' &&
      Number.isFinite(candidate.timestampSeconds) &&
      typeof candidate.createdAt === 'string' &&
      typeof candidate.updatedAt === 'string'
    );
  }
}
