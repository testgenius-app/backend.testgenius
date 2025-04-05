import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PackModule } from './modules/pack/pack.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { UtilsModule } from './core/utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './core/mail/mail.module';

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
  ],
})
export class AppModule {}
