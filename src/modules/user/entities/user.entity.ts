import { Course } from '@src/modules/course/entities/course.entity';
import { Enrollment } from '@src/modules/enrollment/entities/enrollment.entity';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true, nullable: false })
  email: string;

  @Exclude()
  @Column({ length: 255, nullable: false })
  password: string;

  @Column({ length: 255, nullable: false, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  avatar: string | null;

  @Column({ nullable: false, name: 'role_code' })
  roleCode: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'reset_token' })
  resetToken: string | null;

  @Exclude()
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'reset_token_expires',
  })
  resetTokenExpires: Date | null;

  @OneToMany(() => Course, (course) => course.author)
  courses: Course[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
  enrollments: Enrollment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
