import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://quiz-system:quizpass123@cluster0.mongodb.net/quiz-system?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Schemas
const quizSchema = new mongoose.Schema({
  title: String,
  questions: [{
    text: String,
    options: [String],
    correctAnswer: {
      type: Number,
      min: 0,
      max: 3
    },
    marks: {
      type: Number,
      min: 1,
      max: 10,
      validate: {
        validator: Number.isInteger,
        message: 'Marks must be a whole number'
      }
    }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userResponseSchema = new mongoose.Schema({
  username: String,
  quizId: String,
  accessCode: String,
  responses: [{
    questionId: String,
    selectedOption: Number
  }],
  score: {
    type: Number,
    min: 0
  },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);
const UserResponse = mongoose.model('UserResponse', userResponseSchema);

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

// Admin Routes
app.get('/api/admin/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    
    // Calculate statistics for each quiz
    const quizzesWithStats = await Promise.all(quizzes.map(async (quiz) => {
      const responses = await UserResponse.find({ quizId: quiz._id, completed: true });
      const attempts = responses.length;
      const totalScore = responses.reduce((sum, r) => sum + (r.score || 0), 0);
      const averageScore = attempts > 0 ? Math.round((totalScore / attempts) * 100) / 100 : 0;
      
      return {
        ...quiz.toObject(),
        attempts,
        averageScore
      };
    }));

    res.json(quizzesWithStats);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/quizzes', async (req, res) => {
  try {
    // Validate marks for each question
    const invalidMarks = req.body.questions.some(q => !Number.isInteger(q.marks) || q.marks < 1 || q.marks > 10);
    if (invalidMarks) {
      return res.status(400).json({ error: 'Marks must be whole numbers between 1 and 10' });
    }

    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/quizzes/:id', async (req, res) => {
  try {
    // Validate marks for each question
    const invalidMarks = req.body.questions.some(q => !Number.isInteger(q.marks) || q.marks < 1 || q.marks > 10);
    if (invalidMarks) {
      return res.status(400).json({ error: 'Marks must be whole numbers between 1 and 10' });
    }

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    // Delete all associated user responses
    await UserResponse.deleteMany({ quizId: req.params.id });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// User Routes
app.post('/api/start-quiz', async (req, res) => {
  const { username, quizId } = req.body;
  const accessCode = nanoid(10);

  try {
    const userResponse = new UserResponse({
      username,
      quizId,
      accessCode,
      responses: []
    });
    await userResponse.save();
    res.json({ accessCode });
  } catch (error) {
    next(error);
  }
});

app.get('/api/quiz/:accessCode', async (req, res) => {
  try {
    const userResponse = await UserResponse.findOne({ accessCode: req.params.accessCode });
    if (!userResponse) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    const quiz = await Quiz.findById(userResponse.quizId);
    res.json({ quiz, userResponse });
  } catch (error) {
    next(error);
  }
});

app.post('/api/submit-answer', async (req, res) => {
  const { accessCode, questionId, selectedOption } = req.body;

  try {
    const userResponse = await UserResponse.findOne({ accessCode });
    if (!userResponse) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    // Remove any previous answer for this question
    userResponse.responses = userResponse.responses.filter(r => r.questionId !== questionId);
    
    // Add the new answer
    userResponse.responses.push({ questionId, selectedOption });
    await userResponse.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/submit-quiz', async (req, res) => {
  const { accessCode } = req.body;

  try {
    const userResponse = await UserResponse.findOne({ accessCode });
    if (!userResponse) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    const quiz = await Quiz.findById(userResponse.quizId);
    let score = 0;

    // Calculate score based on correct answers and their marks
    quiz.questions.forEach((question, index) => {
      const response = userResponse.responses.find(r => r.questionId === question._id.toString());
      if (response && response.selectedOption === question.correctAnswer) {
        score += question.marks;
      }
    });

    userResponse.score = score;
    userResponse.completed = true;
    await userResponse.save();

    res.json({ score });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
