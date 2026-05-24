import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { IdentityProvider as IdentityProviderInterface } from '@src/modules/identity/identity.interface';
import { IdentityProvider, IdentityProfile } from '@src/common/types';

@Injectable()
export class GoogleIdentity implements IdentityProviderInterface {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL}/api/auth/google/callback`,
    );
  }

  getAuthorizationUrl(state: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'],
      state,
    });
  }

  async verify({ code }: { code: string }): Promise<IdentityProfile> {
    const { tokens } = await this.client.getToken(code);
    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
      provider: IdentityProvider.GOOGLE,
      providerId: payload?.sub ?? '',
      email: payload?.email ?? '',
      name: payload?.name ?? '',
      avatar: payload?.picture ?? '',
    };
  }
}
