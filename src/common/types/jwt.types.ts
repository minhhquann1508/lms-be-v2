export interface AccessTokenPayload {
  userId: string;
  email: string;
  roleCode: string;
  deviceId?: string;
  sessionId?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  roleCode: string;
  deviceId?: string;
  sessionId?: string;
}
