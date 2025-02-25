export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  attempts?: number;
  averageScore?: number;
  timeLimit?: number; // Time limit in minutes
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

export interface UserResponse {
  id: string;
  username: string;
  quizId: string;
  accessCode: string;
  responses: Answer[];
  score?: number;
  completed: boolean;
  createdAt: string;
  startTime: string;
  endTime?: string;
}

export interface Answer {
  questionId: string;
  selectedOption: number;
}

export interface QuizWithResponses {
  quiz: Quiz;
  userResponse: UserResponse;
}