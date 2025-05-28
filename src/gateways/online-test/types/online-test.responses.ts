import { Test } from '@prisma/client';
import { IParticipant } from 'src/modules/online-test/online-test.service';
import { IParticipantResult, IOnlineTestResults } from './online-test.types';

export interface IStartTestResponse {
  test: Test;
  tempCode: {
    id: string;
    code: number;
    testId: string;
    createdAt: Date;
    expiresAt: Date;
  };
}

export interface IStartOnlineTestResponse {
  test: any; // TODO: Replace with proper test interface
  durationInMinutes: number;
}

export interface IFinishOnlineTestResponse {
  testId: string;
  results: IOnlineTestResults;
}

export interface IJoinOnlineTestResponse {
  onlineUsers: IParticipant[];
  testId: string;
  test: any; // TODO: Replace with proper test interface
}

export interface ILeaveOnlineTestResponse {
  onlineUsers: IParticipant[];
}

export interface IChangeUserDataResponse {
  onlineUsers: IParticipant[];
  testId: string;
}

export interface ISelectAnswerResponse {
  clientId: string;
  sectionId: string;
  taskId: string;
  questionId: string;
  answer: string;
  correctAnswersCount: number;
  totalQuestions: number;
  percentage: number;
  metrics: {
    accuracy: number;
    averageTimePerQuestion: number;
    performanceTrend: {
      questionIds: string[];
      correctness: boolean[];
    };
    totalTimeSpent: number;
    incorrectAnswersCount: number;
  };
}

export interface IFinishOnlineTestAsParticipantResponse {
  testId: string;
  score?: {
    totalScore: number;
    totalQuestions: number;
    percentage: number;
  };
}

export interface IErrorResponse {
  message: string;
} 