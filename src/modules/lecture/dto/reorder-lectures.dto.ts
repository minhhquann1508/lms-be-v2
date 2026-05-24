import { IsArray, IsInt, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LectureOrderItem {
  @IsUUID()
  id: string;

  @IsInt()
  order: number;
}

export class ReorderLecturesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LectureOrderItem)
  items: LectureOrderItem[];
}
