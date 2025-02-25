import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Users, BarChart3, ChevronDown, ChevronUp, Download, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import * as XLSX from 'xlsx';

const AdminDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const data = await api.getQuizzes();
      setQuizzes(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuizDetails = (quizId: string) => {
    setExpandedQuiz(expandedQuiz === quizId ? null : quizId);
  };

  const handleDelete = async (quizId: string) => {
    try {
      await api.deleteQuiz(quizId);
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      setDeletingQuiz(null);
      setExpandedQuiz(null);
    } catch (err) {
      setError('Failed to delete quiz');
    }
  };

  const calculateTotalMarks = (quiz: any) => {
    return quiz.questions.reduce((sum: number, q: any) => sum + q.marks, 0);
  };

  const exportToExcel = (quiz: any) => {
    const totalMarks = calculateTotalMarks(quiz);
    
    // Prepare data for the summary sheet
    const summaryData = [
      ['Quiz Summary'],
      ['Title', quiz.title],
      ['Total Questions', quiz.questions.length],
      ['Total Marks', totalMarks],
      ['Total Attempts', quiz.attempts || 0],
      ['Average Score', `${quiz.averageScore || 0}/${totalMarks}`],
      [],
      ['Questions Breakdown'],
      ['Question', 'Marks', 'Options', 'Correct Answer']
    ];

    // Add questions data
    quiz.questions.forEach((q: any) => {
      summaryData.push([
        q.text,
        q.marks,
        q.options.join(' | '),
        `Option ${q.correctAnswer + 1}`
      ]);
    });

    // Prepare data for the responses sheet
    const responsesData = [
      ['Student Responses'],
      ['Username', 'Score', 'Status', 'Date']
    ];

    // Add responses data
    if (quiz.responses) {
      quiz.responses.forEach((response: any) => {
        responsesData.push([
          response.username,
          `${response.score}/${totalMarks}`,
          response.completed ? 'Completed' : 'In Progress',
          new Date(response.createdAt).toLocaleDateString()
        ]);
      });
    }

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new();
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Quiz Summary');
    
    const responsesWs = XLSX.utils.aoa_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(wb, responsesWs, 'Responses');

    // Auto-size columns
    const summaryRange = XLSX.utils.decode_range(summaryWs['!ref'] || 'A1');
    const responsesRange = XLSX.utils.decode_range(responsesWs['!ref'] || 'A1');

    summaryWs['!cols'] = Array(summaryRange.e.c + 1).fill({ wch: 20 });
    responsesWs['!cols'] = Array(responsesRange.e.c + 1).fill({ wch: 20 });

    // Generate Excel file
    XLSX.writeFile(wb, `${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            to="/admin/quiz/create"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create New Quiz
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {quizzes.map((quiz) => {
            const totalMarks = calculateTotalMarks(quiz);
            return (
              <div
                key={quiz.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {quiz.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {quiz.questions.length} Questions • Total Marks: {totalMarks}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToExcel(quiz)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        title="Export to Excel"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </button>
                      <Link
                        to={`/admin/quiz/edit/${quiz.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeletingQuiz(quiz.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {quiz.attempts || 0} Attempts
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Avg. Score: {quiz.averageScore || 0}/{totalMarks}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleQuizDetails(quiz.id)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {expandedQuiz === quiz.id ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show Details
                      </>
                    )}
                  </button>

                  {expandedQuiz === quiz.id && quiz.responses && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Attempt Details</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Score
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {quiz.responses.map((response: any) => (
                              <tr key={response.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {response.username}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {response.score !== undefined ? `${response.score}/${totalMarks}` : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(response.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      response.completed
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {response.completed ? 'Completed' : 'In Progress'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation Modal */}
                {deletingQuiz === quiz.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Delete Quiz
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
                      </p>
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setDeletingQuiz(null)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Delete Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;