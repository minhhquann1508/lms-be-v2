import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Lập trình' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'Biểu tượng danh mục', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string;

  @ApiProperty({ example: 'Khoá học về lập trình', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
