import { Logger, Module } from '@nestjs/common';
import { GenerateTestService } from './generate-test.service';
import { GenerateTestGateway } from './generate-test.gateway';
import { TestService } from 'src/modules/test/test.service';
import { TestRepository } from 'src/modules/test/test.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtTokenService } from './jwt-token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    GenerateTestGateway,
    GenerateTestService,
    Logger,
    TestService,
    TestRepository,
    PrismaService,
    JwtTokenService,
    JwtService,
    ConfigService,
  ],
  exports: [GenerateTestService, GenerateTestGateway],
})
export class GenerateTestModule {}
