import { Module } from '@nestjs/common';
import { OnlineTestController } from './online-test.controller';
import { OnlineTestService } from './online-test.service';
import { OnlineTestRepository } from './online-test.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [OnlineTestController],
  providers: [
    OnlineTestService,
    OnlineTestRepository,
    PrismaService,
    JwtService,
  ],
})
export class OnlineTestModule {}
