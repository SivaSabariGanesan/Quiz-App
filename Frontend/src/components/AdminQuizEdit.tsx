import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Minus, Save, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import type { Question } from '../types';

const AdminQuizEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizzes = await api.getQuizzes();
        const quiz = quizzes.find((q) => q.id === id);
        if (quiz) {
          setTitle(quiz.title);
          setQuestions(quiz.questions.map(q => ({
            ...q,
            id: q.id || crypto.randomUUID()
          })));
        } else {
          setError('Quiz not found');
        }
      } catch (err) {
        setError('Failed to fetch quiz');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuiz();
    }
  }, [id]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    if (field === 'marks') {
      // Ensure marks is a valid number and at least 1
      const marks = Math.max(1, parseInt(value) || 1);
      updatedQuestions[index] = { ...updatedQuestions[index], marks };
    } else {
      updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    }
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.updateQuiz(id!, { title, questions });
      navigate('/admin');
    } catch (err) {
      setError('Failed to update quiz');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Quiz</h1>
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {questions.map((question, questionIndex) => (
            <div key={question.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Question {questionIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center mb-2">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                        className="mr-2"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Option ${optionIndex + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marks
                  </label>
                  <input
                    type="number"
                    value={question.marks.toString()}
                    onChange={(e) => updateQuestion(questionIndex, 'marks', e.target.value)}
                    className="w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Question
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminQuizEdit;