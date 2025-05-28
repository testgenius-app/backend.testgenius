import { Injectable, Logger } from '@nestjs/common';
import { IParticipantResult } from '../../../gateways/online-test/types/online-test.types';

@Injectable()
export class AnswerValidationService {
  private readonly logger = new Logger(AnswerValidationService.name);

  private findQuestion(test: any, sectionId: string, taskId: string, questionId: string) {
    const section = test.sections?.find(s => s.id === sectionId);
    if (!section) return null;

    const task = section.tasks?.find(t => t.id === taskId);
    if (!task) return null;

    const question = task.questions?.find(q => q.id === questionId);
    return question || null;
  }

  private validateAnswer(question: any, answer: string): boolean {
    if (!question) return false;

    const trimmedAnswer = answer.trim().toLowerCase();
    
    // Check in answers array
    if (question.answers?.length > 0) {
      return question.answers.some((correctAnswer: string) => 
        correctAnswer.trim().toLowerCase() === trimmedAnswer
      );
    }

    // Check in acceptableAnswers array
    if (question.acceptableAnswers?.length > 0) {
      return question.acceptableAnswers.some((acceptableAnswer: string) => 
        acceptableAnswer.trim().toLowerCase() === trimmedAnswer
      );
    }

    return false;
  }

  calculatePercentage(correctAnswers: number, totalQuestions: number): number {
    if (totalQuestions === 0) return 0;
    return (correctAnswers / totalQuestions) * 100;
  }

  processAnswer(
    test: any,
    participantResult: IParticipantResult,
    sectionId: string,
    taskId: string,
    questionId: string,
    answer: string,
  ): IParticipantResult {
    const now = new Date();
    const question = this.findQuestion(test, sectionId, taskId, questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Initialize section and task if they don't exist
    if (!participantResult.sections[sectionId]) {
      participantResult.sections[sectionId] = {
        tasks: {},
      };
    }
    if (!participantResult.sections[sectionId].tasks[taskId]) {
      participantResult.sections[sectionId].tasks[taskId] = {
        questions: {},
      };
    }

    // Calculate time spent on this question
    const lastInteraction = participantResult.lastInteractionAt 
      ? new Date(participantResult.lastInteractionAt)
      : new Date(participantResult.startedAt);
    const timeSpent = now.getTime() - lastInteraction.getTime();

    // Validate the answer
    const isCorrect = this.validateAnswer(question, answer);

    // Update the question result
    participantResult.sections[sectionId].tasks[taskId].questions[questionId] = {
      answer,
      isCorrect,
      timestamp: now,
      timeSpent,
    };

    // Initialize metrics if they don't exist
    if (!participantResult.metrics) {
      participantResult.metrics = {
        accuracy: 0,
        averageTimePerQuestion: 0,
        performanceTrend: {
          questionIds: [],
          correctness: [],
        },
        totalTimeSpent: 0,
        incorrectAnswersCount: 0,
      };
    }

    // Update counts
    if (isCorrect) {
      participantResult.correctAnswersCount++;
    } else {
      participantResult.metrics.incorrectAnswersCount++;
    }
    participantResult.totalQuestions++;

    // Update performance trend
    participantResult.metrics.performanceTrend.questionIds.push(questionId);
    participantResult.metrics.performanceTrend.correctness.push(isCorrect);

    // Update time metrics
    participantResult.metrics.totalTimeSpent += timeSpent;
    participantResult.metrics.averageTimePerQuestion = 
      participantResult.metrics.totalTimeSpent / participantResult.totalQuestions;

    // Update accuracy
    participantResult.metrics.accuracy = 
      (participantResult.correctAnswersCount / participantResult.totalQuestions) * 100;

    // Update last interaction time
    participantResult.lastInteractionAt = now;

    return participantResult;
  }
} 