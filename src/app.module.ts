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
import { OnlineTestGatewayModule } from './gateways/online-test/online-test.module';
import { OnlineTestModule } from './modules/online-test/online-test.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ActivityModule } from './modules/activity/activity.module';
import { CoinModule } from './modules/coin/coin.module';
import { NotificationModule } from './modules/notification/notification.module';
import { StripeModule } from './modules/stripe/stripe.module';

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
    OnlineTestGatewayModule,
    OnlineTestModule,
    SchedulerModule,
    AnalyticsModule,
    ActivityModule,
    CoinModule,
    NotificationModule,
    StripeModule,
  ],
})
export class AppModule {}
