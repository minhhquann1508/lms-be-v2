export enum IdentityProvider {
  GOOGLE = 'google',
  LOCAL = 'local',
  APPLE = 'apple',
}

export interface IdentityProfile {
  provider: IdentityProvider;
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
}
