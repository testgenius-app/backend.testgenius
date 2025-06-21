import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CoinService } from '../coin/coin.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationRepository } from '../notification/notification.repository';
import { ActivityService } from '../activity/activity.service';
import { ActivityRepository } from '../activity/activity.repository';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [ConfigModule],
  controllers: [StripeController],
  providers: [
    StripeService,
    PrismaService,
    CoinService,
    NotificationService,
    NotificationRepository,
    ActivityService,
    ActivityRepository,
    JwtService
  ],
  exports: [StripeService],
})
export class StripeModule {} 