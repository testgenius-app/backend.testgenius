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
import { TestService } from 'src/modules/test/services/test.service';
import { User } from '@prisma/client';
import {
  IParticipant,
  OnlineTestService,
} from 'src/modules/online-test/online-test.service';
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
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly logger: Logger,
    private readonly jwtTokenService: JwtTokenService,
    private readonly testTempCodeService: TestTempCodeService,
    private readonly testService: TestService,
    private readonly onlineTestService: OnlineTestService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log('Client connected online-test gateway');
  }

  async handleDisconnect(client: Socket) {
    this.logger.log('Client disconnected from online-test gateway');
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.START_TEST)
  async startTest(client: Socket, { testId }: { testId: string }) {
    try {
      const user = await this.validateUser(client);
      if (!user) return;

      const test = await this.testService.getTestById(testId, { id: user.id });
      const tempCode =
        await this.testTempCodeService.createTestTempCode(testId);
      await this.onlineTestService._createOnlineTest({
        testId,
        tempCodeId: tempCode.id,
      });

      client.join(testId);
      const event = ONLINE_TEST_EVENTS.START_TEST;
      const payload = { test, tempCode };

      client.emit(event, payload);
      client.broadcast.to(testId).emit(event, payload);
    } catch (error) {
      return this.logger.error(error);
    }
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.START_ONLINE_TEST)
  async startOnlineTest(
    client: Socket,
    { code, durationInMinutes }: { code: number; durationInMinutes: number },
  ) {
    try {
      const user = await this.validateUser(client);
      if (!user) return;
      const tempCode = await this.testTempCodeService.getTestTempCode(+code);
      if (!tempCode) return;

      const existingTest = await this.onlineTestService._getOnlineTestByTestId(
        tempCode.testId,
      );
      if (
        !existingTest ||
        existingTest.finishedAt ||
        existingTest.test.ownerId !== user.id
      )
        return;

      await this.onlineTestService._startOnlineTest(existingTest.id);
      this.server
        .to(tempCode.testId)
        .emit(ONLINE_TEST_EVENTS.START_ONLINE_TEST, {
          test: existingTest,
          durationInMinutes,
        });
    } catch (error) {
      return this.logger.error(error);
    }
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST)
  async finishOnlineTest(client: Socket, { testId }: { testId: string }) {
    const user = await this.validateUser(client);
    if (!user) return;

    const test = await this.onlineTestService._getOnlineTestByTestId(testId);
    if (!test) return;

    await this.onlineTestService._finishOnlineTest(test.id);
    client.broadcast.to(testId).emit(ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST, {
      testId,
      results: test.results,
    });
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST)
  async joinOnlineTest(client: Socket, { code }: { code: number }) {
    try {
      const tempCode = await this.testTempCodeService.getTestTempCode(code);
      if (!tempCode)
        return client.emit(ONLINE_TEST_EVENTS.ERROR, 'Online test not found');

      const test = await this.onlineTestService._getOnlineTestByTestId(
        tempCode.testId,
      );
      if (!test) return client.emit(ONLINE_TEST_EVENTS.ERROR, 'Test not found');

      client.join(tempCode.testId);

      let user: User | null = null;
      if (client.handshake.auth.accessToken) {
        user = await this.validateUser(client);
      }
      if (!user && test.test.ownerId !== user?.id) {
        await this.onlineTestService._addParticipantToOnlineTest(
          tempCode.testId,
          {
            clientId: client.id,
            status: 'pending',
          },
        );
      }

      const updated = await this.onlineTestService._getOnlineTestByTestId(
        tempCode.testId,
      );

      client.emit(ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST, {
        onlineUsers: JSON.parse(updated?.participants as string),
        testId: tempCode.testId,
      });
      this.server
        .to(tempCode.testId)
        .emit(ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST, {
          onlineUsers: JSON.parse(updated?.participants as string),
          testId: tempCode.testId,
        });
    } catch (err) {
      this.logger.error(err);
    }
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.LEAVE_ONLINE_TEST)
  async leaveOnlineTest(client: Socket, { code }: { code: number }) {
    const tempCode = await this.testTempCodeService.getTestTempCode(code);
    if (!tempCode) return;

    const test = await this.onlineTestService._getOnlineTestByTestId(
      tempCode.testId,
    );
    if (!test) return;

    client.leave(tempCode.testId);

    const updated =
      await this.onlineTestService._removeParticipantFromOnlineTest(test.id, {
        clientId: client.id,
      });
    client.emit(ONLINE_TEST_EVENTS.LEAVE_ONLINE_TEST, {
      onlineUsers: JSON.parse(updated?.participants as string),
    });
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.CHANGE_USER_DATA)
  async changeUserData(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      firstName: string;
      lastName: string;
      email?: string;
      code: number;
    },
  ) {
    const { firstName, lastName, email, code } = payload;
    if (!firstName || !lastName || !code) return;

    const tempCode = await this.testTempCodeService.getTestTempCode(code);
    if (!tempCode) return;

    const test = await this.onlineTestService._getOnlineTestByTestId(
      tempCode.testId,
    );
    if (!test) return;

    const participants = JSON.parse(
      test?.participants as string,
    ) as IParticipant[];
    const user = participants.find(
      (p: IParticipant) => p.clientId === client.id,
    );
    if (!user) return;

    Object.assign(user, { firstName, lastName, email });
    user.status = 'active';
    const updated = await this.onlineTestService._updateParticipantData(
      test.id,
      user,
    );
    const updatedParticipants = JSON.parse(updated?.participants as string);

    this.server.to(tempCode.testId).emit(ONLINE_TEST_EVENTS.CHANGE_USER_DATA, {
      onlineUsers: updatedParticipants,
      testId: tempCode.testId,
    });
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.SELECT_ANSWER)
  async handleSelectTestAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      testId: string;
      sectionId: string;
      taskId: string;
      questionId: string;
      answer: string;
    },
  ) {
    try {
      const { testId, sectionId, taskId, questionId, answer } = payload;

      // Get the online test
      const onlineTest =
        await this.onlineTestService._getOnlineTestByTestId(testId);
      if (!onlineTest) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test not found',
        });
      }

      // Check if test is started and not finished
      if (!onlineTest.startedAt || onlineTest.finishedAt) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test is not active',
        });
      }

      // Get the participant
      const participants = JSON.parse(
        onlineTest.participants as string,
      ) as IParticipant[];
      const participant = participants.find((p) => p.clientId === client.id);
      if (!participant) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Participant not found',
        });
      }

      // Update the results
      const results = onlineTest.results
        ? JSON.parse(onlineTest.results as string)
        : {};
      if (!results[participant.clientId]) {
        results[participant.clientId] = {};
      }
      if (!results[participant.clientId][sectionId]) {
        results[participant.clientId][sectionId] = {};
      }
      if (!results[participant.clientId][sectionId][taskId]) {
        results[participant.clientId][sectionId][taskId] = {};
      }

      results[participant.clientId][sectionId][taskId][questionId] = answer;

      // Update the online test with new results
      await this.onlineTestService._updateOnlineTestResults(
        onlineTest.id,
        results,
      );

      // Broadcast the answer selection to all participants
      this.server.to(testId).emit(ONLINE_TEST_EVENTS.SELECT_ANSWER, {
        clientId: client.id,
        sectionId,
        taskId,
        questionId,
        answer,
      });
    } catch (error) {
      this.logger.error(error);
      client.emit(ONLINE_TEST_EVENTS.ERROR, {
        message: 'Failed to process answer selection',
      });
    }
  }
  private async validateUser(client: Socket) {
    const token = client.handshake.auth.accessToken;
    const user = await this.jwtTokenService.verifyToken(token);
    if (!user) {
      client.emit(ONLINE_TEST_EVENTS.ERROR, 'Invalid token');
      client.disconnect();
      return null;
    }
    return user;
  }
}
