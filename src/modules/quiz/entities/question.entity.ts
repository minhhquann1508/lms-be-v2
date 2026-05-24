import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';
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

@Entity('questions')
@Index('IDX_questions_quiz_id', ['quizId'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'quiz_id' })
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'multiple_choice',
  })
  type: string;

  @Column({ type: 'int', nullable: false })
  order: number;

  @Column({ type: 'int', nullable: false, default: 1 })
  points: number;

  @Column({ type: 'text', nullable: true, name: 'code_template' })
  codeTemplate?: string;

  @OneToMany(() => QuestionOption, (option) => option.question, {
    cascade: true,
  })
  options: QuestionOption[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
