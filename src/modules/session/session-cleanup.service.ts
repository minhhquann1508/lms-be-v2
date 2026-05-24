import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from './session.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly sessionService: SessionService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSessions(): Promise<void> {
    const start = Date.now();
    this.logger.log('Starting expired sessions cleanup...');

    await this.sessionService.expireOutdatedSessions();

    const duration = Date.now() - start;
    this.logger.log(`Expired sessions cleanup completed in ${duration}ms`);
  }
}
