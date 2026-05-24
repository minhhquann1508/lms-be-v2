import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '@src/modules/course/entities/course.entity';
import { Enrollment } from '@src/modules/enrollment/entities/enrollment.entity';
import { PublicController } from './public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Enrollment])],
  controllers: [PublicController],
})
export class PublicModule {}
