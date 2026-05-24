import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobStatus, JobType } from '@src/common/types';
import { Job } from '@src/modules/job/entities/job.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async addJob(type: JobType, payload: Record<string, unknown>): Promise<Job> {
    return await this.jobRepository.save({
      type,
      payload,
    });
  }

  async findJobById(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: {
        id,
      },
    });
    if (!job) {
      throw new BadRequestException(`Job with id ${id} not found`);
    }
    return job;
  }

  async triggerJobById(id: string): Promise<{ status: JobStatus }> {
    const job = await this.findJobById(id);

    return {
      status: job.status,
    };
  }
}
