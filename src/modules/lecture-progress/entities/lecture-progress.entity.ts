import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'lecture_progresses' })
export class LectureProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'enrollment_id', nullable: false })
  enrollmentId: string;

  @Column({ type: 'uuid', name: 'lecture_id', nullable: false })
  lectureId: string;

  @Column({
    type: 'boolean',
    nullable: false,
    name: 'is_completed',
    default: false,
  })
  isCompleted: boolean;

  @Column({
    type: 'int',
    nullable: false,
    name: 'watched_seconds',
    default: 0,
  })
  watchedSeconds: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  duration: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
