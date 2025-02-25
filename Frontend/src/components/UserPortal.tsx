import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Medal, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';

const UserPortal: React.FC = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await api.getQuiz(accessCode!);
        setResult(data);
      } catch (error) {
        console.error('Failed to fetch result:', error);
      } finally {
        setLoading(false);
      }
    };

    if (accessCode) {
      fetchResult();
    }
  }, [accessCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <p className="text-red-600">Result not found</p>
        </div>
      </div>
    );
  }

  const totalMarks = result.quiz.questions.reduce((sum: number, q: any) => sum + q.marks, 0);
  const score = result.userResponse.score || 0;
  const percentage = Math.round((score / totalMarks) * 100);

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { text: 'Excellent!', color: 'text-green-600' };
    if (percentage >= 80) return { text: 'Very Good!', color: 'text-blue-600' };
    if (percentage >= 70) return { text: 'Good', color: 'text-indigo-600' };
    if (percentage >= 60) return { text: 'Fair', color: 'text-yellow-600' };
    return { text: 'Needs Improvement', color: 'text-red-600' };
  };

  const grade = getGrade(percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 animate-fadeIn">
          <div className="flex items-center justify-center mb-8">
            <Medal className={`h-16 w-16 ${percentage >= 70 ? 'text-yellow-400' : 'text-gray-400'}`} />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Quiz Results
          </h1>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8">
              <div className="text-center">
                <p className="text-4xl font-bold mb-2">
                  {score}/{totalMarks}
                </p>
                <div className="relative h-4 bg-gray-200 rounded-full mb-4">
                  <div
                    className="absolute left-0 top-0 h-full bg-indigo-600 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className={`text-2xl font-semibold ${grade.color}`}>
                  {grade.text}
                </p>
                <p className="text-gray-600 mt-2">
                  {percentage}% Score
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">Username</p>
                  <p className="font-medium">{result.userResponse.username}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">Status</p>
                  <p className="font-medium flex items-center">
                    {result.userResponse.completed ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        Incomplete
                      </>
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">Start Time</p>
                  <p className="font-medium">
                    {new Date(result.userResponse.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    {result.quiz.timeLimit} minutes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPortal;