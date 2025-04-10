import { Module } from '@nestjs/common';
import { TestTempCodeService } from './test-temp-code.service';
import { TestTempCodeRepository } from './test-temp-code.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  providers: [TestTempCodeService, TestTempCodeRepository, PrismaService],
  exports: [TestTempCodeService],
})
export class TestTempCodeModule {}
