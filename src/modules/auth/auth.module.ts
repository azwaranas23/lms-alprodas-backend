import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt.service';
import { UsersService } from '../users/services/users.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersRepository } from '../users/repositories/users.repositories';
import { FileUploadService } from 'src/common/services/file-upload.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecretKey',
      signOptions: { expiresIn: '6d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokenService,
    UsersService,
    UsersRepository,
    FileUploadService,
  ],
  exports: [AuthService, JwtTokenService],
})
export class AuthModule {}
