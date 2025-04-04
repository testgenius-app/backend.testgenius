import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnApplicationShutdown, OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onApplicationShutdown() {
    await this.$disconnect();
  }
}
