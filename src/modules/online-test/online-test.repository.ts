import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateOnlineTestDto } from './dto/create-online-test.dto';
import { OnlineTest, Prisma } from '@prisma/client';
import { IParticipant } from './online-test.service';

export interface IOnlineTestListResponse {
  id: string;
  testId: string;
  tempCodeId: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  participants: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  test: {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

const include = {
  sections: {
    include: {
      tasks: {
        include: {
          questions: true,
        },
      },
    },
  },
};
@Injectable()
export class OnlineTestRepository implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // await this.prisma.onlineTest.deleteMany({});
    // await this.prisma.testTempCode.deleteMany({});
    // await this.prisma.test.deleteMany({});
    // await this.prisma.verificationCode.deleteMany({});
  }

  async createOnlineTest(
    createOnlineTestDto: CreateOnlineTestDto,
  ): Promise<OnlineTest> {
    const { testId, tempCodeId } = createOnlineTestDto;
    const onlineTest = await this.prisma.onlineTest.create({
      data: {
        test: { connect: { id: testId } },
        testTempCode: { connect: { id: tempCodeId } },
        participants: JSON.stringify([]),
      },
    });
    return onlineTest;
  }

  async getOnlineTestByTempCodeId(tempCodeId: string): Promise<OnlineTest> {
    const onlineTest = await this.prisma.onlineTest.findFirst({
      where: { testTempCode: { id: tempCodeId } },
    });
    return onlineTest;
  }

  async getOnlineTestByTestId(testId: string) {
    const [onlineTest, test] = await Promise.all([
      this.prisma.onlineTest.findFirst({
        where: { test: { id: testId } },
        include: { test: true },
      }),
      this.prisma.test.findUnique({ where: { id: testId }, include }),
    ]);
    onlineTest.test = test;

    return onlineTest;
  }

  async startOnlineTest(onlineTestId: string): Promise<OnlineTest> {
    const onlineTest = await this.prisma.onlineTest.findUnique({
      where: { id: onlineTestId },
    });

    if (!onlineTest) {
      throw new Error('Online test not found');
    }

    const participants = JSON.parse(onlineTest.participants as string);
    const validParticipants = participants.filter(
      (participant: IParticipant) =>
        participant.firstName && participant.lastName,
    );

    if (validParticipants.length === 0) {
      throw new Error('No valid participants found');
    }

    return this.prisma.onlineTest.update({
      where: { id: onlineTestId },
      data: {
        participants: JSON.stringify(validParticipants),
        startedAt: new Date(),
      },
    });
  }

  async finishOnlineTest(onlineTestId: string): Promise<OnlineTest> {
    const onlineTest = await this.prisma.onlineTest.update({
      where: { id: onlineTestId },
      data: { finishedAt: new Date() },
    });
    return onlineTest;
  }

  async getOnlineTestResults(onlineTestId: string): Promise<OnlineTest> {
    const onlineTest = await this.prisma.onlineTest.findUnique({
      where: { id: onlineTestId },
    });
    return onlineTest;
  }

  async updateOnlineTest(
    onlineTestId: string,
    data: Prisma.OnlineTestUpdateInput,
  ): Promise<OnlineTest> {
    return this.prisma.onlineTest.update({
      where: { id: onlineTestId },
      data,
    });
  }

  async updateOnlineTestResults(
    onlineTestId: string,
    results: any,
  ): Promise<OnlineTest> {
    return this.prisma.onlineTest.update({
      where: { id: onlineTestId },
      data: { results: JSON.stringify(results) },
    });
  }

  async deleteOnlineTest(onlineTestId: string): Promise<OnlineTest> {
    const onlineTest = await this.prisma.onlineTest.delete({
      where: { id: onlineTestId },
    });
    return onlineTest;
  }

  async addParticipantToOnlineTest(
    testId: string,
    participant: IParticipant,
  ): Promise<OnlineTest> {
    const onlineTest = await this.prisma.onlineTest.findUnique({
      where: { testId },
    });
    if (!onlineTest) {
      throw new Error('Online test not found');
    }
    const participants = JSON.parse(onlineTest?.participants as string);
    participants.push(participant);
    return this.prisma.onlineTest.update({
      where: { testId },
      data: { participants: JSON.stringify(participants) },
    });
  }

  async updateParticipantData(
    onlineTestId: string,
    participant: IParticipant,
  ): Promise<OnlineTest> {
    const onlineTest = await this.prisma.onlineTest.findUnique({
      where: { id: onlineTestId },
    });
    if (!onlineTest) {
      throw new Error('Online test not found');
    }
    const participants = JSON.parse(onlineTest?.participants as string);
    participants.map((p: IParticipant) => {
      if (p.clientId === participant.clientId) {
        p.firstName = participant.firstName;
        p.lastName = participant.lastName;
        p.email = participant.email;
        p.status = participant.status;
      }
    });
    return this.prisma.onlineTest.update({
      where: { id: onlineTestId },
      data: { participants: JSON.stringify(participants) },
    });
  }

  async removeParticipantFromOnlineTest(
    onlineTestId: string,
    participant: IParticipant,
  ): Promise<OnlineTest> {
    const onlineTest = await this.prisma.onlineTest.findUnique({
      where: { id: onlineTestId },
    });
    if (!onlineTest) {
      throw new Error('Online test not found');
    }
    const participants = JSON.parse(onlineTest?.participants as string);
    participants.splice(participants.indexOf(participant), 1);
    return this.prisma.onlineTest.update({
      where: { id: onlineTestId },
      data: { participants: JSON.stringify(participants) },
    });
  }

  async getAllOnlineTests(): Promise<IOnlineTestListResponse[]> {
    return this.prisma.onlineTest.findMany({
      select: {
        id: true,
        testId: true,
        tempCodeId: true,
        startedAt: true,
        finishedAt: true,
        participants: true,
        createdAt: true,
        updatedAt: true,
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }
}
