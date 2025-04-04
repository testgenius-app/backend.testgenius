import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ITokens } from 'src/core/types/tokens.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    try {
      return this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTokens(userId: string): Promise<ITokens> {
    const accessToken = await this.createAccessToken(userId);
    const refreshToken = await this.createRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  private async createAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync({ userId });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { userId },
      {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string | number>(
          'REFRESH_TOKEN_EXPIRATION_TIME',
        ),
      },
    );
  }
}
