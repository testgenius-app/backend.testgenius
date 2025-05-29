import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService,JwtService,],
})
export class AnalyticsModule {} 