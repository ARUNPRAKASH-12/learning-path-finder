import mongoose from 'mongoose';

const learningPathSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'professional'],
    required: true
  },
  estimatedDuration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'weeks'
    }
  },
  modules: [{
    title: String,
    description: String,
    resources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    }],
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    order: Number
  }],
  tags: [String],
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  finalProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Additional fields for frontend compatibility and dashboard display
  domain: String, // For dashboard display
  level: String, // For dashboard display
  skills: [String], // Selected skills for this learning path
  completedModules: {
    type: Number,
    default: 0
  },
  currentDay: {
    type: Number,
    default: 1
  },
  totalDays: {
    type: Number,
    default: 30
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  userId: String // Additional user reference for filtering
}, {
  timestamps: true
});

export default mongoose.model('LearningPath', learningPathSchema);