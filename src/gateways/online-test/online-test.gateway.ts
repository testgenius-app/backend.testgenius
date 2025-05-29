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
import { AnswerValidationService } from 'src/modules/online-test/services/answer-validation.service';
import {
  IParticipantResult,
  IOnlineTestResults,
} from './types/online-test.types';
import {
  IStartTestResponse,
  IStartOnlineTestResponse,
  IFinishOnlineTestResponse,
  IJoinOnlineTestResponse,
  ILeaveOnlineTestResponse,
  IChangeUserDataResponse,
  ISelectAnswerResponse,
  IFinishOnlineTestAsParticipantResponse,
  IErrorResponse,
} from './types/online-test.responses';
import { ActivityService } from 'src/modules/activity/activity.service';
import { EntityType, ActionType } from '@prisma/client';

class OnlineTestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'OnlineTestError';
  }
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
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
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OnlineTestGateway.name);
  private readonly activeTests: Map<string, NodeJS.Timeout> = new Map();
  private readonly rateLimits: Map<string, RateLimitInfo> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly testTempCodeService: TestTempCodeService,
    private readonly onlineTestService: OnlineTestService,
    private readonly answerValidationService: AnswerValidationService,
    private readonly activityService: ActivityService,
  ) {}

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const limitInfo = this.rateLimits.get(clientId);

    if (!limitInfo || now > limitInfo.resetTime) {
      this.rateLimits.set(clientId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (limitInfo.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    limitInfo.count++;
    return true;
  }

  private validateDuration(durationInMinutes: number): void {
    if (!Number.isInteger(durationInMinutes) || durationInMinutes <= 0) {
      throw new OnlineTestError(
        'Duration must be a positive integer',
        'INVALID_DURATION',
      );
    }
    if (durationInMinutes > 180) {
      // 3 hours max
      throw new OnlineTestError(
        'Duration cannot exceed 180 minutes',
        'INVALID_DURATION',
      );
    }
  }

  private validateUserData(
    firstName: string,
    lastName: string,
    email?: string,
  ): void {
    if (!firstName?.trim() || !lastName?.trim()) {
      throw new OnlineTestError(
        'First name and last name are required',
        'INVALID_USER_DATA',
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new OnlineTestError('Invalid email format', 'INVALID_USER_DATA');
    }
  }

  private validateAnswerData(
    sectionId: string,
    taskId: string,
    questionId: string,
    answer: string,
  ): void {
    if (
      !sectionId?.trim() ||
      !taskId?.trim() ||
      !questionId?.trim() ||
      !answer?.trim()
    ) {
      throw new OnlineTestError(
        'All answer fields are required',
        'INVALID_ANSWER_DATA',
      );
    }
  }

  private handleError(client: Socket, error: Error, event: string) {
    const errorMessage =
      error instanceof OnlineTestError
        ? error.message
        : 'An unexpected error occurred';

    this.logger.error(`Error in ${event}: ${error.message}`, error.stack);
    client.emit(ONLINE_TEST_EVENTS.ERROR, {
      message: errorMessage,
    } as IErrorResponse);
  }

  private async validateTestAccess(
    test: any,
    user: User,
    requireOwner: boolean = false,
  ) {
    if (!test) {
      throw new OnlineTestError('Test not found', 'TEST_NOT_FOUND');
    }

    if (test.finishedAt) {
      throw new OnlineTestError('Test has already finished', 'TEST_FINISHED');
    }

    if (requireOwner && test.test.ownerId !== user.id) {
      throw new OnlineTestError(
        'Only test owner can perform this action',
        'UNAUTHORIZED',
      );
    }

    return test;
  }

  private async validateParticipant(test: any, clientId: string) {
    const participants = JSON.parse(
      test.participants as string,
    ) as IParticipant[];
    const participant = participants.find((p) => p.clientId === clientId);

    if (!participant) {
      throw new OnlineTestError(
        'Participant not found',
        'PARTICIPANT_NOT_FOUND',
      );
    }

    return participant;
  }

  private clearTestTimer(testId: string) {
    const timer = this.activeTests.get(testId);
    if (timer) {
      clearTimeout(timer);
      this.activeTests.delete(testId);
    }
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up any active test timers for this client
    for (const [testId, timer] of this.activeTests.entries()) {
      const test = await this.onlineTestService._getOnlineTestByTestId(testId);
      if (test) {
        const participants = JSON.parse(
          test.participants as string,
        ) as IParticipant[];
        if (participants.some((p) => p.clientId === client.id)) {
          this.clearTestTimer(testId);
        }
      }
    }
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.START_TEST)
  async startTest(client: Socket, { test }: { test: any }) {
    try {
      const user = await this.validateUser(client);
      if (!user) return;

      const tempCode = await this.testTempCodeService.createTestTempCode(
        test.id,
      );
      await this.onlineTestService._createOnlineTest({
        testId: test.id,
        tempCodeId: tempCode.id,
      });

      client.join(test.id);
      const event = ONLINE_TEST_EVENTS.START_TEST;
      const payload: IStartTestResponse = { test, tempCode };

      client.emit(event, payload);
      client.broadcast.to(test.id).emit(event, payload);
    } catch (error) {
      this.handleError(client, error, ONLINE_TEST_EVENTS.START_TEST);
    }
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.START_ONLINE_TEST)
  async startOnlineTest(
    client: Socket,
    { code, durationInMinutes }: { code: number; durationInMinutes: number },
  ) {
    try {
      if (!this.checkRateLimit(client.id)) {
        throw new OnlineTestError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
      }
      console.log(durationInMinutes);
      this.validateDuration(durationInMinutes);
      const user = await this.validateUser(client);
      if (!user) return;

      const tempCode = await this.testTempCodeService.getTestTempCode(+code);
      if (!tempCode) {
        throw new OnlineTestError('Invalid test code', 'INVALID_CODE');
      }

      const existingTest = await this.onlineTestService._getOnlineTestByTestId(
        tempCode.testId,
        false,
      );

      await this.validateTestAccess(existingTest, user, true);

      const startedTest = await this.onlineTestService._startOnlineTest(
        existingTest.id,
      );

      // Log activity for starting online test
      await this.activityService.logActivity({
        entityType: EntityType.ONLINE_TEST,
        actionType: ActionType.START,
        entityId: startedTest.id,
        description: {
          uz: `Online test boshlandi: "${existingTest.test.title}"`,
          ru: `Онлайн тест начался: "${existingTest.test.title}"`,
          en: `Online test started: "${existingTest.test.title}"`,
        },
        actorId: user.id,
        metadata: {
          title: {
            uz: existingTest.test.title,
            ru: existingTest.test.title,
            en: existingTest.test.title,
          },
          subject: {
            uz: existingTest.test.subject,
            ru: existingTest.test.subject,
            en: existingTest.test.subject,
          },
          gradeLevel: existingTest.test.gradeLevel,
          durationInMinutes,
          participantCount: JSON.parse(startedTest.participants as string)
            .length,
        },
      });

      const payload: IStartOnlineTestResponse = {
        test: existingTest,
        durationInMinutes,
      };

      this.server
        .to(tempCode.testId)
        .emit(ONLINE_TEST_EVENTS.START_ONLINE_TEST, payload);

      // Clear any existing timer for this test
      this.clearTestTimer(tempCode.testId);

      // Set up automatic test completion after duration
      const durationInMs = durationInMinutes * 60 * 1000;
      const timer = setTimeout(async () => {
        try {
          const currentTest =
            await this.onlineTestService._getOnlineTestByTestId(
              tempCode.testId,
              true,
            );
          if (!currentTest || currentTest.finishedAt) return;

          await this.finishTest(currentTest.id, user);
        } catch (error) {
          this.logger.error(
            `Error in automatic test completion: ${error.message}`,
          );
        }
      }, durationInMs);

      this.activeTests.set(tempCode.testId, timer);
    } catch (error) {
      this.handleError(client, error, ONLINE_TEST_EVENTS.START_ONLINE_TEST);
    }
  }

  private async finishTest(testId: string, user: User) {
    const test = await this.onlineTestService._getOnlineTestByTestId(
      testId,
      true,
    );
    if (!test || test.finishedAt) return;

    await this.onlineTestService._finishOnlineTest(test.id);

    const finalResults = await this.onlineTestService._getOnlineTestResults(
      test.id,
    );
    const results = finalResults.results
      ? JSON.parse(finalResults.results as string)
      : { results: {}, lastUpdated: new Date() };

    const participants = JSON.parse(
      finalResults.participants as string,
    ) as IParticipant[];
    const updatedParticipants = participants.map((participant) => ({
      ...participant,
      status: 'completed',
    }));

    await this.onlineTestService._updateOnlineTest(test.id, {
      participants: JSON.stringify(updatedParticipants),
    });

    const finishPayload: IFinishOnlineTestResponse = {
      testId,
      results,
    };

    this.server
      .to(testId)
      .emit(ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST, finishPayload);

    const sockets = await this.server.in(testId).fetchSockets();
    for (const socket of sockets) {
      if (socket.id !== user.id) {
        socket.leave(testId);
      }
    }

    this.clearTestTimer(testId);
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST)
  async finishOnlineTest(client: Socket, { testId }: { testId: string }) {
    try {
      const user = await this.validateUser(client);
      if (!user) return;

      const test = await this.onlineTestService._getOnlineTestByTestId(
        testId,
        true,
      );
      if (!test) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test not found',
        } as IErrorResponse);
      }

      // Check if test is already finished
      if (test.finishedAt) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test is already finished',
        } as IErrorResponse);
      }

      // Check if user is the test owner
      if (test.test.ownerId !== user.id) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Only test owner can finish the test',
        } as IErrorResponse);
      }

      // Finish the test
      await this.onlineTestService._finishOnlineTest(test.id);

      // Get final results
      const finalResults = await this.onlineTestService._getOnlineTestResults(
        test.id,
      );
      const results = finalResults.results
        ? JSON.parse(finalResults.results as string)
        : { results: {}, lastUpdated: new Date() };

      // Update participant statuses to completed
      const participants = JSON.parse(
        finalResults.participants as string,
      ) as IParticipant[];
      const updatedParticipants = participants.map((participant) => ({
        ...participant,
        status: 'completed',
      }));

      // Update the test with completed participant statuses
      await this.onlineTestService._updateOnlineTest(test.id, {
        participants: JSON.stringify(updatedParticipants),
      });

      const payload: IFinishOnlineTestResponse = {
        testId,
        results,
      };

      // Broadcast to all participants that the test is finished
      this.server
        .to(testId)
        .emit(ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST, payload);

      // Disconnect all participants from the test room
      const sockets = await this.server.in(testId).fetchSockets();
      for (const socket of sockets) {
        if (socket.id !== client.id) {
          // Don't disconnect the owner
          socket.leave(testId);
        }
      }
    } catch (error) {
      this.handleError(client, error, ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST);
    }
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST)
  async joinOnlineTest(client: Socket, { code }: { code: number }) {
    try {
      const tempCode = await this.testTempCodeService.getTestTempCode(code);
      if (!tempCode)
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Online test not found',
        } as IErrorResponse);

      const test = await this.onlineTestService._getOnlineTestByTestId(
        tempCode.testId,
        false, // Don't include answers for participants
      );
      if (!test)
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test not found',
        } as IErrorResponse);

      // Check if test has already started
      if (test.startedAt) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test has already started. New participants cannot join.',
        } as IErrorResponse);
      }

      // Check if test is finished
      if (test.finishedAt) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test has already finished',
        } as IErrorResponse);
      }

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
        false, // Don't include answers for participants
      );

      const payload: IJoinOnlineTestResponse = {
        onlineUsers: JSON.parse(updated?.participants as string),
        testId: tempCode.testId,
        test: updated?.test,
      };

      client.emit(ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST, payload);
      this.server
        .to(tempCode.testId)
        .emit(ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST, payload);
    } catch (err) {
      this.handleError(client, err, ONLINE_TEST_EVENTS.JOIN_ONLINE_TEST);
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
        status: 'completed',
      });
    const payload: ILeaveOnlineTestResponse = {
      onlineUsers: JSON.parse(updated?.participants as string),
    };
    client.emit(ONLINE_TEST_EVENTS.LEAVE_ONLINE_TEST, payload);
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
    try {
      if (!this.checkRateLimit(client.id)) {
        throw new OnlineTestError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
      }

      const { firstName, lastName, email, code } = payload;
      this.validateUserData(firstName, lastName, email);

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

      const responsePayload: IChangeUserDataResponse = {
        onlineUsers: updatedParticipants,
        testId: tempCode.testId,
      };

      this.server
        .to(tempCode.testId)
        .emit(ONLINE_TEST_EVENTS.CHANGE_USER_DATA, responsePayload);
    } catch (error) {
      this.handleError(client, error, ONLINE_TEST_EVENTS.CHANGE_USER_DATA);
    }
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
      if (!this.checkRateLimit(client.id)) {
        throw new OnlineTestError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
      }

      const { testId, sectionId, taskId, questionId, answer } = payload;
      this.validateAnswerData(sectionId, taskId, questionId, answer);

      // Get the online test with answers for validation
      const onlineTest = await this.onlineTestService._getOnlineTestByTestId(
        testId,
        true,
      );
      if (!onlineTest) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test not found',
        } as IErrorResponse);
      }

      // Check if test is started and not finished
      if (!onlineTest.startedAt || onlineTest.finishedAt) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Test is not active',
        } as IErrorResponse);
      }

      // Get the participant
      const participants = JSON.parse(
        onlineTest.participants as string,
      ) as IParticipant[];
      const participant = participants.find((p) => p.clientId === client.id);
      if (!participant) {
        return client.emit(ONLINE_TEST_EVENTS.ERROR, {
          message: 'Participant not found',
        } as IErrorResponse);
      }

      // Get current results or initialize new ones
      const currentResults: IOnlineTestResults = onlineTest.results
        ? JSON.parse(onlineTest.results as string)
        : { results: {}, lastUpdated: new Date() };

      // Get or initialize participant result
      const participantResult: IParticipantResult = currentResults.results[
        participant.clientId
      ] || {
        participantId: participant.clientId,
        sections: {},
        correctAnswersCount: 0,
        totalQuestions: 0,
        startedAt: new Date(),
        lastInteractionAt: new Date(),
        metrics: {
          accuracy: 0,
          averageTimePerQuestion: 0,
          performanceTrend: {
            questionIds: [],
            correctness: [],
          },
          totalTimeSpent: 0,
          incorrectAnswersCount: 0,
        },
      };

      // Process the answer
      const updatedParticipantResult =
        this.answerValidationService.processAnswer(
          onlineTest.test as any,
          participantResult,
          sectionId,
          taskId,
          questionId,
          answer,
        );

      // Update the results
      currentResults.results[participant.clientId] = updatedParticipantResult;
      currentResults.lastUpdated = new Date();

      // Save the updated results
      await this.onlineTestService._updateOnlineTestResults(
        onlineTest.id,
        currentResults,
      );

      // Calculate percentage
      const percentage = this.answerValidationService.calculatePercentage(
        updatedParticipantResult.correctAnswersCount,
        updatedParticipantResult.totalQuestions,
      );

      const responsePayload: ISelectAnswerResponse = {
        clientId: client.id,
        sectionId,
        taskId,
        questionId,
        answer,
        correctAnswersCount: updatedParticipantResult.correctAnswersCount,
        totalQuestions: updatedParticipantResult.totalQuestions,
        percentage,
        metrics: updatedParticipantResult.metrics,
      };

      // Broadcast the answer selection to all participants
      this.server
        .to(testId)
        .emit(ONLINE_TEST_EVENTS.SELECT_ANSWER, responsePayload);
    } catch (error) {
      this.handleError(client, error, ONLINE_TEST_EVENTS.SELECT_ANSWER);
    }
  }

  @SubscribeMessage(ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST_AS_PARTICIPANT)
  async finishOnlineTestAsParticipant(
    client: Socket,
    { testId }: { testId: string },
  ) {
    const test = await this.onlineTestService._getOnlineTestByTestId(testId);
    if (!test) return;

    const results = JSON.parse(test.results as string);
    const participants = JSON.parse(
      test.participants as string,
    ) as IParticipant[];

    const updatedParticipants = participants.map((p: IParticipant) => {
      if (p.clientId === client.id) {
        const participantResults = results[p.clientId];
        if (participantResults) {
          const totalScore = participantResults.correctAnswersCount;
          const totalQuestions = participantResults.totalQuestions;
          const percentage = (totalScore / totalQuestions) * 100;

          const updatedParticipant: IParticipant = {
            ...p,
            status: 'waiting_results',
            score: {
              totalScore,
              totalQuestions,
              percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
            },
          };
          return updatedParticipant;
        }
      }
      return p;
    });

    await this.onlineTestService._updateOnlineTest(test.id, {
      participants: JSON.stringify(updatedParticipants),
    });

    // Get the participant's score
    const participant = updatedParticipants.find(
      (p: IParticipant) => p.clientId === client.id,
    );
    const score = participant?.score;

    const responsePayload: IFinishOnlineTestAsParticipantResponse = {
      testId,
      score,
    };

    client.broadcast
      .to(testId)
      .emit(
        ONLINE_TEST_EVENTS.FINISH_ONLINE_TEST_AS_PARTICIPANT,
        responsePayload,
      );
  }

  private async validateUser(client: Socket) {
    const token = client.handshake.auth.accessToken;
    const user = await this.jwtTokenService.verifyToken(token);
    if (!user) {
      client.emit(ONLINE_TEST_EVENTS.ERROR, {
        message: 'Invalid token',
      } as IErrorResponse);
      client.disconnect();
      return null;
    }
    return user;
  }
}
