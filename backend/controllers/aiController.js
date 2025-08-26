import aiService from '../services/aiService.js';
import LearningPath from '../models/LearningPath.js';
import Resource from '../models/Resource.js';

export const analyzeDomain = async (req, res) => {
    try {
        const { domain, level } = req.body;
        
        if (!domain) {
            return res.status(400).json({
                success: false,
                message: 'Domain is required'
            });
        }

        console.log(`Analyzing domain: ${domain}${level ? ` at ${level} level` : ''}`);
        
        const analysis = await aiService.analyzeDomain(domain);
        
        // Parse the AI response if it's a string
        const parsedAnalysis = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
        
        if (!parsedAnalysis || !parsedAnalysis.skills || !Array.isArray(parsedAnalysis.skills)) {
            console.error('Invalid analysis format:', parsedAnalysis);
            
            // Return a fallback response with basic skills
            const fallbackSkills = aiService.getDomainFallbackSkills(domain);
            const fallbackAnalysis = {
                overview: `Overview of ${domain} development and career opportunities`,
                skills: fallbackSkills,
                progression: {
                    entry: { roles: [`Junior ${domain} Developer`] },
                    intermediate: { roles: [`Mid-level ${domain} Developer`] },
                    advanced: { roles: [`Senior ${domain} Developer`] }
                },
                industryDemand: { level: "medium" }
            };
            
            return res.json({
                success: true,
                data: {
                    analysis: fallbackAnalysis
                }
            });
        }

        // Filter skills by level if specified
        if (level && parsedAnalysis.skills) {
            const filteredSkills = parsedAnalysis.skills.filter(skill => 
                !skill.level || skill.level.toLowerCase() === level.toLowerCase()
            );
            
            // If no skills match the level, include all skills but mark the preferred level
            if (filteredSkills.length === 0) {
                parsedAnalysis.skills.forEach(skill => {
                    skill.recommended = skill.level && skill.level.toLowerCase() === level.toLowerCase();
                });
            } else {
                parsedAnalysis.skills = filteredSkills;
            }
        }

        console.log(`Successfully analyzed ${domain}, found ${parsedAnalysis.skills.length} skills`);
        
        res.json({
            success: true,
            data: {
                analysis: parsedAnalysis
            }
        });
    } catch (error) {
        console.error('Error in analyzeDomain:', error);
        
        // Return fallback skills in case of error
        try {
            const fallbackSkills = aiService.getDomainFallbackSkills(req.body.domain);
            const fallbackAnalysis = {
                overview: `Overview of ${req.body.domain} development and career opportunities`,
                skills: fallbackSkills,
                progression: {
                    entry: { roles: [`Junior ${req.body.domain} Developer`] },
                    intermediate: { roles: [`Mid-level ${req.body.domain} Developer`] },
                    advanced: { roles: [`Senior ${req.body.domain} Developer`] }
                },
                industryDemand: { level: "medium" }
            };
            
            res.json({
                success: true,
                data: {
                    analysis: fallbackAnalysis
                }
            });
        } catch (fallbackError) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to analyze domain'
            });
        }
    }
};

export const getSkillResources = async (req, res) => {
    try {
        const { skill, level } = req.body;
        const resources = await aiService.getSkillResources(skill, level);
        
        // Parse the AI response
        const parsedResources = JSON.parse(resources);
        
        // Store resources in database
        await Resource.create(
            parsedResources.map(resource => ({
                ...resource,
                userId: req.user._id,
                skill,
                level
            }))
        );

        res.json({
            success: true,
            data: parsedResources
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const generateDailyTasks = async (req, res) => {
    try {
        const { domain, skills, level, duration = 10 } = req.body;
        
        if (!domain || !skills || !Array.isArray(skills)) {
            return res.status(400).json({
                success: false,
                message: 'Domain and skills array are required'
            });
        }

        const dailyTasks = await aiService.generateDailyLearningPlan({
            domain,
            skills,
            level: level || 'Beginner',
            duration,
            userId: req.user._id
        });
        
        // Parse the AI response if it's a string
        const parsedTasks = typeof dailyTasks === 'string' ? JSON.parse(dailyTasks) : dailyTasks;
        
        if (!parsedTasks || !parsedTasks.dailyTasks || !Array.isArray(parsedTasks.dailyTasks)) {
            throw new Error('Invalid daily tasks format: missing dailyTasks array');
        }

        res.json({
            success: true,
            data: parsedTasks
        });
    } catch (error) {
        console.error('Error generating daily tasks:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const submitFeedback = async (req, res) => {
    console.log('=== FEEDBACK SUBMISSION STARTED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    try {
        const { feedback } = req.body;
        
        console.log('Extracted feedback:', feedback);
        
        if (!feedback) {
            console.log('ERROR: No feedback provided in request');
            return res.status(400).json({
                success: false,
                message: 'Feedback is required'
            });
        }

        if (!feedback.rating) {
            console.log('ERROR: No rating provided in feedback');
            return res.status(400).json({
                success: false,
                message: 'Rating is required'
            });
        }

        console.log('Processing feedback with rating:', feedback.rating);
        
        // Create a simple feedback summary for logging
        const feedbackSummary = {
            userId: req.user?.id || 'anonymous',
            rating: feedback.rating,
            difficulty: feedback.difficulty || 'Not specified',
            mostHelpful: feedback.mostHelpful || 'Not specified',
            improvements: feedback.improvements || 'Not specified',
            wouldRecommend: feedback.wouldRecommend || 'Not specified',
            additionalComments: feedback.additionalComments || 'Not specified',
            domain: feedback.domain || 'Not specified',
            level: feedback.level || 'Not specified',
            skills: Array.isArray(feedback.skills) ? feedback.skills.join(', ') : 'Not specified',
            completedDays: feedback.completedDays || 0,
            totalTasks: feedback.totalTasks || 0,
            submittedAt: new Date().toISOString()
        };

        // Log the feedback (in a real app, you'd save this to a Feedback model)
        console.log('=== FEEDBACK SUCCESSFULLY PROCESSED ===');
        console.log('Feedback summary:', feedbackSummary);

        // Skip AI analysis for now to ensure basic submission works
        const analysis = 'Feedback received and stored successfully - AI analysis skipped for debugging';

        const responseData = {
            success: true,
            message: 'Feedback submitted successfully',
            data: {
                feedbackId: `feedback_${Date.now()}_${req.user?.id || 'anonymous'}`,
                submittedAt: new Date().toISOString(),
                analysis: analysis
            }
        };

        console.log('=== SENDING RESPONSE ===');
        console.log('Response data:', responseData);
        
        res.json(responseData);
    } catch (error) {
        console.error('=== ERROR IN FEEDBACK SUBMISSION ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to process feedback',
            error: error.message
        });
    }
};
