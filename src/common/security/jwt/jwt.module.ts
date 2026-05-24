import { Global, Module } from '@nestjs/common';
import { JwtModule as NestJwtModule, JwtSignOptions } from '@nestjs/jwt';
import { JwtService } from '@src/common/security/jwt/jwt.service';

@Global()
@Module({
  imports: [
    NestJwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ??
            '15m') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
