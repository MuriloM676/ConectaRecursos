import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordHashService } from './services/password-hash.service';
import { JwtConfig } from '@config/jwt.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (jwtConfig: JwtConfig) => ({
        secret: jwtConfig.secret,
        signOptions: { expiresIn: jwtConfig.expiresIn },
      }),
      inject: [JwtConfig],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordHashService],
  exports: [AuthService, JwtStrategy, PassportModule, PasswordHashService],
})
export class AuthModule {}
