import { Module } from '@nestjs/common';
import { GoogleIdentity } from '@src/modules/identity/google/google.identity';
import { IDENTITY_PROVIDERS } from '@src/common/constants';

@Module({
  providers: [
    {
      provide: IDENTITY_PROVIDERS.GOOGLE,
      useClass: GoogleIdentity,
    },
  ],
  exports: [IDENTITY_PROVIDERS.GOOGLE],
})
export class GoogleModule {}
