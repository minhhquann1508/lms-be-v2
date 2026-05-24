import type { User } from '@modules/user/entities/user.entity';

export interface LoginResponse {
  userInfo: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
  sessionId: string;
}
