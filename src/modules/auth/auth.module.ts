import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '@modules/auth/auth.service';
import { AuthController } from '@modules/auth/auth.controller';
import { User } from '@modules/user/entities/user.entity';
import { HashModule } from '@src/common/security/hash/hash.module';
import { JwtModule } from '@src/common/security/jwt/jwt.module';
import { IdentityModule } from '@modules/identity/identity.module';
import { DeviceModule } from '@modules/device/device.module';
import { DeviceService } from '@modules/device/device.service';
import { Device } from '@modules/device/entities/device.entity';
import { SessionModule } from '@modules/session/session.module';
import { EmailModule } from '@modules/email/email.module';
import { OAuthStateService } from '@modules/auth/oauth-state.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Device]),
    HashModule,
    JwtModule,
    IdentityModule,
    DeviceModule,
    SessionModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, DeviceService, OAuthStateService],
})
export class AuthModule {}
