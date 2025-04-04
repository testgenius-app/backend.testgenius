import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PackModule } from './modules/pack/pack.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { UtilsModule } from './core/utils/utils.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PackModule,
    PrismaModule,
    UtilsModule,
  ],
})
export class AppModule {}
