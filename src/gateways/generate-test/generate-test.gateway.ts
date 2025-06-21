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
import { TestService } from 'src/modules/test/services/test.service';
import { CoinService } from 'src/modules/coin/coin.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NotificationChannel, NotificationPriority, NotificationType } from 'src/modules/notification/dto/notification.create.dto';

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
    private readonly testService: TestService,
    private readonly coinService: CoinService,
    private readonly notificationService: NotificationService,
  ) {}
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const accessToken = client.handshake.auth.accessToken;

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
    const user = await this.validateUser(client);
    const amountOfCoins = 5;
    const coins = await this.coinService.getUserCoins(user.id);
    if (coins.coins < amountOfCoins) {
      client.emit(GENERATE_TEST_EVENTS.GENERATE_TEST_ERROR, 'Not enough coins');
      return;
    }
    const testData = await this.generateTestService.generateTest(data);
    const test = await this.testService.create(user, testData);
    await this.coinService.updateUserCoins(user.id, coins.coins - amountOfCoins);
    await this.notificationService.createNotification({
      title: 'Hisobingizdan 5 ta tanga yechib olindi',
      message: 'Test yechish uchun tanga yechib olindi',
      data: {
        type: 'test',
        testId: test.id,
      },
      type: NotificationType.INFO,
      priority: NotificationPriority.NORMAL,
      channel: NotificationChannel.WEB,
      userId: user.id,
    }, 'user');
    client.emit(GENERATE_TEST_EVENTS.GENERATE_TEST_SUCCESS, test);
  }

  @SubscribeMessage(GENERATE_TEST_EVENTS.GENERATE_TEST_BY_EXIST_TEST)
  async handleGenerateTestByExistTest(
    client: Socket,
    data: { questions: Buffer; answers: Buffer },
  ) {
    try {
      const user = await this.validateUser(client);
      console.log(data);
      // const testData = await this.generateTestService.generateTest({
      //   questions: data.questions,
      //   answers: data.answers,
      // });
      // const test = await this.testService.create(user, testData);
      client.emit(GENERATE_TEST_EVENTS.GENERATE_TEST_SUCCESS, test);
    } catch (error) {
      client.emit(GENERATE_TEST_EVENTS.GENERATE_TEST_ERROR, error.message);
    }
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
