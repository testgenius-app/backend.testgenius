import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { TestRepository } from './test.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [TestController],
  providers: [TestService, TestRepository, PrismaService, JwtService],
  exports: [TestService, TestRepository],
})
export class TestModule {}
