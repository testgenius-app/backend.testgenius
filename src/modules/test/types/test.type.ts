type Task = {
  id: string;
  title: string;
  type: string;
  sectionId: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
};

type Question = {
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
};
type Section = {
  id: string;
  title: string;
  instruction: string;
  type: string;
  contextText?: string;
  contextImage?: string;
  contextAudio?: string;
  contextVideo?: string;
  testId: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
};

export type Test = {
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
  sections: Section[];
};
