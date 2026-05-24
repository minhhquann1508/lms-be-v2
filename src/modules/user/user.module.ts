import { Module } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { UserController } from '@modules/user/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/modules/user/entities/user.entity';
import { HashModule } from '@src/common/security/hash/hash.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), HashModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
