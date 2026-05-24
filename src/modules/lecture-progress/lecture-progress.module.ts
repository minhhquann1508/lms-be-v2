import { Module } from '@nestjs/common';
import { LectureProgressService } from '@src/modules/lecture-progress/lecture-progress.service';
import { LectureProgressController } from '@src/modules/lecture-progress/lecture-progress.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LectureProgress } from '@src/modules/lecture-progress/entities/lecture-progress.entity';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';
import { EnrollmentModule } from '@src/modules/enrollment/enrollment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LectureProgress, Lecture]),
    EnrollmentModule,
  ],
  controllers: [LectureProgressController],
  providers: [LectureProgressService],
  exports: [LectureProgressService],
})
export class LectureProgressModule {}
