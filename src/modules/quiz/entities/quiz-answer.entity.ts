import { QuizAttempt } from '@src/modules/quiz/entities/quiz-attempt.entity';
import { Question } from '@src/modules/quiz/entities/question.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('quiz_answers')
export class QuizAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'attempt_id' })
  attemptId: string;

  @ManyToOne(() => QuizAttempt, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attempt_id' })
  attempt: QuizAttempt;

  @Column({ type: 'uuid', nullable: false, name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'uuid', nullable: true, name: 'selected_option_id' })
  selectedOptionId?: string;

  @ManyToOne(() => QuestionOption, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'selected_option_id' })
  selectedOption?: QuestionOption;

  @Column({ type: 'boolean', nullable: true, name: 'is_correct' })
  isCorrect?: boolean;

  @Column({ type: 'float', nullable: true, name: 'points_earned' })
  pointsEarned?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

