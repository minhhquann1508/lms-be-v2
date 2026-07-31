import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { ROLES } from '../common/constants/roles';
import { Category } from '../modules/category/entities/category.entity';
import { Chapter } from '../modules/chapter/entities/chapter.entity';
import { Course } from '../modules/course/entities/course.entity';
import { Lecture } from '../modules/lecture/entities/lecture.entity';
import { QuestionOption } from '../modules/quiz/entities/question-option.entity';
import { Question } from '../modules/quiz/entities/question.entity';
import { Quiz } from '../modules/quiz/entities/quiz.entity';
import { SiteSetting } from '../modules/site-setting/entities/site-setting.entity';
import { User } from '../modules/user/entities/user.entity';

type SeedUser = {
  email: string;
  fullName: string;
  avatar: string;
  roleCode: string;
};

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  icon: string;
};

type SeedLecture = {
  name: string;
  slug: string;
  description: string;
  duration: number;
  videoUrl: string;
};

type SeedChapter = {
  name: string;
  slug: string;
  description: string;
  lectures: SeedLecture[];
};

type SeedCourse = {
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  categorySlug: string;
  price: number;
  rating: number;
  chapters: SeedChapter[];
};

const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD ?? '1508';
const RESET_SEED_USER_PASSWORD =
  process.env.SEED_RESET_USER_PASSWORD === 'true';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'super.admin@gmail.com';
const TEST_USER_EMAIL =
  process.env.SEED_TEST_USER_EMAIL ?? 'user.testing@gmail.com';

const seedUsers: SeedUser[] = [
  {
    email: ADMIN_EMAIL,
    fullName: 'LMS Admin',
    avatar: 'https://i.pravatar.cc/320?img=11',
    roleCode: ROLES.ADMIN,
  },
  {
    email: TEST_USER_EMAIL,
    fullName: 'Testing User',
    avatar: 'https://i.pravatar.cc/320?img=24',
    roleCode: ROLES.USER,
  },
];

const seedCategories: SeedCategory[] = [
  {
    name: 'Lập trình Web',
    slug: 'lap-trinh-web',
    description: 'Các khóa học xây dựng ứng dụng web hiện đại.',
    icon: 'code',
  },
  {
    name: 'Backend & Database',
    slug: 'backend-database',
    description: 'API, kiến trúc backend, dữ liệu và vận hành hệ thống.',
    icon: 'database',
  },
  {
    name: 'DevOps',
    slug: 'devops',
    description: 'Docker, CI/CD, triển khai và vận hành ứng dụng.',
    icon: 'server',
  },
];

const seedCourses: SeedCourse[] = [
  {
    name: 'React LMS Frontend Foundation',
    slug: 'react-lms-frontend-foundation',
    description:
      'Xây dựng nền tảng frontend cho hệ thống học trực tuyến bằng React, routing, auth và API integration.',
    thumbnail:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'lap-trinh-web',
    price: 690000,
    rating: 4.7,
    chapters: [
      {
        name: 'Khởi động giao diện học tập',
        slug: 'react-lms-khoi-dong-giao-dien',
        description: 'Thiết lập layout, routing và cấu trúc trang chính.',
        lectures: [
          {
            name: 'Tổng quan kiến trúc FE',
            slug: 'react-lms-tong-quan-kien-truc-fe',
            description: 'Đi qua cấu trúc project và luồng dữ liệu chính.',
            duration: 720,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            name: 'Kết nối API và auth state',
            slug: 'react-lms-ket-noi-api-auth-state',
            description: 'Thiết lập axios, token và trạng thái đăng nhập.',
            duration: 900,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
          },
        ],
      },
      {
        name: 'Trang học và catalog',
        slug: 'react-lms-trang-hoc-catalog',
        description: 'Xây dựng trải nghiệm duyệt khóa học và học bài.',
        lectures: [
          {
            name: 'Course card và danh sách khóa học',
            slug: 'react-lms-course-card-danh-sach',
            description: 'Thiết kế card, filter và trạng thái loading.',
            duration: 840,
            videoUrl:
              'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          },
          {
            name: 'Learning page cơ bản',
            slug: 'react-lms-learning-page-co-ban',
            description: 'Render chapter, lecture và tiến độ học tập.',
            duration: 960,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
        ],
      },
    ],
  },
  {
    name: 'NestJS API for LMS Products',
    slug: 'nestjs-api-for-lms-products',
    description:
      'Thiết kế backend NestJS có module, migration, auth và tài liệu API cho sản phẩm LMS.',
    thumbnail:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'backend-database',
    price: 790000,
    rating: 4.8,
    chapters: [
      {
        name: 'Kiến trúc backend NestJS',
        slug: 'nestjs-api-kien-truc-backend',
        description: 'Tổ chức module, service, controller và DTO.',
        lectures: [
          {
            name: 'Module boundary trong NestJS',
            slug: 'nestjs-api-module-boundary',
            description: 'Cách chia module để hệ thống dễ mở rộng.',
            duration: 780,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
          },
          {
            name: 'Validation và response chuẩn',
            slug: 'nestjs-api-validation-response-chuan',
            description: 'Dùng pipe, filter và interceptor cho API nhất quán.',
            duration: 880,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
        ],
      },
      {
        name: 'Database và migration',
        slug: 'nestjs-api-database-migration',
        description: 'Quản lý schema bằng TypeORM migration an toàn.',
        lectures: [
          {
            name: 'Tạo migration từ entity',
            slug: 'nestjs-api-tao-migration-tu-entity',
            description: 'Dùng TypeORM CLI để sinh migration từ entity.',
            duration: 920,
            videoUrl:
              'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          },
          {
            name: 'Seed dữ liệu idempotent',
            slug: 'nestjs-api-seed-idempotent',
            description: 'Seed dữ liệu nền mà không xóa dữ liệu thật.',
            duration: 740,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
          },
        ],
      },
    ],
  },
  {
    name: 'Docker Deploy Workflow for LMS',
    slug: 'docker-deploy-workflow-for-lms',
    description:
      'Đóng gói, build image, deploy Docker Compose và reverse proxy cho LMS.',
    thumbnail:
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'devops',
    price: 870000,
    rating: 4.6,
    chapters: [
      {
        name: 'Docker hóa ứng dụng',
        slug: 'docker-deploy-docker-hoa-ung-dung',
        description: 'Dockerfile production cho FE và BE.',
        lectures: [
          {
            name: 'Multi-stage Dockerfile',
            slug: 'docker-deploy-multi-stage-dockerfile',
            description: 'Tối ưu image production bằng multi-stage build.',
            duration: 860,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            name: 'Compose cho môi trường VPS',
            slug: 'docker-deploy-compose-vps',
            description: 'Tách service, volume và biến môi trường.',
            duration: 820,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
          },
        ],
      },
      {
        name: 'CI/CD và deploy một lệnh',
        slug: 'docker-deploy-cicd-one-command',
        description:
          'Build image bằng GitHub Actions và deploy thủ công an toàn.',
        lectures: [
          {
            name: 'Build image bằng GitHub Actions',
            slug: 'docker-deploy-github-actions-build',
            description: 'Push image lên GHCR theo branch và SHA.',
            duration: 780,
            videoUrl:
              'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          },
          {
            name: 'Reverse proxy bằng Caddy',
            slug: 'docker-deploy-caddy-reverse-proxy',
            description: 'Đưa FE và BE về cùng domain với HTTPS.',
            duration: 900,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
        ],
      },
    ],
  },
];

const quizQuestions = [
  {
    content: 'Mục tiêu chính của bài học này là gì?',
    options: [
      'Nắm được kiến thức nền tảng',
      'Bỏ qua toàn bộ quy trình',
      'Chỉ học lý thuyết không thực hành',
      'Không cần kiểm tra kết quả',
    ],
    correctIndex: 0,
  },
  {
    content: 'Điều gì giúp deploy an toàn hơn?',
    options: [
      'Xóa volume trước mỗi lần deploy',
      'Chạy migration và seed idempotent',
      'Hardcode secret vào source',
      'Tắt toàn bộ log',
    ],
    correctIndex: 1,
  },
  {
    content: 'Vì sao seed cần idempotent?',
    options: [
      'Để có thể chạy nhiều lần mà không nhân bản hoặc xóa dữ liệu thật',
      'Để database luôn bị reset',
      'Để không cần migration',
      'Để bỏ qua kiểm tra schema',
    ],
    correctIndex: 0,
  },
];

async function upsertOne<T extends { id: string }>(
  repository: Repository<T>,
  where: FindOptionsWhere<T>,
  payload: DeepPartial<T>,
): Promise<T> {
  const existing = await repository.findOne({ where });

  if (existing) {
    await repository.save(repository.create({ ...existing, ...payload }));
    const updated = await repository.findOneOrFail({ where });
    return updated;
  }

  return repository.save(repository.create(payload));
}

async function seedBaseUsers(): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);
  const password = await bcrypt.hash(
    DEFAULT_PASSWORD,
    Number(process.env.PASSWORD_HASH_SALT ?? 10),
  );

  let admin: User | null = null;

  for (const userSeed of seedUsers) {
    const existing = await userRepository.findOne({
      where: { email: userSeed.email },
    });
    const shouldSetPassword = !existing || RESET_SEED_USER_PASSWORD;
    const user = await upsertOne<User>(
      userRepository,
      { email: userSeed.email },
      {
        email: userSeed.email,
        fullName: userSeed.fullName,
        avatar: userSeed.avatar,
        roleCode: userSeed.roleCode,
        isActive: true,
        ...(shouldSetPassword ? { password } : {}),
      },
    );

    if (user.email === ADMIN_EMAIL) {
      admin = user;
    }
  }

  if (!admin) {
    throw new Error(`Missing seeded admin: ${ADMIN_EMAIL}`);
  }

  return admin;
}

async function seedBaseCategories(): Promise<Map<string, Category>> {
  const categoryRepository = AppDataSource.getRepository(Category);
  const categories = new Map<string, Category>();

  for (const categorySeed of seedCategories) {
    const category = await upsertOne<Category>(
      categoryRepository,
      { slug: categorySeed.slug },
      categorySeed,
    );
    categories.set(category.slug, category);
  }

  return categories;
}

async function seedBaseCourses(
  admin: User,
  categories: Map<string, Category>,
): Promise<Course[]> {
  const courseRepository = AppDataSource.getRepository(Course);
  const chapterRepository = AppDataSource.getRepository(Chapter);
  const lectureRepository = AppDataSource.getRepository(Lecture);
  const courses: Course[] = [];

  for (const courseSeed of seedCourses) {
    const category = categories.get(courseSeed.categorySlug);
    const duration = courseSeed.chapters.reduce(
      (courseTotal, chapter) =>
        courseTotal +
        chapter.lectures.reduce(
          (chapterTotal, lecture) => chapterTotal + lecture.duration,
          0,
        ),
      0,
    );
    const course = await upsertOne<Course>(
      courseRepository,
      { slug: courseSeed.slug },
      {
        name: courseSeed.name,
        slug: courseSeed.slug,
        description: courseSeed.description,
        thumbnail: courseSeed.thumbnail,
        authorId: admin.id,
        categoryId: category?.id ?? null,
        duration: Math.round(duration / 60),
        price: courseSeed.price,
        rating: courseSeed.rating,
        reviewCount: 24,
        discussionCount: 8,
        isPublished: true,
      },
    );

    courses.push(course);

    for (const [chapterIndex, chapterSeed] of courseSeed.chapters.entries()) {
      const chapter = await upsertOne<Chapter>(
        chapterRepository,
        { slug: chapterSeed.slug },
        {
          courseId: course.id,
          name: chapterSeed.name,
          slug: chapterSeed.slug,
          description: chapterSeed.description,
          order: chapterIndex + 1,
          isPublished: true,
        },
      );

      for (const [
        lectureIndex,
        lectureSeed,
      ] of chapterSeed.lectures.entries()) {
        await upsertOne<Lecture>(
          lectureRepository,
          { slug: lectureSeed.slug },
          {
            chapterId: chapter.id,
            name: lectureSeed.name,
            slug: lectureSeed.slug,
            description: lectureSeed.description,
            order: lectureIndex + 1,
            isPublished: true,
            duration: lectureSeed.duration,
            videoUrl: lectureSeed.videoUrl,
            attributes: {
              seed: true,
              courseSlug: courseSeed.slug,
              chapterSlug: chapterSeed.slug,
              lectureSlug: lectureSeed.slug,
            },
          },
        );
      }
    }
  }

  return courses;
}

async function seedBaseQuizzes(courses: Course[]): Promise<void> {
  const quizRepository = AppDataSource.getRepository(Quiz);
  const questionRepository = AppDataSource.getRepository(Question);
  const optionRepository = AppDataSource.getRepository(QuestionOption);

  for (const course of courses) {
    const quiz = await upsertOne<Quiz>(
      quizRepository,
      { slug: `${course.slug}-quiz` },
      {
        title: `Kiểm tra nhanh: ${course.name}`,
        slug: `${course.slug}-quiz`,
        description: `Bài kiểm tra cơ bản cho khóa học ${course.name}.`,
        type: 'multiple_choice',
        duration: 15 * 60,
        passingScore: 70,
        isPublished: true,
        courseId: course.id,
      },
    );

    for (const [questionIndex, questionSeed] of quizQuestions.entries()) {
      const question =
        (await questionRepository.findOne({
          where: { quizId: quiz.id, order: questionIndex + 1 },
        })) ??
        questionRepository.create({
          quizId: quiz.id,
          order: questionIndex + 1,
        });

      question.content = questionSeed.content;
      question.type = 'multiple_choice';
      question.points = 1;

      const savedQuestion = await questionRepository.save(question);

      for (const [
        optionIndex,
        optionContent,
      ] of questionSeed.options.entries()) {
        const option =
          (await optionRepository.findOne({
            where: { questionId: savedQuestion.id, order: optionIndex + 1 },
          })) ??
          optionRepository.create({
            questionId: savedQuestion.id,
            order: optionIndex + 1,
          });

        option.content = optionContent;
        option.isCorrect = optionIndex === questionSeed.correctIndex;
        await optionRepository.save(option);
      }
    }
  }
}

async function seedBaseSiteSettings(): Promise<void> {
  const siteSettingRepository = AppDataSource.getRepository(SiteSetting);

  const existing = await siteSettingRepository
    .createQueryBuilder('site_settings')
    .orderBy('site_settings.createdAt', 'ASC')
    .getOne();

  if (existing) {
    console.log('Site settings already exist, skipping seed.');
    return;
  }

  const defaults = siteSettingRepository.create({
    heroTitle: 'Phát triển bản thân mỗi ngày\nvới khoá học chất lượng',
    heroSubtitle: 'Nền tảng học tập số 1 Việt Nam',
    heroDescription:
      'Hàng trăm khoá học online từ cơ bản đến nâng cao, giúp bạn thành thạo kỹ năng mới một cách nhanh chóng và hiệu quả.',
    heroShowStats: true,
    ctaTitle: 'Sẵn sàng bắt đầu hành trình học tập?',
    ctaDescription:
      'Tham gia cùng hàng ngàn học viên đang nâng cao kỹ năng mỗi ngày.\nTất cả hoàn toàn miễn phí — không rủi ro, không cam kết.',
    ctaButtonText: 'Khám phá ngay',
    footerBrandName: 'LMS Platform',
    footerCopyright: '© {year} LMS Platform. All rights reserved.',
    footerLinks: [
      { label: 'Trang chủ', url: '/' },
      { label: 'Khoá học', url: '/' },
    ],
  });

  await siteSettingRepository.save(defaults);
  console.log('Site settings seeded with defaults.');
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const admin = await seedBaseUsers();
    const categories = await seedBaseCategories();
    const courses = await seedBaseCourses(admin, categories);
    await seedBaseQuizzes(courses);
    await seedBaseSiteSettings();

    console.log('Seed completed safely.');
    console.log(
      'No tables were truncated and no existing user/content data was deleted.',
    );
    console.log(
      `Seed users ensured: ${seedUsers.map((user) => user.email).join(', ')}`,
    );
    console.log(`Seed categories ensured: ${seedCategories.length}`);
    console.log(`Seed courses ensured: ${seedCourses.length}`);
    console.log(`Seed quizzes ensured: ${courses.length}`);
    if (!RESET_SEED_USER_PASSWORD) {
      console.log(
        'Existing seed user passwords were preserved. Set SEED_RESET_USER_PASSWORD=true to reset them.',
      );
    }
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
