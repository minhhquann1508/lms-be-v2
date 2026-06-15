import { Global, Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionCleanupService } from './session-cleanup.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '@modules/session/entities/session.entity';
import { Device } from '@modules/device/entities/device.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Session, Device])],
  providers: [SessionService, SessionCleanupService],
  exports: [SessionService],
})
export class SessionModule {}
