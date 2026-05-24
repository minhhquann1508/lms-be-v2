import { Module } from '@nestjs/common';
import { GoogleModule } from '@src/modules/identity/google/google.module';

@Module({
  imports: [GoogleModule],
  exports: [GoogleModule],
})
export class IdentityModule {}
