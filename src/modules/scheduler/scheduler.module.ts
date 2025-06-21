import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { CleanupService } from './services/cleanup.service';
import { DailyCoinsService } from './services/daily-coins.service';
import { SchedulerController } from './scheduler.controller';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from '../notification/notification.service';
import { NotificationRepository } from '../notification/notification.repository';
import { CoinService } from '../coin/coin.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    PrismaModule,
    NotificationModule,
  ],
  providers: [CleanupService, DailyCoinsService, JwtService, NotificationService, NotificationRepository, CoinService],
  controllers: [SchedulerController],
})
export class SchedulerModule {} 