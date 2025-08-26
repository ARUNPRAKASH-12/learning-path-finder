import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'platform',
      'course',
      'documentation',
      'practice',
      'tool',
      'video',
      'article',
      'book',
      'github',
      'tutorial',
      'certification',
      'workshop',
      'webinar',
      'exercise',
      'example',
      'community' // Added community as a valid type
    ],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true
  },
  skill: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Resource = mongoose.model('Resource', ResourceSchema);
export default Resource;
