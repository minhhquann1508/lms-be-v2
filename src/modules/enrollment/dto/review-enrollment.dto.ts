import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus } from '@src/common/types';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewEnrollmentDto {
  @ApiProperty({
    enum: [EnrollmentStatus.ACTIVE, EnrollmentStatus.REJECTED],
    example: EnrollmentStatus.ACTIVE,
  })
  @IsIn([EnrollmentStatus.ACTIVE, EnrollmentStatus.REJECTED])
  status!: EnrollmentStatus.ACTIVE | EnrollmentStatus.REJECTED;

  @ApiProperty({
    required: false,
    example: 'Hồ sơ đã đầy đủ, bạn có thể bắt đầu học.',
  })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
