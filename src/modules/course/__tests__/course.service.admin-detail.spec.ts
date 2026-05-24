jest.mock('@src/common/helpers', () => ({
  generateSlug: (value: string) => value.toLowerCase(),
}));

import { CourseService } from '@src/modules/course/course.service';
import { Course } from '@src/modules/course/entities/course.entity';

describe('CourseService admin detail visibility', () => {
  const makeCourse = (): Course =>
    ({
      chapters: [
        {
          lectures: [
            {
              attributes: { libraryId: 'lib-1', videoGuid: 'video-1' },
              id: 'lecture-draft',
              isPublished: false,
              videoUrl: 'https://video.example/private.mp4',
            },
          ],
        },
      ],
      id: 'course-1',
    }) as Course;

  const makeService = (course: Course) => {
    const queryBuilder = {
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(course),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };
    const courseRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    return new CourseService(courseRepository as never, {} as never);
  };

  it('redacts unpublished lecture video asset data on public detail', async () => {
    const service = makeService(makeCourse());

    const course = await service.findOne('course-1');
    const lecture = course.chapters[0].lectures[0];

    expect(lecture.videoUrl).toBeNull();
    expect(lecture.attributes).toBeUndefined();
  });

  it('keeps unpublished lecture video asset data on admin detail', async () => {
    const service = makeService(makeCourse());

    const course = await service.findAdminOne('course-1');
    const lecture = course.chapters[0].lectures[0];

    expect(lecture.videoUrl).toBe('https://video.example/private.mp4');
    expect(lecture.attributes).toEqual({
      libraryId: 'lib-1',
      videoGuid: 'video-1',
    });
  });
});
