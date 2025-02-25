import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserEntry from './components/UserEntry';
import QuizComponent from './components/QuizComponent';
import QuizJoin from './components/Quizjoin';
import UserPortal from './components/UserPortal';
import AdminDashboard from './components/AdminDashboard';
import AdminQuizCreate from './components/AdminQuizCreate';
import AdminQuizEdit from './components/AdminQuizEdit';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserEntry />} />
        <Route path="/quiz/:username" element={<QuizComponent />} />
        <Route path="/quiz/join/:quizId" element={<QuizJoin />} />
        <Route path="/results/:accessCode" element={<UserPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/quiz/create" element={<AdminQuizCreate />} />
        <Route path="/admin/quiz/edit/:id" element={<AdminQuizEdit />} />
      </Routes>
    </Router>
  );
}

export default App;