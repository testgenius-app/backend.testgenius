import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateOnlineTestDto } from './dto/create-online-test.dto';
import { OnlineTest } from '@prisma/client';
import { IParticipant } from './online-test.service';

@Injectable()
export class OnlineTestRepository implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.onlineTest.deleteMany({});
    await this.prisma.testTempCode.deleteMany({});
    await this.prisma.test.deleteMany({});
    await this.prisma.verificationCode.deleteMany({});
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

  getOnlineTestByTestId(testId: string) {
    return this.prisma.onlineTest.findFirst({
      where: { test: { id: testId } },
      include: { test: { include: { owner: true } } },
    });
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
}
