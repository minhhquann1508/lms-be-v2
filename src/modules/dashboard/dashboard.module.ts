import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '@src/modules/course/entities/course.entity';
import { Enrollment } from '@src/modules/enrollment/entities/enrollment.entity';
import { DashboardController } from '@src/modules/dashboard/dashboard.controller';
import { DashboardService } from '@src/modules/dashboard/dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Enrollment])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
