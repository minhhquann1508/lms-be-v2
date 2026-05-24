import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sessions')
@Index('IDX_sessions_user_status', ['userId', 'status'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  userId: string;

  @Column({ type: 'uuid', name: 'device_id', nullable: false })
  deviceId: string;

  @Column({ name: 'refresh_token_hash', nullable: false })
  refreshTokenHash: string;

  @Column({
    name: 'status',
    nullable: false,
    enum: ['active', 'revoked', 'expired'],
  })
  status: string;

  @Column({ name: 'login_at', nullable: false })
  loginAt: Date;

  @Column({ name: 'expired_at', nullable: false })
  expiredAt: Date;

  @Column({ name: 'logout_at', nullable: true })
  logoutAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
