import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
    analyzeDomain,
    getSkillResources,
    generateDailyTasks,
    submitFeedback
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/analyze-domain', protect, analyzeDomain);
router.post('/skill-resources', protect, getSkillResources);
router.post('/generate-daily-tasks', protect, generateDailyTasks);
// Add a test endpoint without auth
router.post('/feedback-test', (req, res) => {
    console.log('Test feedback endpoint reached');
    res.json({ success: true, message: 'Test endpoint working' });
});
// Re-enable auth for feedback
router.post('/feedback', protect, submitFeedback);

export default router;
