import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/core/types/iuser.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ForbiddenException('TOKEN_NOT_PROVIDED');
    }
    const bearer = authHeader.split(' ')[0];
    const token = authHeader.split(' ')[1];
    if (bearer !== 'Bearer' || !token || token === 'undefined') {
      throw new ForbiddenException('TOKEN_NOT_PROVIDED');
    }
    try {
      const { userId } = this.jwtService.verify(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });
      const iUser: IUser = {
        id: userId,
      };
      req.user = iUser;
      return true;
    } catch (e) {
      if (e.status && e.status === 403) {
        throw e;
      }
      throw new UnauthorizedException('WRONG_TOKEN');
    }
  }
}
