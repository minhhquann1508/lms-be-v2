import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import slugify from 'slugify';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { AppDataSource } from '@src/config/data-source';
import { ROLES } from '@src/common/constants/roles';
import { User } from '@src/modules/user/entities/user.entity';
import { Course } from '@src/modules/course/entities/course.entity';
import { Chapter } from '@src/modules/chapter/entities/chapter.entity';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import { Question } from '@src/modules/quiz/entities/question.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';

type UserSeed = {
  email: string;
  fullName: string;
  avatar: string;
  roleCode: string;
};

type LectureSeed = {
  name: string;
  description: string;
  duration: number;
  videoUrl: string;
  attributes: Record<string, unknown>;
};

type ChapterSeed = {
  name: string;
  description: string;
  lectures: LectureSeed[];
};

type CourseSeed = {
  key: string;
  name: string;
  description: string;
  thumbnail: string;
  price: number;
  rating: number;
  reviewCount: number;
  discussionCount: number;
  chapters: ChapterSeed[];
};

type CourseBlueprint = {
  key: string;
  name: string;
  focus: string;
  audience: string;
  outcome: string;
  thumbnail: string;
  price: number;
};

const PASSWORD = process.env.SEED_USER_PASSWORD ?? '1508';
const ADMIN_EMAIL = 'super.admin@gmail.com';
const TESTING_USER_EMAIL = 'user.testing@gmail.com';

const users: UserSeed[] = [
  {
    email: ADMIN_EMAIL,
    fullName: 'LMS Admin',
    avatar: 'https://i.pravatar.cc/320?img=11',
    roleCode: ROLES.ADMIN,
  },
  {
    email: TESTING_USER_EMAIL,
    fullName: 'Testing User',
    avatar: 'https://i.pravatar.cc/320?img=24',
    roleCode: ROLES.USER,
  },
];

const VIDEO_LIBRARY = [
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
];

const courseBlueprints: CourseBlueprint[] = [
  {
    key: 'nextjs-saas-lms',
    name: 'Next.js SaaS LMS from Design to Production',
    focus: 'xây dựng một learning platform hiện đại bằng Next.js',
    audience: 'frontend developer muốn làm sản phẩm thực tế',
    outcome:
      'hoàn thiện giao diện học, catalog, checkout và luồng dashboard cơ bản',
    thumbnail:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    price: 890000,
  },
  {
    key: 'nestjs-api-architecture',
    name: 'NestJS API Architecture for Real LMS Products',
    focus: 'thiết kế backend NestJS có module, service và contract rõ ràng',
    audience: 'backend developer cần xây API bền vững',
    outcome: 'triển khai API course, enrollment, auth, validation và migration',
    thumbnail:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    price: 790000,
  },
  {
    key: 'postgres-data-modeling',
    name: 'PostgreSQL Data Modeling for Product Teams',
    focus: 'mô hình hoá dữ liệu sản phẩm, quan hệ và chỉ số vận hành',
    audience: 'developer và analyst cần hiểu database thật chắc',
    outcome: 'thiết kế schema, index, query và reporting table dễ mở rộng',
    thumbnail:
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
    price: 690000,
  },
  {
    key: 'react-query-state',
    name: 'React Query and State Management in Practice',
    focus: 'quản lý server state, cache, optimistic update và form flow',
    audience: 'React developer đang xây app nhiều dữ liệu',
    outcome: 'tạo trải nghiệm load nhanh, ít bug và dễ debug hơn',
    thumbnail:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    price: 750000,
  },
  {
    key: 'typescript-systems',
    name: 'TypeScript for Maintainable Application Systems',
    focus: 'dùng TypeScript để kiểm soát domain model và luồng dữ liệu',
    audience: 'developer muốn code rõ ràng, ít lỗi runtime',
    outcome: 'viết type, generic, schema và utility dùng được trong dự án lớn',
    thumbnail:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    price: 650000,
  },
  {
    key: 'figma-design-systems',
    name: 'Figma Design Systems for Product Builders',
    focus: 'xây design system có token, component và handoff rõ ràng',
    audience: 'designer và frontend muốn làm việc đồng bộ hơn',
    outcome: 'tạo UI kit, variants, style guide và quy trình bàn giao',
    thumbnail:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    price: 720000,
  },
  {
    key: 'edtech-product-management',
    name: 'Product Management for EdTech and Learning Apps',
    focus:
      'định hình roadmap, discovery và ưu tiên tính năng cho sản phẩm học tập',
    audience: 'product manager, founder và team lead',
    outcome: 'chuyển insight học viên thành roadmap và backlog có trọng tâm',
    thumbnail:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    price: 830000,
  },
  {
    key: 'marketing-analytics',
    name: 'Digital Marketing Analytics for Course Launches',
    focus: 'đọc dữ liệu marketing, funnel, cohort và campaign performance',
    audience: 'marketer và founder bán khoá học online',
    outcome: 'thiết lập tracking, dashboard và quyết định tối ưu campaign',
    thumbnail:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    price: 590000,
  },
  {
    key: 'python-data-analysis',
    name: 'Python Data Analysis with Real Business Datasets',
    focus: 'phân tích dữ liệu bằng Python, pandas và notebook workflow',
    audience: 'người mới bắt đầu data analysis',
    outcome: 'làm sạch dữ liệu, trực quan hoá và viết báo cáo insight',
    thumbnail:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    price: 760000,
  },
  {
    key: 'machine-learning-foundations',
    name: 'Machine Learning Foundations for Practical Teams',
    focus: 'nắm nền tảng machine learning qua bài toán business dễ hiểu',
    audience: 'developer và analyst muốn bước vào ML',
    outcome: 'xây model đầu tiên, đánh giá kết quả và tránh sai lầm phổ biến',
    thumbnail:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    price: 990000,
  },
  {
    key: 'devops-docker-cicd',
    name: 'Docker and CI/CD for Modern Web Teams',
    focus: 'đóng gói app, chạy môi trường nhất quán và tự động deploy',
    audience: 'developer muốn chủ động hơn với hạ tầng',
    outcome:
      'viết Dockerfile, pipeline CI/CD, health check và release workflow',
    thumbnail:
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
    price: 870000,
  },
  {
    key: 'aws-cloud-practitioner',
    name: 'AWS Cloud Practitioner for Application Developers',
    focus: 'hiểu dịch vụ cloud cốt lõi và cách chọn hạ tầng phù hợp',
    audience: 'developer và operator bắt đầu với AWS',
    outcome: 'nắm compute, storage, network, security và cost awareness',
    thumbnail:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    price: 680000,
  },
  {
    key: 'cybersecurity-fundamentals',
    name: 'Cybersecurity Fundamentals for Product Teams',
    focus: 'bảo mật ứng dụng, dữ liệu người dùng và quy trình vận hành',
    audience: 'developer, PM và admin vận hành sản phẩm số',
    outcome: 'nhận diện rủi ro, thiết kế access control và checklist bảo mật',
    thumbnail:
      'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1200&q=80',
    price: 740000,
  },
  {
    key: 'react-native-mobile',
    name: 'React Native Mobile App Design and Delivery',
    focus: 'xây mobile app cross-platform có UX gọn và luồng dữ liệu rõ',
    audience: 'frontend developer chuyển sang mobile',
    outcome: 'thiết kế navigation, form, API integration và release checklist',
    thumbnail:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    price: 810000,
  },
  {
    key: 'business-english-tech',
    name: 'Business English for Tech and Product Teams',
    focus: 'giao tiếp tiếng Anh trong họp, email, demo và xử lý feedback',
    audience: 'developer, designer và PM làm việc với team quốc tế',
    outcome: 'nói rõ vấn đề, trình bày giải pháp và phản hồi tự tin hơn',
    thumbnail:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
    price: 520000,
  },
  {
    key: 'agile-scrum-delivery',
    name: 'Agile Scrum Delivery for Busy Software Teams',
    focus: 'vận hành sprint, planning, review và retrospective hiệu quả',
    audience: 'team lead, PM và developer trong team sản phẩm',
    outcome: 'giảm chaos, tăng minh bạch và cải thiện nhịp release',
    thumbnail:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
    price: 610000,
  },
  {
    key: 'finance-dashboard-bi',
    name: 'Finance Dashboards with Excel and BI Thinking',
    focus: 'xây dashboard tài chính dễ đọc cho người ra quyết định',
    audience: 'finance operator, analyst và founder',
    outcome: 'chuẩn hoá dữ liệu, tính KPI và trình bày báo cáo rõ ràng',
    thumbnail:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    price: 630000,
  },
  {
    key: 'ai-content-creation',
    name: 'AI Content Creation Workflows for Educators',
    focus:
      'dùng AI để lên outline, viết nội dung, tạo quiz và review chất lượng',
    audience: 'giảng viên, creator và instructional designer',
    outcome: 'tăng tốc sản xuất bài học nhưng vẫn giữ tính kiểm chứng',
    thumbnail:
      'https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=1200&q=80',
    price: 780000,
  },
  {
    key: 'ecommerce-operations',
    name: 'E-commerce Operations from Catalog to Fulfillment',
    focus: 'vận hành bán hàng online từ danh mục, đơn hàng đến chăm sóc khách',
    audience: 'operator, founder và marketer thương mại điện tử',
    outcome: 'xây quy trình catalog, campaign, inventory và reporting',
    thumbnail:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    price: 700000,
  },
  {
    key: 'customer-success-playbook',
    name: 'Customer Success Playbook for Subscription Products',
    focus: 'thiết kế onboarding, health score, support và retention playbook',
    audience: 'customer success, support lead và founder SaaS',
    outcome: 'tăng activation, giảm churn và tạo quy trình chăm sóc có dữ liệu',
    thumbnail:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    price: 660000,
  },
];

const chapterTemplates = [
  {
    title: 'Nền tảng và định hướng',
    summary: 'nắm bức tranh tổng quan, mục tiêu học và các khái niệm nền tảng',
  },
  {
    title: 'Thiết lập môi trường và workflow',
    summary: 'chuẩn bị công cụ, quy ước làm việc và cấu trúc dự án mẫu',
  },
  {
    title: 'Triển khai module trọng tâm',
    summary: 'xây phần cốt lõi thông qua ví dụ thực tế và thao tác từng bước',
  },
  {
    title: 'Tối ưu, đo lường và xử lý lỗi',
    summary: 'cải thiện chất lượng đầu ra, hiệu năng và khả năng debug',
  },
  {
    title: 'Dự án cuối khoá và checklist demo',
    summary: 'ghép kiến thức thành sản phẩm hoàn chỉnh có thể trình bày',
  },
];

const lectureTemplates = [
  {
    title: 'Tổng quan mục tiêu và kết quả cần đạt',
    action:
      'xác định kỳ vọng, phạm vi và tiêu chí hoàn thành trước khi bắt tay vào làm',
  },
  {
    title: 'Thiết lập công cụ và dữ liệu mẫu',
    action: 'chuẩn bị môi trường, tài nguyên, file mẫu và cách kiểm tra nhanh',
  },
  {
    title: 'Khái niệm cốt lõi qua ví dụ thật',
    action:
      'giải thích khái niệm quan trọng bằng một tình huống dễ gặp trong dự án',
  },
  {
    title: 'Walkthrough từng bước',
    action: 'đi qua quy trình triển khai chi tiết để người học có thể làm theo',
  },
  {
    title: 'Bài thực hành có đầu ra rõ ràng',
    action: 'hoàn thành một phần sản phẩm có thể kiểm tra và demo ngay',
  },
  {
    title: 'Các lỗi thường gặp và cách debug',
    action: 'nhận diện lỗi phổ biến, nguyên nhân gốc và cách sửa có hệ thống',
  },
  {
    title: 'Case study trong bối cảnh doanh nghiệp',
    action: 'áp dụng kiến thức vào một case thực tế với constraint rõ ràng',
  },
  {
    title: 'Checklist chất lượng trước khi bàn giao',
    action:
      'đánh giá tính hoàn thiện, khả năng bảo trì và trải nghiệm người dùng',
  },
  {
    title: 'Mở rộng tính năng và tích hợp',
    action:
      'kết nối module với phần còn lại của sản phẩm và chuẩn bị bước nâng cấp',
  },
  {
    title: 'Tổng kết và thử thách tự làm',
    action:
      'ôn lại kiến thức chính và giao một thử thách để người học tự củng cố',
  },
];

const randomVideoUrl = (): string =>
  VIDEO_LIBRARY[Math.floor(Math.random() * VIDEO_LIBRARY.length)];

const buildStableSlug = (input: string, suffix: string): string =>
  `${slugify(input, { lower: true, strict: true, locale: 'vi' })}-${suffix}`;

const buildLecture = (
  blueprint: CourseBlueprint,
  courseIndex: number,
  chapterIndex: number,
  lectureIndex: number,
): LectureSeed => {
  const template = lectureTemplates[lectureIndex % lectureTemplates.length];
  const durationMinutes =
    8 + ((courseIndex * 3 + chapterIndex * 5 + lectureIndex * 7) % 18);

  return {
    name: `${template.title}: ${blueprint.name}`,
    description: `Bài học này giúp người học ${template.action} trong chủ đề ${blueprint.focus}. Phần cuối có ví dụ áp dụng cho nhóm ${blueprint.audience}.`,
    duration: durationMinutes * 60,
    videoUrl: randomVideoUrl(),
    attributes: {
      seed: true,
      durationMinutes,
      resources: [
        'Slide tóm tắt bài học',
        'Checklist thực hành',
        'Tệp ghi chú dùng khi demo',
      ],
      learningGoals: [
        `Hiểu cách ${blueprint.focus}`,
        `Tạo được đầu ra phục vụ mục tiêu: ${blueprint.outcome}`,
      ],
    },
  };
};

const buildCourseSeeds = (): CourseSeed[] =>
  courseBlueprints.map((blueprint, courseIndex) => {
    const chapterCount = 3 + (courseIndex % 3);
    const chapters: ChapterSeed[] = Array.from(
      { length: chapterCount },
      (_, chapterIndex) => {
        const chapterTemplate = chapterTemplates[chapterIndex];
        const lectureCount = 5 + ((courseIndex + chapterIndex * 2) % 6);
        const lectures = Array.from(
          { length: lectureCount },
          (_, lectureIndex) =>
            buildLecture(blueprint, courseIndex, chapterIndex, lectureIndex),
        );

        return {
          name: `${chapterTemplate.title}: ${blueprint.focus}`,
          description: `Chương này giúp người học ${chapterTemplate.summary}. Nội dung được đặt trong bối cảnh ${blueprint.audience} và hướng tới kết quả: ${blueprint.outcome}.`,
          lectures,
        };
      },
    );

    return {
      key: blueprint.key,
      name: blueprint.name,
      description: `${blueprint.name} dành cho ${blueprint.audience}. Khoá học tập trung vào ${blueprint.focus}, đi từ nền tảng đến bài thực hành và giúp bạn ${blueprint.outcome}.`,
      thumbnail: blueprint.thumbnail,
      price: blueprint.price,
      rating: Number((4.3 + (courseIndex % 7) * 0.08).toFixed(1)),
      reviewCount: 24 + courseIndex * 9,
      discussionCount: 12 + courseIndex * 6,
      chapters,
    };
  });

async function upsertOne<T extends { id: string }>(
  repository: Repository<T>,
  where: FindOptionsWhere<T>,
  payload: DeepPartial<T>,
): Promise<T> {
  const existing = await repository.findOne({ where });

  if (existing) {
    await repository.save(repository.create({ ...existing, ...payload }));
    const updated = await repository.findOne({ where });
    if (updated) {
      return updated;
    }
  }

  return repository.save(repository.create(payload));
}

async function clearContentTables(): Promise<void> {
  await AppDataSource.query(`
    TRUNCATE TABLE
      "lecture_progresses",
      "enrollments",
      "lectures",
      "chapters",
      "courses",
      "jobs",
      "sessions",
      "devices",
      "question_options",
      "questions",
      "quizzes"
    RESTART IDENTITY CASCADE
  `);
}

async function seedUsers(): Promise<Map<string, User>> {
  const userRepository = AppDataSource.getRepository(User);
  const password = await bcrypt.hash(
    PASSWORD,
    Number(process.env.SALT_ROUNDS ?? 10),
  );
  const seedEmails = users.map((user) => user.email);
  const result = new Map<string, User>();

  await userRepository
    .createQueryBuilder()
    .delete()
    .where('email NOT IN (:...seedEmails)', { seedEmails })
    .execute();

  for (const userSeed of users) {
    const user = await upsertOne(
      userRepository,
      { email: userSeed.email },
      {
        ...userSeed,
        password,
        isActive: true,
      },
    );

    result.set(user.email, user);
  }

  return result;
}

async function seedCourses(
  author: User,
  courseSeeds: CourseSeed[],
): Promise<void> {
  const courseRepository = AppDataSource.getRepository(Course);
  const chapterRepository = AppDataSource.getRepository(Chapter);
  const lectureRepository = AppDataSource.getRepository(Lecture);

  for (const [courseIndex, courseSeed] of courseSeeds.entries()) {
    const courseSlug = buildStableSlug(courseSeed.key, 'course');
    const course = await courseRepository.save(
      courseRepository.create({
        name: courseSeed.name,
        slug: courseSlug,
        description: courseSeed.description,
        thumbnail: courseSeed.thumbnail,
        authorId: author.id,
        duration: Math.round(
          courseSeed.chapters.reduce(
            (courseTotal, chapter) =>
              courseTotal +
              chapter.lectures.reduce(
                (chapterTotal, lecture) => chapterTotal + lecture.duration,
                0,
              ),
            0,
          ) / 60,
        ),
        price: courseSeed.price,
        rating: courseSeed.rating,
        reviewCount: courseSeed.reviewCount,
        discussionCount: courseSeed.discussionCount,
        isPublished: true,
      }),
    );

    for (const [chapterIndex, chapterSeed] of courseSeed.chapters.entries()) {
      const chapter = await chapterRepository.save(
        chapterRepository.create({
          courseId: course.id,
          name: chapterSeed.name,
          description: chapterSeed.description,
          slug: buildStableSlug(
            `${courseSeed.key}-chapter-${chapterIndex + 1}`,
            'chapter',
          ),
          order: chapterIndex + 1,
          isPublished: true,
        }),
      );

      for (const [
        lectureIndex,
        lectureSeed,
      ] of chapterSeed.lectures.entries()) {
        await lectureRepository.save(
          lectureRepository.create({
            chapterId: chapter.id,
            name: lectureSeed.name,
            description: lectureSeed.description,
            slug: buildStableSlug(
              `${courseSeed.key}-${chapterIndex + 1}-${lectureIndex + 1}`,
              'lecture',
            ),
            order: lectureIndex + 1,
            isPublished: true,
            duration: lectureSeed.duration,
            videoUrl: lectureSeed.videoUrl,
            attributes: {
              ...lectureSeed.attributes,
              courseKey: courseSeed.key,
              chapterIndex: chapterIndex + 1,
              lectureIndex: lectureIndex + 1,
              thumbnail: courseSeed.thumbnail,
            },
          }),
        );
      }
    }

    console.log(
      `Seeded course ${courseIndex + 1}/${courseSeeds.length}: ${courseSeed.name}`,
    );
  }
}

const quizTitles = [
  'Kiến thức tổng quan về khóa học',
  'Đánh giá cuối chương',
  'Bài kiểm tra kỹ năng cơ bản',
  'Trắc nghiệm nâng cao',
  'Bài kiểm tra cuối kỳ',
  'Đánh giá hiểu biết',
  'Kiểm tra khả năng vận dụng',
  'Bài tập trắc nghiệm',
  'Đánh giá tiến bộ',
  'Bài kiểm tra thực hành',
  'Kiểm tra kiến thức chuyên đề',
  'Bài đánh giá kết thúc môn',
  'Trắc nghiệm ôn tập',
  'Bài kiểm tra giữa kỳ',
  'Đánh giá năng lực',
  'Kiểm tra kết quả học tập',
  'Bài thi thử',
  'Đánh giá sự tiến bộ',
  'Kiểm tra cuối chương',
  'Bài đánh giá toàn diện',
];

const questionTemplates = [
  'Khái niệm nào là nền tảng của chủ đề này?',
  'Ưu điểm chính của phương pháp này là gì?',
  'Điều gì phân biệt cách tiếp cận này với các cách khác?',
  'Khi nào nên áp dụng giải pháp này?',
  'Hạn chế tiềm năng của cách làm này là gì?',
  'Công cụ nào phù hợp nhất để triển khai?',
  'Các bước thực hiện cơ bản như thế nào?',
  'Yếu tố nào ảnh hưởng nhiều nhất đến kết quả?',
  'Cách xử lý tình huống phổ biến ra sao?',
  'Best practice được khuyến nghị là gì?',
  'Lỗi thường gặp và cách phòng tránh?',
  'Cách đo lường hiệu quả như thế nào?',
  'Nguồn tài nguyên hỗ trợ ở đâu?',
  'Cách tối ưu hóa quy trình ra sao?',
  'Tiêu chí đánh giá chất lượng là gì?',
  'Phương pháp nào giúp ghi nhớ lâu nhất?',
  'Cách áp dụng vào thực tế công việc?',
  'Những điểm mấu chốt cần nắm vững?',
  'So sánh và đối chiếu các cách tiếp cận?',
  'Cách chuẩn bị cho giai đoạn tiếp theo?',
];

const optionTemplates = [
  'Phương pháp truyền thống',
  'Cách tiếp cận hiện đại',
  'Kết hợp cả hai cách',
  'Tùy thuộc vào ngữ cảnh',
];

async function seedQuizzes(courses: Course[]): Promise<void> {
  const quizRepository = AppDataSource.getRepository(Quiz);
  const questionRepository = AppDataSource.getRepository(Question);
  const optionRepository = AppDataSource.getRepository(QuestionOption);

  for (let i = 0; i < 20; i++) {
    const course = courses[i % courses.length];
    const isPublished = i < 15;

    const quiz = await quizRepository.save(
      quizRepository.create({
        title: `${quizTitles[i]}: ${course.name.split(' ').slice(0, 4).join(' ')}`,
        slug: `quiz-${i + 1}-${Date.now()}`,
        description: `Bài kiểm tra ${i + 1} giúp đánh giá mức độ hiểu biết về nội dung khóa học. Gồm 20 câu hỏi trắc nghiệm.`,
        type: 'multiple_choice',
        duration: (15 + (i % 6) * 5) * 60,
        passingScore: 100,
        isPublished,
        courseId: course.id,
      }),
    );

    for (let q = 0; q < 20; q++) {
      const correctIndex = q % 4;
      const question = await questionRepository.save(
        questionRepository.create({
          quizId: quiz.id,
          content: `Câu ${q + 1}: ${questionTemplates[q % questionTemplates.length]}`,
          type: 'multiple_choice',
          order: q + 1,
          points: 5,
        }),
      );

      for (let o = 0; o < 4; o++) {
        await optionRepository.save(
          optionRepository.create({
            questionId: question.id,
            content: `Đáp án ${optionTemplates[o]}`,
            isCorrect: o === correctIndex,
            order: o + 1,
          }),
        );
      }
    }

    console.log(`Seeded quiz ${i + 1}/20: ${quiz.title}`);
  }
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const userRepository = AppDataSource.getRepository(User);
    const existingAdmin = await userRepository.findOne({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log(
        `Admin ${ADMIN_EMAIL} already exists. Running seed anyway with force...`,
      );
    } else {
      console.log('No admin found. Proceeding with database seed...');
    }

    await clearContentTables();
    const usersByEmail = await seedUsers();
    const admin = usersByEmail.get(ADMIN_EMAIL);

    if (!admin) {
      throw new Error(`Missing seeded admin: ${ADMIN_EMAIL}`);
    }

    const courseSeeds = buildCourseSeeds();
    await seedCourses(admin, courseSeeds);

    const totalChapters = courseSeeds.reduce(
      (total, course) => total + course.chapters.length,
      0,
    );
    const totalLectures = courseSeeds.reduce(
      (total, course) =>
        total +
        course.chapters.reduce(
          (chapterTotal, chapter) => chapterTotal + chapter.lectures.length,
          0,
        ),
      0,
    );

    const courseRepository = AppDataSource.getRepository(Course);
    const seededCourses = await courseRepository.find();

    await seedQuizzes(seededCourses);

    console.log('Seed completed successfully.');
    console.log(`Users ready: ${users.map((user) => user.email).join(', ')}`);
    console.log(`Default password: ${PASSWORD}`);
    console.log(`Courses seeded: ${courseSeeds.length}`);
    console.log(`Chapters seeded: ${totalChapters}`);
    console.log(`Lectures seeded: ${totalLectures}`);
    console.log(`Quizzes seeded: 20`);
    console.log(`Questions seeded: 400`);
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
