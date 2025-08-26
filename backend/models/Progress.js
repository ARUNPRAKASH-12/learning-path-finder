import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  learningPathId: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  currentDay: {
    type: Number,
    default: 1
  },
  totalDays: {
    type: Number,
    default: 1
  },
  completedTasks: {
    type: Map,
    of: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      timeSpent: { type: Number, default: 0 } // in minutes
    },
    default: {}
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Legacy fields for backward compatibility
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Resource"
  },
  taskId: {
    type: String
  },
  day: {
    type: Number
  },
  taskIndex: {
    type: Number
  },
  state: { 
    type: String, 
    enum: ['incomplete', 'in-progress', 'completed', 'complete'],
    default: "incomplete" 
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Index for efficient queries
progressSchema.index({ userId: 1, learningPathId: 1 });
progressSchema.index({ userId: 1, taskId: 1 });

const Progress = mongoose.model("Progress", progressSchema);
export default Progress;
