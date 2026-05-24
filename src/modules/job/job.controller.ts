import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@src/common/decorators';
import { JobStatus } from '@src/common/types';
import { JobService } from '@src/modules/job/job.service';

@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Public()
  @Get(':jobId')
  @ApiOperation({ summary: 'Trigger a job by id' })
  @ApiResponse({ status: 200, description: 'Job triggered successfully' })
  async triggerJobById(
    @Param('jobId') jobId: string,
  ): Promise<{ status: JobStatus }> {
    return await this.jobService.triggerJobById(jobId);
  }
}
