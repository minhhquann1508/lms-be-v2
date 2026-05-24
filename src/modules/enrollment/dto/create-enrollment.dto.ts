import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ example: '18812aab-534f-4a6e-813c-7d0cf7476607' })
  @IsUUID()
  courseId!: string;

  @ApiProperty({ example: 'note' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsOptional()
  phone?: string;
}
