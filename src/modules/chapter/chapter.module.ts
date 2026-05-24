import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChapterService } from '@src/modules/chapter/chapter.service';
import { ChapterController } from '@src/modules/chapter/chapter.controller';
import { Chapter } from '@src/modules/chapter/entities/chapter.entity';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Lecture])],
  controllers: [ChapterController],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {}
