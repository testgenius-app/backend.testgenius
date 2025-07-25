import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { VerificationService } from './verification.service';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UtilsService } from 'src/core/utils/utils.service';
import { GoogleModule } from './google/google.module';
import { MailService } from 'src/core/mail/mail.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationRepository } from '../notification/notification.repository';
import { CoinService } from '../coin/coin.service';

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
    GoogleModule,
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    AuthService,
    AuthRepository,
    VerificationService,
    TokenService,
    UtilsService,
    MailService,
    NotificationService,
    NotificationRepository,
    CoinService,
  ],
})
export class AuthModule {}
