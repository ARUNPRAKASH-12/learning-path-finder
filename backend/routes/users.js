import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import LearningPath from '../models/LearningPath.js';
import { getProgressAnalytics } from '../controllers/userController.js';

const router = express.Router();

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      // Ensure profile exists
      if (!user.profile) {
        user.profile = {
          skills: [],
          experience: 'beginner',
          goals: [],
          preferences: {
            learningStyle: '',
            timeCommitment: ''
          }
        };
      }

      // Update fields with validation
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      // Update profile fields
      if (req.body.bio !== undefined) {
        user.profile.bio = req.body.bio;
      }
      if (req.body.location !== undefined) {
        user.profile.location = req.body.location;
      }
      
      // Handle skills array
      user.profile.skills = Array.isArray(req.body.skills) ? req.body.skills : (user.profile.skills || []);
      
      // Handle experience as enum
      if (req.body.experience && ['beginner', 'intermediate', 'advanced'].includes(req.body.experience)) {
        user.profile.experience = req.body.experience;
      }
      
      // Handle goals array
      user.profile.goals = Array.isArray(req.body.goals) ? req.body.goals : (user.profile.goals || []);
      
      // Handle preferences object with specific fields
      if (req.body.preferences) {
        user.profile.preferences = {
          learningStyle: req.body.preferences.learningStyle || user.profile.preferences.learningStyle || '',
          timeCommitment: req.body.preferences.timeCommitment || user.profile.preferences.timeCommitment || ''
        };
      }

      const updatedUser = await user.save();
      
      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          bio: updatedUser.profile.bio,
          location: updatedUser.profile.location,
          profile: updatedUser.profile
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get user progress analytics with AI insights
// @route   GET /api/users/progress-analytics
// @access  Private
router.get('/progress-analytics', protect, getProgressAnalytics);

// @desc    Delete user account permanently
// @route   DELETE /api/users/delete-account
// @access  Private
router.delete('/delete-account', protect, async (req, res) => {
  try {
    console.log('Delete account request received');
    console.log('User ID:', req.user.id);
    
    const userId = req.user.id;
    
    // Find the user first to ensure they exist
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found:', user.email);

    // Delete all related data first
    try {
      // Delete user's progress records
      const progressDeleted = await Progress.deleteMany({ userId: userId });
      console.log('Progress records deleted:', progressDeleted.deletedCount);
      
      // Delete user's learning paths
      const pathsDeleted = await LearningPath.deleteMany({ user: userId });
      console.log('Learning paths deleted:', pathsDeleted.deletedCount);
      
      // Note: In a production app, you might also want to:
      // - Delete quiz attempts, assessments, etc.
      // - Handle any shared resources appropriately
      // - Send deletion confirmation email
      // - Log the deletion for audit purposes
      
    } catch (cleanupError) {
      console.error('Error during data cleanup:', cleanupError);
      // Continue with user deletion even if cleanup partially fails
    }

    // Delete the user account
    const userDeleted = await User.findByIdAndDelete(userId);
    console.log('User deleted:', userDeleted ? 'success' : 'failed');
    
    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account. Please try again.'
    });
  }
});

export default router;
