import { EnrollmentStatus } from '@src/common/types';
import { Course } from '@src/modules/course/entities/course.entity';
import { User } from '@src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'enrollments' })
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  userId: string;

  @Column({ type: 'uuid', name: 'course_id', nullable: false })
  courseId: string;

  @Column({ type: 'enum', enum: EnrollmentStatus, nullable: false })
  status: EnrollmentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'text', name: 'learning_state', nullable: true })
  learningStateData?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'full_name', nullable: true })
  fullName?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  progress: number;

  @Column({ type: 'timestamp', name: 'start_at', nullable: false })
  startAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', name: 'reviewed_by_id', nullable: true })
  reviewedById: string | null;

  @Column({ type: 'text', name: 'review_note', nullable: true })
  reviewNote?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => User, (user) => user.enrollments)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
