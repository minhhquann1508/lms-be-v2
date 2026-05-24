import { Module } from '@nestjs/common';
import { EnrollmentService } from '@src/modules/enrollment/enrollment.service';
import { EnrollmentController } from '@src/modules/enrollment/enrollment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from '@src/modules/enrollment/entities/enrollment.entity';
import { Course } from '@src/modules/course/entities/course.entity';
import { User } from '@src/modules/user/entities/user.entity';
import { NotificationModule } from '@src/modules/notification/notification.module';
import { EmailModule } from '@src/modules/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Course, User]),
    NotificationModule,
    EmailModule,
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
