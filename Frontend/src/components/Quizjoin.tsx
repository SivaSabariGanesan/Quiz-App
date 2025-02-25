import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { api } from '../services/api';
import type { Quiz } from '../types';

const QuizJoin: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizzes = await api.getQuizzes();
        const foundQuiz = quizzes.find(q => q.id === quizId);
        if (foundQuiz) {
          setQuiz(foundQuiz);
        } else {
          setError('Quiz not found');
        }
      } catch (err) {
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !quizId) return;

    try {
      const { accessCode } = await api.startQuiz(username, quizId);
      navigate(`/quiz/${encodeURIComponent(username)}?accessCode=${accessCode}`);
    } catch (err) {
      setError('Failed to join quiz');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <p className="text-red-600">{error || 'Quiz not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <UserPlus className="h-12 w-12 text-indigo-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Join Quiz
        </h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {quiz.title}
          </h2>
          <p className="text-gray-600">
            {quiz.questions?.length || 0} Questions
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your name to begin
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Your name"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Join Quiz
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizJoin;