import { Module } from '@nestjs/common';
import { CourseService } from '@modules/course/course.service';
import { CourseController } from '@modules/course/course.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '@modules/course/entities/course.entity';
import { Lecture } from '@modules/lecture/entities/lecture.entity';
import { Chapter } from '@modules/chapter/entities/chapter.entity';
import { Category } from '@modules/category/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Chapter, Lecture, Category])],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
