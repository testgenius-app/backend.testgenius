import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { TestRepository } from './test.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
          signOptions: {
            expiresIn: configService.get<string | number>(
              'ACCESS_TOKEN_EXPIRATION_TIME',
            ),
          },
        }),
        inject: [ConfigService],
      }),],
  controllers: [TestController],
  providers: [TestService, TestRepository, PrismaService, JwtService],
  exports: [TestService, TestRepository],
})
export class TestModule {}
