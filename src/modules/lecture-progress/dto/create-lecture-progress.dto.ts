import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateLectureProgressDto {
  @ApiProperty({
    description: 'Enrollment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  enrollmentId!: string;

  @ApiProperty({
    description: 'Lecture ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  lectureId!: string;
}
