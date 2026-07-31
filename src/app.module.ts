import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from '@modules/user/user.module';
import { CourseModule } from '@modules/course/course.module';
import { AuthModule } from '@modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard } from '@src/common/guards';
import { JwtModule } from '@src/common/security/jwt/jwt.module';
import { DeviceModule } from '@src/modules/device/device.module';
import { SessionModule } from '@src/modules/session/session.module';
import { ChapterModule } from '@src/modules/chapter/chapter.module';
import { LectureModule } from '@src/modules/lecture/lecture.module';
import { JobModule } from './modules/job/job.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BunnyService } from './modules/bunny/bunny.service';
import { BunnyModule } from './modules/bunny/bunny.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { LectureProgressModule } from './modules/lecture-progress/lecture-progress.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationModule } from './modules/notification/notification.module';
import { EmailModule } from './modules/email/email.module';
import { CategoryModule } from './modules/category/category.module';
import { PublicModule } from './modules/public/public.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { SiteSettingModule } from './modules/site-setting/site-setting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () =>
        process.env.AUTH_RATE_LIMIT_DISABLED === 'true'
          ? { throttlers: [] }
          : {
              throttlers: [
                { name: 'login_register', ttl: 60_000, limit: 10 },
                { name: 'refresh_token', ttl: 60_000, limit: 60 },
              ],
            },
    }),
    JwtModule,
    UserModule,
    CourseModule,
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [`${__dirname}/**/*.entity.{js,ts}`],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    }),
    DeviceModule,
    SessionModule,
    ChapterModule,
    LectureModule,
    JobModule,
    BunnyModule,
    EnrollmentModule,
    LectureProgressModule,
    DashboardModule,
    UploadModule,
    NotificationModule,
    EmailModule,
    CategoryModule,
    PublicModule,
    QuizModule,
    SiteSettingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    BunnyService,
  ],
})
export class AppModule {}
