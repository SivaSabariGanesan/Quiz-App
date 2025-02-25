import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Share2, BookOpen } from 'lucide-react';
import { api } from '../services/api';

const UserEntry: React.FC = () => {
  const [username, setUsername] = useState('');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await api.getQuizzes();
        setQuizzes(Array.isArray(data) ? data : []);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch quizzes:', error);
        setError('Failed to load quizzes. Please try again.');
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleStartQuiz = async (quizId: string) => {
    if (!username.trim()) {
      setError('Please enter your name first');
      return;
    }

    try {
      const { accessCode } = await api.startQuiz(username, quizId);
      navigate(`/quiz/${encodeURIComponent(username)}?accessCode=${accessCode}`);
    } catch (error) {
      console.error('Failed to start quiz:', error);
      setError('Failed to start quiz. Please try again.');
    }
  };

  const handleShare = (quizId: string) => {
    const shareUrl = `${window.location.origin}/quiz/join/${quizId}`;
    navigator.clipboard.writeText(shareUrl).then(
      () => alert('Quiz link copied to clipboard!'),
      () => alert('Failed to copy quiz link')
    );
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }
    if (quizzes.length > 0) {
      handleStartQuiz(quizzes[0].id);
    } else {
      setError('No quizzes available');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-center mb-8">
            <UserPlus className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Welcome to the Quiz System
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleUsernameSubmit} className="mb-8">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your name to begin
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your name"
                required
              />
            </div>
          </form>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Available Quizzes</h2>
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No quizzes available at the moment
              </div>
            ) : (
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-flex items-center mr-4">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {quiz.questions?.length || 0} Questions
                        </span>
                        <span>{quiz.attempts || 0} attempts</span>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleStartQuiz(quiz.id)}
                        disabled={!username.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Start Quiz
                      </button>
                      <button
                        onClick={() => handleShare(quiz.id)}
                        className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                        title="Share Quiz"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEntry;