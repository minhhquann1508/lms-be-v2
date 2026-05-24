import { PartialType } from '@nestjs/swagger';
import { CreateLectureDto } from '@src/modules/lecture/dto/create-lecture.dto';

export class UpdateLectureDto extends PartialType(CreateLectureDto) {}
