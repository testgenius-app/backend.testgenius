import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtTokenService } from 'src/gateways/generate-test/jwt-token.service';

/**
 * WebSocket JWT Guard for protecting WebSocket endpoints
 * @description Validates JWT tokens for WebSocket connections
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const accessToken = client.handshake.auth.accessToken;

      if (!accessToken) {
        throw new WsException('Access token not provided');
      }

      const user = await this.jwtTokenService.verifyToken(accessToken);

      if (!user) {
        throw new WsException('Invalid access token');
      }

      // Attach user to socket data for later use
      client.data.user = user;

      return true;
    } catch (error) {
      throw new WsException('Unauthorized');
    }
  }
} 