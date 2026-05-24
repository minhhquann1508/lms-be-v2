import { Chapter } from '@src/modules/chapter/entities/chapter.entity';
import { Course } from '@src/modules/course/entities/course.entity';
import { Question } from '@src/modules/quiz/entities/question.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('quizzes')
@Index('unique_quizzes_slug', ['slug'], { unique: true })
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'multiple_choice',
  })
  type: string;

  @Column({ type: 'int', nullable: true, name: 'duration' })
  duration?: number;

  @Column({ type: 'int', nullable: true, name: 'passing_score' })
  passingScore?: number;

  @Column({ type: 'boolean', name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ type: 'varchar', length: 255, nullable: false })
  slug: string;

  @Column({ type: 'uuid', nullable: true, name: 'course_id' })
  courseId?: string;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ type: 'uuid', nullable: true, name: 'chapter_id' })
  chapterId?: string;

  @ManyToOne(() => Chapter, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'chapter_id' })
  chapter?: Chapter;

  @OneToMany(() => Question, (question) => question.quiz, { cascade: true })
  questions: Question[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
