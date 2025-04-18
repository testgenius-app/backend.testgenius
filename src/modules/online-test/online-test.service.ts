import { Injectable } from '@nestjs/common';
import { OnlineTest } from '@prisma/client';
import { OnlineTestRepository } from './online-test.repository';
import { CreateOnlineTestDto } from './dto/create-online-test.dto';

export interface IParticipant {
  clientId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
}

@Injectable()
export class OnlineTestService {
  constructor(private readonly onlineTestRepository: OnlineTestRepository) {}

  async _createOnlineTest(
    createOnlineTestDto: CreateOnlineTestDto,
  ): Promise<OnlineTest> {
    return this.onlineTestRepository.createOnlineTest(createOnlineTestDto);
  }

  async _getOnlineTestByTestId(testId: string) {
    return this.onlineTestRepository.getOnlineTestByTestId(testId);
  }

  async _getOnlineTestByTempCodeId(tempCodeId: string): Promise<OnlineTest> {
    return this.onlineTestRepository.getOnlineTestByTempCodeId(tempCodeId);
  }

  async _startOnlineTest(onlineTestId: string): Promise<OnlineTest> {
    return this.onlineTestRepository.startOnlineTest(onlineTestId);
  }

  async _finishOnlineTest(onlineTestId: string): Promise<OnlineTest> {
    return this.onlineTestRepository.finishOnlineTest(onlineTestId);
  }

  async _getOnlineTestResults(onlineTestId: string): Promise<OnlineTest> {
    return this.onlineTestRepository.getOnlineTestResults(onlineTestId);
  }

  async _deleteOnlineTest(onlineTestId: string): Promise<OnlineTest> {
    return this.onlineTestRepository.deleteOnlineTest(onlineTestId);
  }

  async _addParticipantToOnlineTest(
    onlineTestId: string,
    participant: IParticipant,
  ): Promise<OnlineTest> {
    return this.onlineTestRepository.addParticipantToOnlineTest(
      onlineTestId,
      participant,
    );
  }

  async _updateParticipantData(
    onlineTestId: string,
    participant: IParticipant,
  ): Promise<OnlineTest> {
    return this.onlineTestRepository.updateParticipantData(
      onlineTestId,
      participant,
    );
  }

  async _removeParticipantFromOnlineTest(
    onlineTestId: string,
    participant: IParticipant,
  ): Promise<OnlineTest> {
    return this.onlineTestRepository.removeParticipantFromOnlineTest(
      onlineTestId,
      participant,
    );
  }
}
