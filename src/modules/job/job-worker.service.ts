import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from '@src/modules/job/entities/job.entity';
import { Repository } from 'typeorm';
import { JobStatus, JobType } from '@src/common/types';
import { ConfigService } from '@nestjs/config';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';
import { BunnyService } from '@src/modules/bunny/bunny.service';
import * as fsPromises from 'fs/promises';

@Injectable()
export class JobWorkerService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
    private readonly configService: ConfigService,
    private readonly bunnyService: BunnyService,
  ) {}

  @Cron('*/5 * * * * *')
  async handleJobs(): Promise<void> {
    // Only run job in worker mode
    if (this.configService.get<string>('WORKER_MODE') !== 'true') {
      return;
    }

    const jobs = await this.jobRepository.find({
      where: { status: JobStatus.PENDING },
      take: 5,
      order: { createdAt: 'ASC' },
    });

    for (const job of jobs) {
      await this.processJob(job);
    }
  }

  async processJob(job: Job): Promise<void> {
    try {
      await this.jobRepository.update(
        { id: job.id },
        { status: JobStatus.PROCESSING },
      );

      switch (job.type) {
        case JobType.UPLOAD_LECTURE_VIDEO:
          await this.uploadLectureVideo(job);
          break;
        default:
          console.log(`No handler for job type ${job.type}`);
          break;
      }

      await this.jobRepository.update(
        { id: job.id },
        { status: JobStatus.DONE },
      );

      await this.cleanupJob(job);
    } catch (e) {
      console.error(`Job ${job.id} failed:`, e);
      // Retry if max attempts not reached
      if (
        job.attempts + 1 >=
        Number(this.configService.get<number>('MAX_ATTEMPTS_RETRY'))
      ) {
        await this.jobRepository.update(
          { id: job.id },
          {
            status: JobStatus.FAILED,
            error: e.message,
          },
        );
        await this.cleanupJob(job);
      } else {
        await this.jobRepository.update(
          { id: job.id },
          {
            status: JobStatus.PENDING,
            attempts: job.attempts + 1,
          },
        );
      }
    }
  }

  async cleanupJob(job: Job): Promise<void> {
    if (
      job.type === JobType.UPLOAD_LECTURE_VIDEO &&
      job.payload?.tempFilePath
    ) {
      const filePath = job.payload.tempFilePath as string;
      try {
        await fsPromises.access(filePath);
        await fsPromises.unlink(filePath);
        console.log(`Deleted temp file ${filePath}`);
      } catch (err) {
        console.warn(`Failed to delete temp file ${filePath}: ${err.message}`);
      }
    }
  }

  async uploadLectureVideo(job: Job): Promise<void> {
    const { lectureId, tempFilePath } = job.payload;

    if (!lectureId || !tempFilePath) {
      throw new BadRequestException('LectureId or tempFilePath is missing');
    }

    await fsPromises.access(tempFilePath as string).catch(() => {
      throw new BadRequestException(
        `Temp file not found at ${tempFilePath as string}`,
      );
    });

    console.log(
      `Starting upload for job ${String(job.id)}, file: ${String(tempFilePath)}`,
    );
    const { videoId, videoUrl, libraryId } =
      await this.bunnyService.uploadFileToBunny(tempFilePath as string);

    console.log(
      `Upload success for job ${String(job.id)}, videoUrl: ${videoUrl}`,
    );

    await this.lectureRepository.update(lectureId as string, {
      videoUrl,
      attributes: {
        status: 0,
        videoGuid: videoId,
        libraryId,
      },
    });
    console.log(`Updated lecture ${String(lectureId)} with videoUrl`);
  }
}
