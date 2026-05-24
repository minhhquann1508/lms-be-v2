import { forwardRef, Module } from '@nestjs/common';
import { JobService } from '@src/modules/job/job.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '@src/modules/job/entities/job.entity';
import { JobWorkerService } from '@src/modules/job/job-worker.service';
import { BunnyModule } from '@src/modules/bunny/bunny.module';
import { LectureModule } from '@src/modules/lecture/lecture.module';
import { JobController } from './job.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BunnyModule,
    forwardRef(() => LectureModule),
  ],
  providers: [JobService, JobWorkerService],
  exports: [JobService],
  controllers: [JobController],
})
export class JobModule {}
