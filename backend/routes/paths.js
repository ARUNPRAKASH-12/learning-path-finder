import express from 'express';
import { protect } from '../middleware/auth.js';
import LearningPath from '../models/LearningPath.js';

const router = express.Router();

// @desc    Get user's learning paths
// @route   GET /api/paths
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const paths = await LearningPath.find({ user: req.user.id }).populate('modules.resources');
    
    res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get user's completed learning paths
// @route   GET /api/paths/completed
// @access  Private
router.get('/completed', protect, async (req, res) => {
  try {
    const paths = await LearningPath.find({ 
      user: req.user.id, 
      status: 'completed' 
    }).populate('modules.resources');
    
    res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new learning path
// @route   POST /api/paths
// @access  Private  
router.post('/', protect, async (req, res) => {
  try {
    console.log('Creating learning path for user:', req.user.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const path = await LearningPath.create({
      user: req.user.id,
      ...req.body
    });
    
    console.log('Learning path created successfully:', path);
    
    res.status(201).json({
      success: true,
      data: path
    });
  } catch (error) {
    console.error('Error creating learning path:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update learning path
// @route   PUT /api/paths/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    
    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }
    
    // Make sure the user owns this learning path
    if (path.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this learning path'
      });
    }
    
    const updatedPath = await LearningPath.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    console.log('Learning path updated successfully:', updatedPath);
    
    res.json({
      success: true,
      data: updatedPath
    });
  } catch (error) {
    console.error('Error updating learning path:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete learning path
// @route   DELETE /api/paths/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    
    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }
    
    // Make sure the user owns this learning path
    if (path.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this learning path'
      });
    }
    
    await LearningPath.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Learning path deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting learning path:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
