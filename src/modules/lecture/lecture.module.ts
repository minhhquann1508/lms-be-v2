import { forwardRef, Module } from '@nestjs/common';
import { LectureService } from '@src/modules/lecture/lecture.service';
import { LectureController } from '@src/modules/lecture/lecture.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import { JobModule } from '@src/modules/job/job.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lecture, Quiz]), forwardRef(() => JobModule)],
  controllers: [LectureController],
  providers: [LectureService],
  exports: [TypeOrmModule, LectureService],
})
export class LectureModule {}
