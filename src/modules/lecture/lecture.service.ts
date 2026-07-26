import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { Lecture } from './entities/lecture.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { generateSlug } from '@src/common/helpers';
import { ValidationErrorCode } from '@src/common/constants';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { ReorderLecturesDto } from '@src/modules/lecture/dto/reorder-lectures.dto';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';

@Injectable()
export class LectureService {
  constructor(
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {}
  async create(
    createLectureDto: CreateLectureDto,
  ): Promise<Lecture> {
    if (!createLectureDto.order) {
      const maxOrderLecture = await this.lectureRepository.findOne({
        where: { chapterId: createLectureDto.chapterId },
        order: { order: 'DESC' },
      });
      createLectureDto.order = (maxOrderLecture?.order ?? 0) + 1;
    }

    const lecture = this.lectureRepository.create({
      ...createLectureDto,
      slug: generateSlug(createLectureDto.name),
    });
    return this.lectureRepository.save(lecture);
  }

  async findById(lectureId: string): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({
      where: { id: lectureId },
      relations: ['quiz'],
    });

    if (!lecture)
      throw new BadRequestException(ValidationErrorCode.LECTURE_NOT_FOUND);
    return lecture;
  }

  async sortLectureOrderIndex(lectureId: string, order: number): Promise<void> {
    const lecture = await this.findById(lectureId);
    lecture.order = order;
    await this.lectureRepository.save(lecture);
  }

  async updateLecture(
    lectureId: string,
    updateLectureDto: UpdateLectureDto,
  ): Promise<Lecture> {
    const lecture = await this.findById(lectureId);
    Object.assign(lecture, {
      ...updateLectureDto,
      slug: generateSlug(updateLectureDto.name ?? lecture.name),
    });
    return this.lectureRepository.save(lecture);
  }

  async reorderLectures(dto: ReorderLecturesDto): Promise<void> {
    for (const item of dto.items) {
      await this.lectureRepository.update(item.id, { order: item.order });
    }
  }

  async deleteLecture(lectureId: string): Promise<void> {
    const lecture = await this.findById(lectureId);
    await this.lectureRepository.softDelete(lecture.id);
  }
}
