import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Timer, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { Quiz, Question } from '../types';

const QuizComponent: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accessCode = searchParams.get('accessCode');
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUp = useCallback(async () => {
    if (!accessCode || submitting) return;
    setIsTimeUp(true);
    setSubmitting(true);
    try {
      const result = await api.submitQuiz(accessCode);
      navigate(`/results/${accessCode}`);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  }, [accessCode, submitting, navigate]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!accessCode) {
          throw new Error('No access code provided');
        }
        const data = await api.getQuiz(accessCode);
        if (!data.quiz || !data.quiz.questions) {
          throw new Error('Invalid quiz data');
        }
        setQuiz(data.quiz);
        setAnswers(new Array(data.quiz.questions.length).fill(-1));
        
        // Initialize timer
        if (data.quiz.timeLimit) {
          const startTime = new Date(data.userResponse.startTime).getTime();
          const now = new Date().getTime();
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, data.quiz.timeLimit * 60 - elapsed);
          setTimeLeft(remaining);
        }
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [accessCode]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleTimeUp]);

  const handleAnswer = async (optionIndex: number) => {
    if (!quiz || !accessCode || isTimeUp) return;

    try {
      const questionId = quiz.questions[currentQuestion].id;
      await api.submitAnswer(accessCode, questionId, optionIndex);
      
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentQuestion] = optionIndex;
        return newAnswers;
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError('Failed to save answer. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!accessCode || submitting || isTimeUp) return;

    try {
      setSubmitting(true);
      const result = await api.submitQuiz(accessCode);
      navigate(`/results/${accessCode}`);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !quiz || !quiz.questions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center text-red-600 mb-4">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
            Error Loading Quiz
          </h2>
          <p className="text-red-600 text-center">{error || 'Quiz not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const decodedUsername = decodeURIComponent(username || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {decodedUsername}!
            </h1>
            {timeLeft !== null && (
              <div className={`flex items-center ${timeLeft < 60 ? 'animate-pulse text-red-600' : 'text-gray-600'}`}>
                <Timer className="h-5 w-5 mr-2" />
                <span className="text-lg font-medium">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
              <span>{question.marks} marks</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">{question.text}</h2>
            <div className="space-y-4">
              {question.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={isTimeUp}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 transform hover:scale-102 ${
                    answers[currentQuestion] === index
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    {answers[currentQuestion] === index && (
                      <CheckCircle className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0" />
                    )}
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0 || isTimeUp}
              className="inline-flex items-center px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Previous
            </button>
            {currentQuestion < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={isTimeUp}
                className="inline-flex items-center px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition duration-200"
              >
                Next
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || isTimeUp}
                className="inline-flex items-center px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizComponent;