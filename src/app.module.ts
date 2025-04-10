import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PackModule } from './modules/pack/pack.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { UtilsModule } from './core/utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './core/mail/mail.module';
import { GenerateTestModule } from './gateways/generate-test/generate-test.module';
import { TestModule } from './modules/test/test.module';
import { TestTempCodeModule } from './modules/test-temp-code/test-temp-code.module';
import { OnlineTestModule } from './gateways/online-test/online-test.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PackModule,
    PrismaModule,
    UtilsModule,
    MailModule,
    GenerateTestModule,
    TestModule,
    TestTempCodeModule,
    OnlineTestModule,
  ],
})
export class AppModule {}
