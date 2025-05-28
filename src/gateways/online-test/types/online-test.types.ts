export interface IAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timestamp: Date;
}

export interface IQuestionResult {
  answer: string;
  isCorrect: boolean;
  timestamp: Date;
  timeSpent: number;
}

export interface ITaskResult {
  questions: {
    [key: string]: IQuestionResult;
  };
}

export interface ISectionResult {
  tasks: {
    [key: string]: ITaskResult;
  };
}

export interface IParticipantMetrics {
  accuracy: number;
  averageTimePerQuestion: number;
  performanceTrend: {
    questionIds: string[];
    correctness: boolean[];
  };
  totalTimeSpent: number;
  incorrectAnswersCount: number;
}

export interface IParticipantResult {
  participantId: string;
  sections: {
    [key: string]: ISectionResult;
  };
  correctAnswersCount: number;
  totalQuestions: number;
  startedAt: Date;
  lastInteractionAt: Date;
  metrics: IParticipantMetrics;
}

export interface IParticipantScore {
  totalScore: number;
  totalQuestions: number;
  percentage: number;
}

export interface IParticipant {
  clientId: string;
  userId: string;
  status: 'waiting' | 'ready' | 'in_progress' | 'waiting_results' | 'completed';
  score?: IParticipantScore;
}

export interface IOnlineTestResults {
  results: {
    [key: string]: IParticipantResult;
  };
  lastUpdated: Date;
}

export interface IAnswerValidation {
  questionId: string;
  answers: string[];
  acceptableAnswers: string[];
}

export interface ITaskValidation {
  id: string;
  title: string;
  type: string;
  sectionId: string;
  questions: Array<{
    id: string;
    questionText: string;
    options: string[];
    answers: string[];
    acceptableAnswers: string[];
    answerKeywords: string[];
    expectedResponseFormat: string;
    score?: number;
    explanation: string;
    imageUrl?: string;
    audioUrl?: string;
    labelLocationX?: number;
    labelLocationY?: number;
    taskId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISectionValidation {
  id: string;
  title: string;
  instruction: string;
  type: string;
  contextText?: string;
  contextImage?: string;
  contextAudio?: string;
  contextVideo?: string;
  testId: string;
  tasks: ITaskValidation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestValidation {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string;
  tags: string[];
  sectionCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  sections: ISectionValidation[];
} 