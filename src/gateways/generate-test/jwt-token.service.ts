import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async verifyToken(token: string): Promise<User | null> {
    try {

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });

      if (!payload || !payload.userId) {
        return null;
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }
}
