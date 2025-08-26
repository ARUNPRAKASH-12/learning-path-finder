import express from 'express';
import AssessmentAIService from '../services/assessmentAIService.js';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();
const assessmentAI = new AssessmentAIService();

// Generate AI-powered assessment
router.post('/generate-assessment', protect, async (req, res) => {
  try {
    const { userId, skillLevel = 'intermediate', domain = 'javascript' } = req.body;
    
    console.log('Generating assessment for:', { userId, skillLevel, domain });
    
    // Generate assessment using AI
    const assessmentData = await assessmentAI.generateAssessment(userId, skillLevel, domain);
    
    // Store assessment in user's record (optional - for tracking)
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        if (!user.assessments) user.assessments = [];
        user.assessments.push({
          assessmentId: assessmentData.assessment.id,
          generatedAt: new Date(),
          status: 'generated',
          domain: domain,
          skillLevel: skillLevel
        });
        await user.save();
      }
    } catch (userError) {
      console.log('Note: Could not save assessment to user record:', userError.message);
      // Continue anyway - assessment generation is more important
    }
    
    res.json({
      success: true,
      message: 'Assessment generated successfully',
      ...assessmentData
    });
    
  } catch (error) {
    console.error('Error generating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate assessment',
      error: error.message
    });
  }
});

// Analyze assessment results with AI
router.post('/analyze-assessment', protect, async (req, res) => {
  try {
    const { userId, assessmentId, questions, answers, timeSpent } = req.body;
    
    console.log('Analyzing assessment results for:', { userId, assessmentId, timeSpent });
    
    // Analyze results using AI
    const analysisResults = await assessmentAI.analyzeAssessmentResults(
      userId, 
      assessmentId, 
      questions, 
      answers, 
      timeSpent
    );
    
    // Save results to user's record
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        if (!user.assessmentHistory) user.assessmentHistory = [];
        
        const assessmentResult = {
          assessmentId: assessmentId,
          completedAt: new Date(),
          score: analysisResults.score,
          totalScore: analysisResults.totalScore,
          percentage: analysisResults.percentage,
          grade: analysisResults.grade,
          timeSpent: analysisResults.timeSpent,
          passed: analysisResults.passed,
          correctAnswers: analysisResults.correctAnswers,
          totalQuestions: analysisResults.totalQuestions,
          aiAnalysis: analysisResults.aiAnalysis,
          recommendations: analysisResults.recommendations,
          detailedResults: analysisResults.detailedResults
        };
        
        user.assessmentHistory.push(assessmentResult);
        
        // Update user's overall progress
        if (!user.skillsProgress) user.skillsProgress = {};
        const domain = req.body.domain || 'javascript';
        user.skillsProgress[domain] = {
          level: analysisResults.percentage >= 80 ? 'Advanced' : 
                 analysisResults.percentage >= 60 ? 'Intermediate' : 'Beginner',
          lastAssessment: analysisResults.percentage,
          assessmentsCompleted: (user.skillsProgress[domain]?.assessmentsCompleted || 0) + 1,
          averageScore: calculateAverageScore(user.assessmentHistory, domain),
          lastUpdated: new Date()
        };
        
        await user.save();
        console.log('Assessment results saved to user record');
      }
    } catch (userError) {
      console.log('Note: Could not save results to user record:', userError.message);
      // Continue anyway - analysis is more important than storage
    }
    
    res.json({
      success: true,
      message: 'Assessment analyzed successfully',
      ...analysisResults
    });
    
  } catch (error) {
    console.error('Error analyzing assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze assessment',
      error: error.message
    });
  }
});

// Get user's assessment history
router.get('/history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.assessmentHistory) {
      return res.json({
        success: true,
        history: [],
        message: 'No assessment history found'
      });
    }
    
    // Format history for frontend
    const formattedHistory = user.assessmentHistory.map(assessment => ({
      date: assessment.completedAt.toISOString().split('T')[0],
      score: assessment.score,
      percentage: assessment.percentage,
      totalQuestions: assessment.totalQuestions,
      correctAnswers: assessment.correctAnswers,
      timeSpent: assessment.timeSpent,
      difficulty: assessment.difficulty || 'Intermediate',
      subject: assessment.subject || 'General Skills',
      grade: assessment.grade,
      passed: assessment.passed
    }));
    
    res.json({
      success: true,
      history: formattedHistory.slice(-10), // Last 10 assessments
      totalAssessments: user.assessmentHistory.length,
      averageScore: calculateOverallAverage(user.assessmentHistory)
    });
    
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment history',
      error: error.message
    });
  }
});

// Generate daily quick assessment
router.post('/daily-assessment', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const previousResults = user?.assessmentHistory?.slice(-5) || []; // Last 5 assessments
    
    const dailyAssessment = await assessmentAI.generateDailyAssessment(
      req.user.id, 
      previousResults
    );
    
    res.json({
      success: true,
      message: 'Daily assessment generated',
      ...dailyAssessment
    });
    
  } catch (error) {
    console.error('Error generating daily assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily assessment',
      error: error.message
    });
  }
});

// Get assessment analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.assessmentHistory || user.assessmentHistory.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalAssessments: 0,
          averageScore: 0,
          improvementTrend: 'stable',
          strongAreas: [],
          weakAreas: [],
          recommendedFocus: 'Take your first assessment to see personalized analytics'
        }
      });
    }
    
    const history = user.assessmentHistory;
    const recentHistory = history.slice(-5);
    
    // Calculate analytics
    const totalAssessments = history.length;
    const averageScore = calculateOverallAverage(history);
    const recentAverage = calculateOverallAverage(recentHistory);
    const previousAverage = history.length > 5 ? 
      calculateOverallAverage(history.slice(-10, -5)) : averageScore;
    
    const improvementTrend = recentAverage > previousAverage + 5 ? 'improving' :
                           recentAverage < previousAverage - 5 ? 'declining' : 'stable';
    
    // Analyze strong and weak areas
    const { strongAreas, weakAreas } = analyzePerformanceAreas(history);
    
    res.json({
      success: true,
      analytics: {
        totalAssessments,
        averageScore: Math.round(averageScore),
        improvementTrend,
        strongAreas,
        weakAreas,
        recentPerformance: Math.round(recentAverage),
        passRate: Math.round((history.filter(a => a.passed).length / totalAssessments) * 100),
        recommendedFocus: generateRecommendedFocus(weakAreas, improvementTrend)
      }
    });
    
  } catch (error) {
    console.error('Error fetching assessment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Helper functions
function calculateAverageScore(assessmentHistory, domain) {
  if (!assessmentHistory || assessmentHistory.length === 0) return 0;
  
  const scores = assessmentHistory
    .filter(a => !domain || a.domain === domain)
    .map(a => a.percentage);
  
  return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
}

function calculateOverallAverage(assessmentHistory) {
  if (!assessmentHistory || assessmentHistory.length === 0) return 0;
  
  const scores = assessmentHistory.map(a => a.percentage);
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function analyzePerformanceAreas(assessmentHistory) {
  const strongAreas = [];
  const weakAreas = [];
  
  // Analyze based on question difficulties and topics
  const difficultyPerformance = {
    Easy: [],
    Medium: [],
    Hard: []
  };
  
  assessmentHistory.forEach(assessment => {
    if (assessment.detailedResults) {
      assessment.detailedResults.forEach(result => {
        if (difficultyPerformance[result.difficulty]) {
          difficultyPerformance[result.difficulty].push(result.isCorrect ? 1 : 0);
        }
      });
    }
  });
  
  // Determine strong and weak areas
  Object.entries(difficultyPerformance).forEach(([difficulty, results]) => {
    if (results.length > 0) {
      const average = results.reduce((sum, result) => sum + result, 0) / results.length;
      if (average >= 0.8) {
        strongAreas.push(`${difficulty} level questions`);
      } else if (average < 0.6) {
        weakAreas.push(`${difficulty} level concepts`);
      }
    }
  });
  
  return { strongAreas, weakAreas };
}

function generateRecommendedFocus(weakAreas, improvementTrend) {
  if (weakAreas.length === 0) {
    return 'Great job! Continue with advanced topics and practical projects.';
  }
  
  const focusArea = weakAreas[0];
  const trendAdvice = improvementTrend === 'improving' ? 
    'Keep up the great progress!' :
    improvementTrend === 'declining' ?
    'Consider reviewing fundamentals and taking more practice assessments.' :
    'Steady progress - focus on consistent practice.';
  
  return `Focus on ${focusArea}. ${trendAdvice}`;
}

export default router;
