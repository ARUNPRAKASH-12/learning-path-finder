import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    skills: [String],
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    goals: [String],
    bio: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    preferences: {
      learningStyle: String,
      timeCommitment: String
    }
  },
  assessments: [{
    assessmentId: String,
    generatedAt: Date,
    status: {
      type: String,
      enum: ['generated', 'in_progress', 'completed'],
      default: 'generated'
    },
    domain: String,
    skillLevel: String
  }],
  assessmentHistory: [{
    assessmentId: String,
    completedAt: Date,
    score: Number,
    totalScore: Number,
    percentage: Number,
    grade: String,
    timeSpent: Number,
    passed: Boolean,
    correctAnswers: Number,
    totalQuestions: Number,
    domain: String,
    difficulty: String,
    subject: String,
    aiAnalysis: {
      overallPerformance: String,
      keyInsights: [String],
      strengths: [String],
      weaknesses: [String],
      learningPattern: String,
      timeManagement: String
    },
    recommendations: [String],
    detailedResults: [{
      questionId: Number,
      question: String,
      userAnswer: Number,
      correctAnswer: Number,
      isCorrect: Boolean,
      explanation: String,
      points: Number,
      maxPoints: Number,
      difficulty: String
    }]
  }],
  skillsProgress: {
    type: Map,
    of: {
      level: String,
      lastAssessment: Number,
      assessmentsCompleted: Number,
      averageScore: Number,
      lastUpdated: Date
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);