import { Module } from '@nestjs/common';
import { BunnyService } from '@src/modules/bunny/bunny.service';
import { BunnyController } from './bunny.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lecture])],
  providers: [BunnyService],
  exports: [BunnyService],
  controllers: [BunnyController],
})
export class BunnyModule {}
