import { Module } from '@nestjs/common';
import { CoinService } from './coin.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  providers: [CoinService, PrismaService]
})
export class CoinModule {}
