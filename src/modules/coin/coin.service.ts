import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class CoinService {
    constructor(private readonly prisma: PrismaService) {}

    async getUserCoins(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: { coins: true },
        });
    }

    async updateUserCoins(userId: string, coins: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { coins },
        });
    }
}
