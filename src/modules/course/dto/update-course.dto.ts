import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from '@modules/course/dto/create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
