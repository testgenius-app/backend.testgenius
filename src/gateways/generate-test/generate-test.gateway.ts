import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GenerateTestService } from './generate-test.service';
import { Logger } from '@nestjs/common';
import { GENERATE_TEST_EVENTS } from './events/generate-test.events';
import { JwtTokenService } from './jwt-token.service';

@WebSocketGateway({
  namespace: 'generate-test',
  transports: ['websocket'],
  cors: {
    origin: ['*'],
    credentials: true,
  },
})
export class GenerateTestGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly generateTestService: GenerateTestService,
    private readonly logger: Logger,
    private readonly jwtTokenService: JwtTokenService,
  ) {}
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    this.logger.log('Client connected to generate-test gateway');
    const accessToken = client.handshake.auth.accessToken;

    this.logger.log('Access token', client.handshake.auth);
    if (!accessToken) {
      client.disconnect();
      return;
    }

    const user = await this.jwtTokenService.verifyToken(accessToken);

    if (!user) {
      client.disconnect();
      return;
    }
    this.logger.log('Client connected to generate-test gateway');
  }

  async handleDisconnect(client: Socket) {
    this.logger.log('Client disconnected from generate-test gateway');
  }

  @SubscribeMessage(GENERATE_TEST_EVENTS.GENERATE_TEST_BY_FORM)
  async handleTest(client: Socket, data: any) {
    await this.validateUser(client);
    const test = await this.generateTestService.generateTest(data);
    client.emit(GENERATE_TEST_EVENTS.GENERATE_TEST_SUCCESS, test);
  }

  private async validateUser(client: Socket) {
    const token = client.handshake.auth.accessToken;
    const user = await this.jwtTokenService.verifyToken(token);
    if (!user) {
      client.emit(GENERATE_TEST_EVENTS.GENERATE_TEST_ERROR, 'Invalid token');
      client.disconnect();
      return;
    }
    return user;
  }
}
