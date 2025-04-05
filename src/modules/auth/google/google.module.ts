import { Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { GoogleStrategy } from '../strategies/google.strategy';
import { TokenService } from '../token.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string | number>(
            'ACCESS_TOKEN_EXPIRATION_TIME',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GoogleController],
  providers: [
    GoogleService,
    GoogleStrategy,
    TokenService,
    PrismaService,
    JwtService,
    ConfigService,
  ],
  exports: [GoogleService],
})
export class GoogleModule {}
