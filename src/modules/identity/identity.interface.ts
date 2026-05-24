import { IdentityProfile } from '@src/common/types';

export interface IdentityProvider {
  verify(credentials: Record<string, unknown>): Promise<IdentityProfile>;
  getAuthorizationUrl?(state: string): string;
}
