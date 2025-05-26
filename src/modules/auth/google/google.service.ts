import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserProfileDto } from './dto/user-profile.dto';
import { TokenService } from '../token.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Providers, Role } from '@prisma/client';
import { ITokens } from 'src/core/types/tokens.type';

@Injectable()
export class GoogleService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async auth(body: UserProfileDto): Promise<ITokens> {
    let user = await this.prisma.user.findUnique({
      where: {
        email: body.email,
        provider: Providers.GOOGLE,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: body.providerId,
          firstName: body.firstname,
          lastName: body.lastname,
          email: body.email,
          logo: body.logo,
          role: Role.USER,
          password: null,
          coins: 0,
          provider: Providers.GOOGLE,
          isVerified: true,
          lastActiveDate: new Date(),
        },
      });
    }

    return this.tokenService.generateTokens(user.id);
  }
}
