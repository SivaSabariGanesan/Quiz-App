import axios from 'axios';
import type { Quiz, UserResponse, QuizWithResponses } from '../types';

const API_URL = 'http://localhost:5000/api';

// Helper function to convert MongoDB _id to string id
const convertId = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;

  const converted = { ...obj };
  
  if (obj._id) {
    converted.id = typeof obj._id === 'string' ? obj._id : obj._id.toString();
    delete converted._id;
  }

  // Handle nested objects with _id
  Object.keys(converted).forEach(key => {
    if (Array.isArray(converted[key])) {
      converted[key] = converted[key].map((item: any) => convertId(item));
    } else if (converted[key] && typeof converted[key] === 'object') {
      converted[key] = convertId(converted[key]);
    }
  });

  return converted;
};

// Helper function to sanitize MongoDB documents
const sanitizeDocument = <T extends object>(doc: any): T => {
  if (!doc) return doc;

  // Handle arrays
  if (Array.isArray(doc)) {
    return doc.map(item => sanitizeDocument<any>(item)) as unknown as T;
  }

  // Handle objects
  const sanitized = convertId(doc);

  return sanitized as T;
};

const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    throw new Error(message);
  }
  throw new Error('Network error occurred');
};

export const api = {
  startQuiz: async (username: string, quizId: string): Promise<{ accessCode: string }> => {
    try {
      const response = await axios.post(`${API_URL}/start-quiz`, { username, quizId });
      return sanitizeDocument<{ accessCode: string }>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getQuiz: async (accessCode: string): Promise<QuizWithResponses> => {
    try {
      const response = await axios.get(`${API_URL}/quiz/${accessCode}`);
      return sanitizeDocument<QuizWithResponses>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  submitAnswer: async (accessCode: string, questionId: string, selectedOption: number): Promise<{ success: boolean }> => {
    try {
      const response = await axios.post(`${API_URL}/submit-answer`, {
        accessCode,
        questionId,
        selectedOption
      });
      return sanitizeDocument<{ success: boolean }>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  submitQuiz: async (accessCode: string): Promise<{ score: number }> => {
    try {
      const response = await axios.post(`${API_URL}/submit-quiz`, { accessCode });
      return sanitizeDocument<{ score: number }>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Admin endpoints
  getQuizzes: async (): Promise<Quiz[]> => {
    try {
      const response = await axios.get(`${API_URL}/admin/quizzes`);
      const data = response.data || [];
      return Array.isArray(data) ? sanitizeDocument<Quiz[]>(data) : [];
    } catch (error) {
      // Return empty array instead of throwing for better UX
      console.error('Failed to fetch quizzes:', error);
      return [];
    }
  },

  createQuiz: async (quizData: Omit<Quiz, 'id'>): Promise<Quiz> => {
    try {
      const response = await axios.post(`${API_URL}/admin/quizzes`, quizData);
      return sanitizeDocument<Quiz>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateQuiz: async (id: string, quizData: Partial<Quiz>): Promise<Quiz> => {
    try {
      const response = await axios.put(`${API_URL}/admin/quizzes/${id}`, quizData);
      return sanitizeDocument<Quiz>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteQuiz: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await axios.delete(`${API_URL}/admin/quizzes/${id}`);
      return sanitizeDocument<{ message: string }>(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  }
};