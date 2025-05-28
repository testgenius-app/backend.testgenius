import { Logger, Module } from '@nestjs/common';
import { OnlineTestGateway } from './online-test.gateway';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtTokenService } from '../generate-test/jwt-token.service';
import { TestTempCodeService } from 'src/modules/test-temp-code/test-temp-code.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TestTempCodeRepository } from 'src/modules/test-temp-code/test-temp-code.repository';
import { TestService } from 'src/modules/test/services/test.service';
import { TestRepository } from 'src/modules/test/test.repository';
import { OnlineTestRepository } from 'src/modules/online-test/online-test.repository';
import { OnlineTestService } from 'src/modules/online-test/online-test.service';
import { DocxService } from 'src/modules/test/services/docx/docx.service';
import { PdfService } from 'src/modules/test/services/pdf/pdf.service';
import { AnswerValidationService } from 'src/modules/online-test/services/answer-validation.service';
@Module({
  providers: [
    OnlineTestService,
    OnlineTestGateway,
    PrismaService,
    JwtTokenService,
    TestTempCodeService,
    Logger,
    ConfigService,
    JwtService,
    TestTempCodeRepository,
    TestService,
    TestRepository,
    OnlineTestRepository,
    DocxService,
    PdfService,
    AnswerValidationService
  ],
  exports: [OnlineTestGateway],
})
export class OnlineTestGatewayModule {}
