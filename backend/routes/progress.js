import express from "express";
import Progress from "../models/Progress.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user.id });
    console.log('Progress query result for user', req.user.id, ':', progress);
    res.json({ 
      success: true, 
      data: progress 
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

router.get("/:learningPathId", protect, async (req, res) => {
  try {
    const { learningPathId } = req.params;
    
    // First try to find the main learning path progress
    let progress = await Progress.findOne({ 
      userId: req.user.id, 
      learningPathId: learningPathId 
    });
    
    // If no main progress, get individual task progress
    if (!progress) {
      const taskProgress = await Progress.find({ 
        userId: req.user.id, 
        domain: { $exists: true },
        taskId: { $exists: true }
      });
      
      // Convert to the format expected by frontend
      const completedTasks = {};
      let currentDay = 1;
      let maxDay = 1;
      
      taskProgress.forEach(task => {
        if (task.taskId) {
          completedTasks[task.taskId] = {
            completed: task.state === 'complete' || task.state === 'completed',
            completedAt: task.completedAt || task.updatedAt,
            timeSpent: task.timeSpent || 0
          };
          if (task.day && task.day > maxDay) {
            maxDay = task.day;
            if (task.state === 'complete' || task.state === 'completed') {
              currentDay = Math.min(task.day + 1, maxDay);
            }
          }
        }
      });
      
      progress = {
        learningPathId,
        currentDay,
        totalDays: maxDay,
        completedTasks,
        overallProgress: Object.values(completedTasks).filter(t => t.completed).length / Object.keys(completedTasks).length * 100 || 0
      };
    }
    
    res.json({ 
      success: true, 
      data: progress 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST /api/progress/update - Update learning path progress
router.post("/update", protect, async (req, res) => {
  try {
    const { learningPathId, domain, currentDay, totalDays, completedTasks, overallProgress } = req.body;
    console.log('Updating progress for user', req.user.id, 'with data:', { learningPathId, domain, currentDay, totalDays, completedTasks, overallProgress });
    
    const progress = await Progress.findOneAndUpdate(
      { userId: req.user.id, learningPathId: learningPathId },
      { 
        domain,
        currentDay,
        totalDays,
        completedTasks: completedTasks || {},
        overallProgress: overallProgress || 0,
        updatedAt: Date.now() 
      },
      { upsert: true, new: true }
    );
    
    console.log('Progress saved:', progress);
    res.json({ 
      success: true, 
      data: progress,
      message: "Progress updated successfully" 
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST /api/progress/complete
router.post("/complete", protect, async (req, res) => {
  // req.body: { resourceId }
  await Progress.findOneAndUpdate(
    { userId: req.user.id, resourceId: req.body.resourceId },
    { state: "complete", updatedAt: Date.now() },
    { upsert: true }
  );
  res.json({ message: "Marked as complete" });
});

// POST /api/progress/complete-task
router.post("/complete-task", protect, async (req, res) => {
  try {
    // req.body: { domain, day, taskIndex, taskId, learningPathId }
    const { domain, day, taskIndex, taskId, learningPathId } = req.body;
    
    // Update individual task progress (for backward compatibility)
    await Progress.findOneAndUpdate(
      { userId: req.user.id, taskId: taskId },
      { 
        state: "complete", 
        domain: domain,
        day: day,
        taskIndex: taskIndex,
        learningPathId: learningPathId,
        completedAt: new Date(),
        updatedAt: Date.now() 
      },
      { upsert: true }
    );
    
    // Also update the main learning path progress if provided
    if (learningPathId) {
      const existingProgress = await Progress.findOne({ 
        userId: req.user.id, 
        learningPathId: learningPathId 
      });
      
      if (existingProgress) {
        const completedTasks = existingProgress.completedTasks || new Map();
        completedTasks.set(taskId, {
          completed: true,
          completedAt: new Date(),
          timeSpent: 0
        });
        
        existingProgress.completedTasks = completedTasks;
        existingProgress.updatedAt = new Date();
        await existingProgress.save();
      }
    }
    
    res.json({ 
      success: true, 
      message: "Task marked as complete" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;
