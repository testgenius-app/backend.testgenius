import { Logger, Module } from '@nestjs/common';
import { GenerateTestService } from './generate-test.service';
import { GenerateTestGateway } from './generate-test.gateway';
import { TestService } from 'src/modules/test/services/test.service';
import { TestRepository } from 'src/modules/test/test.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtTokenService } from './jwt-token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DocxService } from 'src/modules/test/services/docx/docx.service';
import { PdfService } from 'src/modules/test/services/pdf/pdf.service';
import { ActivityService } from 'src/modules/activity/activity.service';
import { ActivityRepository } from 'src/modules/activity/activity.repository';

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
    DocxService,
    PdfService,
    ActivityService,
    ActivityRepository
  ],
  exports: [GenerateTestService, GenerateTestGateway],
})
export class GenerateTestModule {}
