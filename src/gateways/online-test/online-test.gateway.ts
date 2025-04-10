import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtTokenService } from '../generate-test/jwt-token.service';
import { ONLINE_TEST_EVENTS } from './events/online-test.events';
import { TestTempCodeService } from 'src/modules/test-temp-code/test-temp-code.service';
import { TestService } from 'src/modules/test/test.service';

interface IOnlineTest {
  test: any;
  onlineUsers: Map<string, any>;
  durationInMinutes: number;
  code: number;
  isFinished: boolean;
  adminId: string;
}

@WebSocketGateway({
  namespace: 'online-test',
  transports: ['websocket'],
  cors: {
    origin: ['*'],
    credentials: true,
  },
})
export class OnlineTestGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private onlineTests = new Map<string, IOnlineTest>();

  constructor(
    private readonly logger: Logger,
    private readonly jwtTokenService: JwtTokenService,
    private readonly testTempCodeService: TestTempCodeService,
    private readonly testService: TestService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const accessToken = client.handshake.auth.accessToken;
    console.log('tried', accessToken);

    if (!accessToken) {
      client.disconnect();
      return;
    }

    const user = await this.jwtTokenService.verifyToken(accessToken);

    if (!user) {
      client.disconnect();
      return;
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log('Client disconnected:', client.id);
  }
  @SubscribeMessage(ONLINE_TEST_EVENTS.START_TEST)
  async startTest(
    client: Socket,
    payload: { test: any; isTestCreated: boolean },
  ) {
    console.log('start test', payload);
    const { test, isTestCreated } = payload;
    const user = await this.validateUser(client);
    if (!user) {
      return;
    }

    if (isTestCreated) {
      try {
        const testTempCode = await this.testTempCodeService.createTestTempCode(
          test.id,
        );
        const durationInMinutes = test.durationInMinutes;
        this.onlineTests.set(test.id, {
          test,
          onlineUsers: new Map(),
          durationInMinutes,
          code: testTempCode.code,
          isFinished: false,
          adminId: user.id,
        });

        client.join(String(testTempCode.code));
        return client.broadcast
          .to(String(testTempCode.code))
          .emit(ONLINE_TEST_EVENTS.START_TEST, {
            test,
            code: testTempCode.code,
          });
      } catch (error) {
        this.logger.error(error);
      }
    } else {
      const data = await this.testService.create(user, test);
      const tempCode = await this.testTempCodeService.createTestTempCode(
        data.id,
      );
      const durationInMinutes = test.durationInMinutes;
      this.onlineTests.set(data.id, {
        test: data,
        onlineUsers: new Map(),
        durationInMinutes,
        code: tempCode.code,
        isFinished: false,
        adminId: user.id,
      });

      client.join(String(tempCode.code));
      client.emit(ONLINE_TEST_EVENTS.TEST_STARTED, {
        test: data,
        tempCode,
      });
      return client.broadcast
        .to(String(tempCode.code))
        .emit(ONLINE_TEST_EVENTS.TEST_STARTED, {
          test: data,
          tempCode,
        });
    }

    return;
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.START_ONLINE_TEST)
  async startOnlineTest(
    client: Socket,
    payload: { test: any; durationInMinutes: number },
  ) {
    const { test, durationInMinutes } = payload;
    const user = await this.validateUser(client);
    if (!user) {
      return;
    }
    const testTempCode = await this.testTempCodeService.getTestTempCodeByTestId(
      test.id,
    );
    const oldData = this.onlineTests.get(test.id);
    if (oldData) {
      return;
    }
    if (
      oldData?.isFinished ||
      oldData?.adminId !== user.id ||
      oldData?.onlineUsers.size === 0
    ) {
      return;
    }
    this.onlineTests.set(test.id, {
      test,
      durationInMinutes,
      code: testTempCode.code,
      isFinished: false,
      onlineUsers: oldData?.onlineUsers || new Map(),
      adminId: user.id,
    });

    client.broadcast
      .to(String(testTempCode.code))
      .emit(ONLINE_TEST_EVENTS.START_ONLINE_TEST, {
        test,
        durationInMinutes,
      });
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST)
  async finishOnlineTest(client: Socket, payload: { testId: string }) {
    const { testId } = payload;
    const user = await this.validateUser(client);
    if (!user) {
      return;
    }
    const onlineTest = this.onlineTests.get(testId);
    if (!onlineTest) {
      return;
    }
    this.onlineTests.delete(testId);

    client.broadcast
      .to(String(onlineTest.code))
      .emit(ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST, { testId });
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST)
  async joinOnlineTest(client: Socket, payload: { code: number }) {
    try {
      const { code } = payload;
    
    const tempCode = await this.testTempCodeService.getTestTempCode(code);
    if (!tempCode) {
      return;
    }
    const onlineTest = this.onlineTests.get(tempCode.testId);
    if (!onlineTest) {
      return;
    }
      client.join(String(code));
      onlineTest.onlineUsers.set(client.id, { clientId: client.id });
      this.onlineTests.set(tempCode.testId, onlineTest);
      console.log(this.onlineTests.get(tempCode.testId));
      client.emit(ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST, { code });
    } catch (error) {
      console.log(error);
    }
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.LEAVE_ONLINE_TEST)
  async leaveOnlineTest(client: Socket, payload: { code: number }) {
    const { code } = payload;
    const tempCode = await this.testTempCodeService.getTestTempCode(code);
    if (!tempCode) {
      return;
    }
    const onlineTest = this.onlineTests.get(tempCode.testId);
    if (!onlineTest) {
      return;
    }
    client.leave(String(code));
    onlineTest.onlineUsers.delete(client.id);
    this.onlineTests.set(tempCode.testId, onlineTest);
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.CHANGE_USER_DATA)
  async changeUserData(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      firstName: string;
      lastName: string;
      email: string;
      testId: string;
    },
  ): Promise<void> {
    const { firstName, lastName, email, testId } = payload;

    if (!firstName || !lastName || !email || !testId) {
      return;
    }

    const onlineTest = this.onlineTests.get(testId);
    if (!onlineTest) {
      return;
    }

    const user = onlineTest.onlineUsers.get(client.id);
    if (!user) {
      return;
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    this.server
      .to(testId)
      .emit(ONLINE_TEST_EVENTS.CHANGE_USER_DATA, onlineTest);
  }

  private async validateUser(client: Socket) {
    const token = client.handshake.auth.accessToken;
    const user = await this.jwtTokenService.verifyToken(token);
    if (!user) {
      client.emit(ONLINE_TEST_EVENTS.ERROR, 'Invalid token');
      client.disconnect();
      return;
    }
    return user;
  }
}
