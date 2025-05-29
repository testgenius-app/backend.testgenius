import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityRepository } from './activity.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository, PrismaService, JwtService],
  exports: [ActivityService],
})
export class ActivityModule {}
