import { Chapter } from '@src/modules/chapter/entities/chapter.entity';
import { User } from '@src/modules/user/entities/user.entity';
import { Category } from '@src/modules/category/entities/category.entity';
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

@Entity('courses')
@Index('unique_courses_slug', ['slug'], { unique: true })
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  duration: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  price: number;

  @Column({ type: 'float', nullable: false, default: 0 })
  rating: number;

  @Column({ type: 'int', nullable: false, default: 0, name: 'review_count' })
  reviewCount: number;

  @Column({
    type: 'int',
    nullable: false,
    default: 0,
    name: 'discussion_count',
  })
  discussionCount: number;

  @Column({ default: false, name: 'is_published' })
  isPublished: boolean;

  @Column({ nullable: false })
  slug: string;

  @Column({ nullable: false, name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User, (user) => user.courses)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ nullable: true, name: 'category_id' })
  categoryId: string | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters: Chapter[];

  @Column({ select: false, insert: false, update: false, nullable: true })
  lectureCount: number;
}
