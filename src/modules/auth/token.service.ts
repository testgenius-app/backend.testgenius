import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ITokens } from 'src/core/types/tokens.type';

@Injectable()
export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpirationTime: string | number;
  private readonly refreshTokenExpirationTime: string | number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );
    this.refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    this.accessTokenExpirationTime = this.configService.get<string | number>(
      'ACCESS_TOKEN_EXPIRATION_TIME',
    );
    this.refreshTokenExpirationTime = this.configService.get<string | number>(
      'REFRESH_TOKEN_EXPIRATION_TIME',
    );
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    try {
      return this.jwtService.verifyAsync(token, {
        secret: this.refreshTokenSecret,
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
    return this.jwtService.signAsync(
      { userId },
      {
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenExpirationTime,
      },
    );
  }

  private async createRefreshToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { userId },
      {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenExpirationTime,
      },
    );
  }
}
