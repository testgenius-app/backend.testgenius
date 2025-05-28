import { Injectable } from '@nestjs/common';
import { OnlineTest } from '@prisma/client';
import { OnlineTestRepository } from './online-test.repository';
import { CreateOnlineTestDto } from './dto/create-online-test.dto';
import { IParticipantScore } from '../../gateways/online-test/types/online-test.types';

export interface IParticipant {
  clientId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status: 'pending' | 'active' | 'waiting' | 'ready' | 'in_progress' | 'waiting_results' | 'completed';
  score?: IParticipantScore;
}

@Injectable()
export class OnlineTestService {
  constructor(private readonly onlineTestRepository: OnlineTestRepository) {}

  private sanitizeTestData(test: any) {
    if (!test) return null;

    const sanitizedTest = {
      ...test,
      sections: test.sections?.map(section => ({
        ...section,
        tasks: section.tasks?.map(task => ({
          ...task,
          questions: task.questions?.map(question => ({
            id: question.id,
            questionText: question.questionText,
            options: question.options,
            expectedResponseFormat: question.expectedResponseFormat,
            score: question.score,
            imageUrl: question.imageUrl,
            audioUrl: question.audioUrl,
            labelLocationX: question.labelLocationX,
            labelLocationY: question.labelLocationY,
            // Excluding answers, acceptableAnswers, answerKeywords, and explanation
          }))
        }))
      }))
    };

    return sanitizedTest;
  }

  async _createOnlineTest(
    createOnlineTestDto: CreateOnlineTestDto,
  ): Promise<OnlineTest> {
    return this.onlineTestRepository.createOnlineTest(createOnlineTestDto);
  }

  async _getOnlineTestByTestId(testId: string, includeAnswers: boolean = false) {
    const test = await this.onlineTestRepository.getOnlineTestByTestId(testId);
    if (test?.test && !includeAnswers) {
      test.test = this.sanitizeTestData(test.test);
    }
    return test;
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

  async _updateOnlineTest(onlineTestId: string, data: any): Promise<OnlineTest> {
    return this.onlineTestRepository.updateOnlineTest(onlineTestId, data);
  }

  async _updateOnlineTestResults(
    onlineTestId: string,
    results: any,
  ): Promise<OnlineTest> {
    return this.onlineTestRepository.updateOnlineTestResults(
      onlineTestId,
      results,
    );
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
