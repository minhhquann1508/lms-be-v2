import { Chapter } from '@src/modules/chapter/entities/chapter.entity';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lectures')
export class Lecture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: false })
  order: number;

  @Column({ type: 'boolean', name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ type: 'varchar', length: 255, nullable: false })
  slug: string;

  @Column({ type: 'varchar', name: 'video_url', length: 512, nullable: false })
  videoUrl: string | null;

  @Column({ type: 'uuid', nullable: false, name: 'chapter_id' })
  chapterId: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.lectures)
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @Column({ type: 'int', nullable: false, default: 0, name: 'duration' })
  duration: number;

  @Column({ type: 'uuid', nullable: true, name: 'quiz_id' })
  quizId?: string;

  @ManyToOne(() => Quiz, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quiz_id' })
  quiz?: Quiz;

  @Column({ type: 'jsonb', nullable: true, name: 'attributes' })
  attributes?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
