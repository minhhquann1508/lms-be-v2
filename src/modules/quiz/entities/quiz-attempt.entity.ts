import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import { User } from '@src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuizAnswer } from '@src/modules/quiz/entities/quiz-answer.entity';

export enum QuizAttemptStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: false, name: 'quiz_id' })
  quizId: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @Column({
    type: 'enum',
    enum: QuizAttemptStatus,
    default: QuizAttemptStatus.IN_PROGRESS,
  })
  status: QuizAttemptStatus;

  @Column({ type: 'float', nullable: true })
  score?: number;

  @Column({ type: 'int', nullable: false, default: 0, name: 'total_points' })
  totalPoints: number;

  @Column({ type: 'float', nullable: true, name: 'score_percentage' })
  scorePercentage?: number;

  @Column({ type: 'timestamp', name: 'started_at', nullable: false })
  startedAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt?: Date;

  @OneToMany(() => QuizAnswer, (answer) => answer.attempt, { cascade: true })
  answers: QuizAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

