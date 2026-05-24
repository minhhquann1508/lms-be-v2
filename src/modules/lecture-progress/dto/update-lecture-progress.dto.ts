import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export enum LectureProgressAction {
  TIMEUPDATE = 'timeupdate',
  PAUSE = 'pause',
  SEEKED = 'seeked',
  ENDED = 'ended',
}

export class UpdateLectureProgressDto {
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

  @ApiProperty({
    description: 'Playback action emitted by the player',
    enum: LectureProgressAction,
    example: LectureProgressAction.TIMEUPDATE,
  })
  @IsEnum(LectureProgressAction)
  action!: LectureProgressAction;

  @ApiProperty({
    description: 'Current playback time in seconds',
    example: 128,
  })
  @IsNumber()
  @Min(0)
  watchedSeconds!: number;

  @ApiPropertyOptional({
    description: 'Known player duration in seconds',
    example: 360,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}
