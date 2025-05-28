import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from './services/cleanup.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  providers: [CleanupService],
})
export class SchedulerModule {} 