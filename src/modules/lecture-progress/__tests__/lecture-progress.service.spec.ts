import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EnrollmentService } from '@src/modules/enrollment/enrollment.service';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';
import { LectureProgressAction } from '@src/modules/lecture-progress/dto/update-lecture-progress.dto';
import { LectureProgress } from '@src/modules/lecture-progress/entities/lecture-progress.entity';
import { LectureProgressService } from '@src/modules/lecture-progress/lecture-progress.service';

type QueryBuilderMock = {
  innerJoin: jest.Mock;
  innerJoinAndSelect: jest.Mock;
  select: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  getOne: jest.Mock;
  getMany: jest.Mock;
};

describe('LectureProgressService', () => {
  let service: LectureProgressService;
  let lectureProgressRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let lectureRepository: {
    createQueryBuilder: jest.Mock;
  };
  let enrollmentService: {
    findOwnedEnrollment: jest.Mock;
    findById: jest.Mock;
    updateProgress: jest.Mock;
  };

  const enrollment = {
    id: '11111111-1111-4111-8111-111111111111',
    courseId: '22222222-2222-4222-8222-222222222222',
    completedAt: null,
    progress: 0,
  };
  const lecture = {
    id: '33333333-3333-4333-8333-333333333333',
    duration: 100,
  };

  const makeQueryBuilder = (result: {
    one?: Partial<Lecture> | null;
    many?: Partial<Lecture>[];
  }): QueryBuilderMock => {
    const builder = {
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(result.one),
      getMany: jest.fn().mockResolvedValue(result.many ?? []),
    };

    return builder;
  };

  const mockLectureLookups = (trackableLectures: Partial<Lecture>[]) => {
    lectureRepository.createQueryBuilder
      .mockReturnValueOnce(makeQueryBuilder({ one: lecture }))
      .mockReturnValueOnce(makeQueryBuilder({ many: trackableLectures }));
  };

  beforeEach(async () => {
    lectureProgressRepository = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
    };
    lectureRepository = {
      createQueryBuilder: jest.fn(),
    };
    enrollmentService = {
      findOwnedEnrollment: jest.fn().mockResolvedValue(enrollment),
      findById: jest.fn().mockResolvedValue(enrollment),
      updateProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureProgressService,
        {
          provide: getRepositoryToken(LectureProgress),
          useValue: lectureProgressRepository,
        },
        {
          provide: getRepositoryToken(Lecture),
          useValue: lectureRepository,
        },
        {
          provide: EnrollmentService,
          useValue: enrollmentService,
        },
      ],
    }).compile();

    service = module.get(LectureProgressService);
  });

  it('does not reduce watchedSeconds on timeupdate', async () => {
    const progress = {
      duration: 100,
      enrollmentId: enrollment.id,
      isCompleted: false,
      lectureId: lecture.id,
      watchedSeconds: 80,
    };
    lectureProgressRepository.findOne.mockResolvedValue(progress);
    lectureProgressRepository.find.mockResolvedValue([progress]);
    mockLectureLookups([lecture]);

    await service.syncLectureProgress(
      {
        action: LectureProgressAction.TIMEUPDATE,
        duration: 100,
        enrollmentId: enrollment.id,
        lectureId: lecture.id,
        watchedSeconds: 30,
      },
      'user-1',
    );

    expect(lectureProgressRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        isCompleted: false,
        watchedSeconds: 80,
      }),
    );
    expect(enrollmentService.updateProgress).toHaveBeenCalledWith(
      enrollment.id,
      0,
      null,
    );
  });

  it('marks a lecture completed on ended and completes the enrollment when it is the last lecture', async () => {
    const progress = {
      duration: 100,
      enrollmentId: enrollment.id,
      isCompleted: false,
      lectureId: lecture.id,
      watchedSeconds: 40,
    };
    lectureProgressRepository.findOne.mockResolvedValue(progress);
    lectureProgressRepository.find.mockResolvedValue([progress]);
    mockLectureLookups([lecture]);

    const snapshot = await service.syncLectureProgress(
      {
        action: LectureProgressAction.ENDED,
        duration: 100,
        enrollmentId: enrollment.id,
        lectureId: lecture.id,
        watchedSeconds: 100,
      },
      'user-1',
    );

    expect(progress.isCompleted).toBe(true);
    expect(progress.watchedSeconds).toBe(100);
    expect(snapshot.progress).toBe(100);
    expect(snapshot.completedLectures).toBe(1);
    expect(enrollmentService.updateProgress).toHaveBeenCalledWith(
      enrollment.id,
      100,
      expect.any(Date),
    );
  });

  it('completes at the threshold and recomputes enrollment progress immediately', async () => {
    const progress = {
      duration: 100,
      enrollmentId: enrollment.id,
      isCompleted: false,
      lectureId: lecture.id,
      watchedSeconds: 80,
    };
    lectureProgressRepository.findOne.mockResolvedValue(progress);
    lectureProgressRepository.find.mockResolvedValue([progress]);
    mockLectureLookups([
      lecture,
      { id: '44444444-4444-4444-8444-444444444444' },
    ]);

    const snapshot = await service.syncLectureProgress(
      {
        action: LectureProgressAction.TIMEUPDATE,
        duration: 100,
        enrollmentId: enrollment.id,
        lectureId: lecture.id,
        watchedSeconds: 95,
      },
      'user-1',
    );

    expect(progress.isCompleted).toBe(true);
    expect(snapshot.progress).toBe(50);
    expect(snapshot.completedAt).toBeNull();
    expect(enrollmentService.updateProgress).toHaveBeenCalledWith(
      enrollment.id,
      50,
      null,
    );
  });

  it('keeps completedAt null when the whole course is not completed', async () => {
    const progress = {
      duration: 100,
      enrollmentId: enrollment.id,
      isCompleted: false,
      lectureId: lecture.id,
      watchedSeconds: 10,
    };
    lectureProgressRepository.findOne.mockResolvedValue(progress);
    lectureProgressRepository.find.mockResolvedValue([progress]);
    mockLectureLookups([lecture]);

    const snapshot = await service.syncLectureProgress(
      {
        action: LectureProgressAction.PAUSE,
        duration: 100,
        enrollmentId: enrollment.id,
        lectureId: lecture.id,
        watchedSeconds: 20,
      },
      'user-1',
    );

    expect(snapshot.progress).toBe(0);
    expect(snapshot.completedAt).toBeNull();
    expect(enrollmentService.updateProgress).toHaveBeenCalledWith(
      enrollment.id,
      0,
      null,
    );
  });
});
