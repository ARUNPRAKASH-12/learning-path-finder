import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/LearningPath.css';

// Helper function to get user-specific localStorage key
const getUserStorageKey = (userId) => {
    return userId ? `userLearningPaths_${userId}` : 'userLearningPaths_guest';
};

// Helper function to get consistent visited links key
const getVisitedLinksKey = (domain, learningPathId, userId) => {
    const domainKey = domain?.id || domain?.name || domain || learningPathId || 'unknown';
    const userKey = userId || 'guest';
    return `visited-links-${domainKey}-${userKey}`;
};

// Helper function to get consistent progress key
const getProgressKey = (domain, learningPathId, userId) => {
    const domainKey = domain?.id || domain?.name || domain || learningPathId || 'unknown';
    const userKey = userId || 'guest';
    return `learning-progress-${domainKey}-${userKey}`;
};

// Local function to generate daily tasks based on selected skills
const generateLocalDailyTasks = (domain, selectedSkills, level, duration = 10) => {
    const tasks = [];
    
    // Ensure selectedSkills is an array and handle different data types
    let skillsArray = [];
    if (Array.isArray(selectedSkills)) {
        skillsArray = selectedSkills;
    } else if (selectedSkills && typeof selectedSkills === 'string') {
        skillsArray = [selectedSkills];
    } else if (selectedSkills && typeof selectedSkills === 'object') {
        // Handle case where selectedSkills might be an object with skills
        skillsArray = selectedSkills.skills || Object.values(selectedSkills) || [];
    } else {
        // Fallback: use domain-specific default skills
        const domainDefaults = {
            'ethical-hacking': ['Network Security', 'Penetration Testing', 'Vulnerability Assessment'],
            'web-development': ['HTML/CSS', 'JavaScript', 'React'],
            'data-science': ['Python', 'Machine Learning', 'Data Analysis'],
            'cybersecurity': ['Security Fundamentals', 'Risk Assessment', 'Incident Response'],
            'cloud-computing': ['AWS', 'Docker', 'Kubernetes'],
            'mobile-development': ['React Native', 'iOS Development', 'Android Development']
        };
        const domainKey = domain?.id || domain?.name || domain || 'web-development';
        skillsArray = domainDefaults[domainKey] || domainDefaults['web-development'];
    }
    
    // Ensure we have at least one skill
    if (skillsArray.length === 0) {
        skillsArray = ['General Programming'];
    }
    
    // Define task types for each skill level
    const taskTypes = {
        beginner: [
            'Read documentation about',
            'Watch tutorial video on',
            'Complete coding exercise for',
            'Practice basic concepts of',
            'Build a simple project using',
            'Review and summarize',
            'Debug a sample problem in',
            'Create flashcards for'
        ],
        intermediate: [
            'Implement advanced features for',
            'Build a medium-complexity project with',
            'Optimize code performance for',
            'Write unit tests for',
            'Refactor existing code using',
            'Research best practices for',
            'Create documentation for',
            'Code review exercise on'
        ],
        professional: [
            'Design system architecture for',
            'Lead a complex project involving',
            'Mentor others on',
            'Create advanced tutorial for',
            'Contribute to open source project using',
            'Performance benchmark',
            'Security audit of',
            'Scale solution using'
        ]
    };

    const levelKey = level?.id || level?.toLowerCase() || 'beginner';
    const availableTaskTypes = taskTypes[levelKey] || taskTypes.beginner;
    
    // Generate tasks for each day (only 10 days, 1 task per day)
    for (let day = 1; day <= duration; day++) {
        // Cycle through skills if we have fewer skills than days
        const skillIndex = (day - 1) % skillsArray.length;
        const skill = skillsArray[skillIndex];
        const skillName = skill?.name || skill; // Handle both object and string skills
        
        // Use a deterministic task type based on day to ensure variety
        const taskTypeIndex = (day - 1) % availableTaskTypes.length;
        const taskType = availableTaskTypes[taskTypeIndex];
        
        const task = {
            id: `day-${day}-task-0`,
            title: `${taskType} ${skillName}`,
            description: generateTaskDescription(skillName, taskType, levelKey),
            estimatedTime: '2-3 hours',
            resources: generateTaskResources(skillName, levelKey),
            completed: false
        };
        
        tasks.push({
            day: day,
            title: `Day ${day}: ${getDayTheme(day, levelKey)}`,
            tasks: [task] // Only one task per day
        });
    }
    
    return tasks;
};

const generateTaskDescription = (skill, taskType, level) => {
    const descriptions = {
        beginner: {
            'Read documentation about': `Study the official documentation and basic concepts of ${skill}. Focus on understanding the fundamentals.`,
            'Watch tutorial video on': `Find and watch a comprehensive tutorial video about ${skill}. Take notes on key concepts.`,
            'Complete coding exercise for': `Complete 2-3 coding exercises that practice ${skill}. Start with basic examples.`,
            'Practice basic concepts of': `Practice the core concepts of ${skill} with hands-on examples.`,
            'Build a simple project using': `Create a small project that demonstrates your understanding of ${skill}.`,
            'Review and summarize': `Review what you've learned about ${skill} and create a summary document.`,
            'Debug a sample problem in': `Practice debugging skills with sample problems related to ${skill}.`,
            'Create flashcards for': `Create study flashcards for key concepts and terminology in ${skill}.`
        },
        intermediate: {
            'Implement advanced features for': `Build more complex functionality using ${skill}. Focus on intermediate patterns.`,
            'Build a medium-complexity project with': `Create a substantial project that showcases your ${skill} abilities.`,
            'Optimize code performance for': `Learn and apply performance optimization techniques for ${skill}.`,
            'Write unit tests for': `Practice writing comprehensive unit tests for code using ${skill}.`,
            'Refactor existing code using': `Take existing code and refactor it to use ${skill} best practices.`,
            'Research best practices for': `Study industry best practices and design patterns for ${skill}.`,
            'Create documentation for': `Write comprehensive documentation for a ${skill} project.`,
            'Code review exercise on': `Participate in code review exercises focusing on ${skill} implementations.`
        },
        professional: {
            'Design system architecture for': `Design a scalable system architecture that leverages ${skill}.`,
            'Lead a complex project involving': `Plan and execute a complex project that demonstrates mastery of ${skill}.`,
            'Mentor others on': `Create learning materials or mentor others in ${skill}.`,
            'Create advanced tutorial for': `Develop an advanced tutorial or guide for ${skill}.`,
            'Contribute to open source project using': `Find and contribute to an open source project that uses ${skill}.`,
            'Performance benchmark': `Conduct performance benchmarking and optimization for ${skill}.`,
            'Security audit of': `Perform a security audit of a system or code using ${skill}.`,
            'Scale solution using': `Design and implement scaling solutions that utilize ${skill}.`
        }
    };
    
    return descriptions[level]?.[taskType] || `Work on ${skill} with focus on ${taskType.toLowerCase()}.`;
};

const generateEstimatedTime = (level) => {
    const times = {
        beginner: ['30-45 minutes', '45-60 minutes', '1-1.5 hours'],
        intermediate: ['1-2 hours', '1.5-2.5 hours', '2-3 hours'],
        professional: ['2-3 hours', '3-4 hours', '4-6 hours']
    };
    
    const levelTimes = times[level] || times.beginner;
    return levelTimes[Math.floor(Math.random() * levelTimes.length)];
};

const generateTaskResources = (skill, level) => {
    // Ensure skill is a string - handle both object and string skills
    const skillName = typeof skill === 'object' ? (skill?.name || 'Programming') : (skill || 'Programming');
    
    // Generate smart links based on skill and level
    const skillLower = skillName.toLowerCase().replace(/\s+/g, '-');
    const skillForSearch = skillName.replace(/\s+/g, '+');
    
    const baseResources = [
        {
            title: `Official ${skillName} Documentation`,
            url: getOfficialDocUrl(skillName),
            type: 'documentation'
        },
        {
            title: `${skillName} Tutorial Videos`,
            url: `https://www.youtube.com/results?search_query=${skillForSearch}+tutorial+${level}`,
            type: 'video'
        },
        {
            title: `${skillName} Practice Exercises`,
            url: `https://www.codecademy.com/search?query=${skillForSearch}`,
            type: 'practice'
        },
        {
            title: `${skillName} on MDN Web Docs`,
            url: `https://developer.mozilla.org/en-US/search?q=${skillForSearch}`,
            type: 'reference'
        }
    ];
    
    const levelSpecificResources = {
        beginner: [
            {
                title: `${skillName} Beginner Guide`,
                url: `https://www.freecodecamp.org/news/search/?query=${skillForSearch}`,
                type: 'guide'
            },
            {
                title: `${skillName} Basic Examples`,
                url: `https://github.com/search?q=${skillForSearch}+examples+beginner&type=repositories`,
                type: 'examples'
            },
            {
                title: `Learn ${skillName} Interactive`,
                url: `https://www.khanacademy.org/search?search_again=1&page_search_query=${skillForSearch}`,
                type: 'interactive'
            }
        ],
        intermediate: [
            {
                title: `Advanced ${skillName} Tutorials`,
                url: `https://medium.com/search?q=${skillForSearch}+advanced`,
                type: 'tutorial'
            },
            {
                title: `${skillName} Real-world Projects`,
                url: `https://github.com/search?q=${skillForSearch}+project+intermediate&type=repositories`,
                type: 'project'
            },
            {
                title: `${skillName} Best Practices`,
                url: `https://stackoverflow.com/questions/tagged/${skillLower}`,
                type: 'community'
            },
            {
                title: `${skillName} on Dev.to`,
                url: `https://dev.to/search?q=${skillForSearch}`,
                type: 'articles'
            }
        ],
        professional: [
            {
                title: `${skillName} Expert Content`,
                url: `https://www.pluralsight.com/search?q=${skillForSearch}`,
                type: 'course'
            },
            {
                title: `${skillName} Research Papers`,
                url: `https://scholar.google.com/scholar?q=${skillForSearch}`,
                type: 'research'
            },
            {
                title: `${skillName} Open Source Projects`,
                url: `https://github.com/search?q=${skillForSearch}+stars:>1000&type=repositories`,
                type: 'opensource'
            },
            {
                title: `${skillName} Professional Community`,
                url: `https://www.reddit.com/search/?q=${skillForSearch}`,
                type: 'community'
            },
            {
                title: `${skillName} Industry Articles`,
                url: `https://www.infoq.com/search.action?queryString=${skillForSearch}`,
                type: 'industry'
            }
        ]
    };
    
    const levelResources = levelSpecificResources[level] || levelSpecificResources.beginner;
    return [...baseResources, ...levelResources];
};

// Helper function to get official documentation URLs for popular technologies
const getOfficialDocUrl = (skill) => {
    // Ensure skill is a string
    const skillName = typeof skill === 'object' ? (skill?.name || 'programming') : (skill || 'programming');
    const skillLower = skillName.toLowerCase();
    const docUrls = {
        'html': 'https://developer.mozilla.org/en-US/docs/Web/HTML',
        'css': 'https://developer.mozilla.org/en-US/docs/Web/CSS',
        'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        'react': 'https://react.dev/learn',
        'node.js': 'https://nodejs.org/en/docs/',
        'express': 'https://expressjs.com/en/guide/routing.html',
        'mongodb': 'https://docs.mongodb.com/',
        'python': 'https://docs.python.org/3/',
        'typescript': 'https://www.typescriptlang.org/docs/',
        'vue': 'https://vuejs.org/guide/',
        'angular': 'https://angular.io/docs',
        'docker': 'https://docs.docker.com/',
        'kubernetes': 'https://kubernetes.io/docs/',
        'aws': 'https://docs.aws.amazon.com/',
        'git': 'https://git-scm.com/doc',
        'linux': 'https://www.kernel.org/doc/',
        'security fundamentals': 'https://owasp.org/www-project-top-ten/',
        'network basics': 'https://tools.ietf.org/rfc/',
        'penetration testing': 'https://www.offensive-security.com/metasploit-unleashed/',
        'machine learning': 'https://scikit-learn.org/stable/user_guide.html',
        'tensorflow': 'https://www.tensorflow.org/learn',
        'pytorch': 'https://pytorch.org/docs/stable/index.html'
    };
    
    // Try to find exact match first
    if (docUrls[skillLower]) {
        return docUrls[skillLower];
    }
    
    // Try to find partial match
    for (const [key, url] of Object.entries(docUrls)) {
        if (skillLower.includes(key) || key.includes(skillLower)) {
            return url;
        }
    }
    
    // Default fallback
    const skillForSearch = skillName.replace(/\s+/g, '+');
    return `https://www.google.com/search?q=${skillForSearch}+official+documentation`;
};

// Helper function to get icons for different resource types
const getResourceIcon = (type) => {
    const icons = {
        'documentation': '📚',
        'video': '🎥',
        'practice': '💻',
        'reference': '📖',
        'guide': '🗺️',
        'examples': '📝',
        'interactive': '🎮',
        'tutorial': '🎓',
        'project': '🚀',
        'community': '👥',
        'articles': '📰',
        'course': '🎯',
        'research': '🔬',
        'opensource': '🌟',
        'industry': '🏢'
    };
    return icons[type] || '🔗';
};

const getDayTheme = (day, level) => {
    const themes = {
        beginner: [
            'Getting Started', 'Basic Concepts', 'First Steps', 'Foundation Building', 'Core Principles',
            'Hands-on Practice', 'Understanding Basics', 'Simple Examples', 'Building Blocks', 'Essential Skills'
        ],
        intermediate: [
            'Advanced Concepts', 'Real-world Application', 'Best Practices', 'Problem Solving', 'Project Building',
            'Code Quality', 'Performance Focus', 'Integration Skills', 'Testing Approach', 'Optimization'
        ],
        professional: [
            'System Design', 'Architecture Planning', 'Leadership Skills', 'Advanced Patterns', 'Scalability',
            'Expert Techniques', 'Innovation', 'Mentoring', 'Industry Standards', 'Cutting-edge Solutions'
        ]
    };
    
    const themeArray = themes[level] || themes.beginner;
    return themeArray[(day - 1) % themeArray.length];
};

// Helper function to calculate estimated duration for skills
const calculateEstimatedDuration = (skills) => {
    if (!skills || !Array.isArray(skills)) {
        return '10 days';
    }
    
    // Simple calculation: approximately 1-2 days per skill, minimum 10 days
    const estimatedDays = Math.max(10, Math.ceil(skills.length * 1.5));
    return `${estimatedDays} days`;
};

// Helper function to auto-mark resources as visited for completed tasks
const autoMarkResourcesForCompletedTasks = (tasks, progressData, domain, learningPathId, userId) => {
    const visitedLinksKey = getVisitedLinksKey(domain, learningPathId, userId);
    const currentVisitedLinks = JSON.parse(localStorage.getItem(visitedLinksKey) || '{}');
    let hasNewVisitedLinks = false;
    
    // Check each completed task and mark its resources as visited
    Object.keys(progressData).forEach(taskId => {
        if (progressData[taskId] && (progressData[taskId].completed || progressData[taskId] === true)) {
            // Parse task ID to get day and task index
            const taskMatch = taskId.match(/day-(\d+)-task-(\d+)/);
            if (taskMatch) {
                const dayNumber = parseInt(taskMatch[1]);
                const taskIndex = parseInt(taskMatch[2]);
                
                // Find the task data
                const dayData = tasks.find(day => day.day === dayNumber);
                if (dayData && dayData.tasks[taskIndex] && dayData.tasks[taskIndex].resources) {
                    const task = dayData.tasks[taskIndex];
                    
                    // Mark all resources in this completed task as visited
                    task.resources.forEach((_, resIndex) => {
                        const linkId = `day-${dayNumber}-task-${taskIndex}-link-${resIndex}`;
                        if (!currentVisitedLinks[linkId]) {
                            currentVisitedLinks[linkId] = true;
                            hasNewVisitedLinks = true;
                        }
                    });
                }
            }
        }
    });
    
    // Return the updated visited links if there are changes
    if (hasNewVisitedLinks) {
        localStorage.setItem(visitedLinksKey, JSON.stringify(currentVisitedLinks));
        console.log('Auto-marked resources as visited for completed tasks:', currentVisitedLinks);
        return currentVisitedLinks;
    }
    
    return currentVisitedLinks;
};

const LearningPath = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { pathId } = useParams();
    const { user } = useAuth();
    const { 
        domain, 
        selectedSkills, 
        analysis, 
        level, 
        isFromDashboard, 
        learningPathId,
        selectedResources,
        isFromResourceSelection,
        enableAIAssistance,
        currentDay: passedCurrentDay,
        progressPercentage,
        isContinueMode,
        isStartingFresh, // Add this new flag
        savedProgress,
        backendProgress,
        continueFromExactPoint
    } = location.state || {};
    
    // Debug: Log the navigation state flags
    console.log('🔍 LearningPath received navigation state:', {
        isFromDashboard,
        isContinueMode,
        isStartingFresh,
        continueFromExactPoint,
        progressPercentage,
        domain: domain?.name || domain?.title || domain
    });
    
    const [dailyTasks, setDailyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState({});
    const [currentDay, setCurrentDay] = useState(passedCurrentDay || 1);
    const [visitedLinks, setVisitedLinks] = useState({});
    const [learningPathData, setLearningPathData] = useState(null);
    const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(enableAIAssistance || false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);
    const [isNewlyCreated, setIsNewlyCreated] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Function to generate AI suggestions based on progress
    const generateAISuggestions = async () => {
        if (!aiAssistanceEnabled) return;
        
        setLoadingAISuggestions(true);
        try {
            console.log('Generating AI suggestions with data:', {
                aiAssistanceEnabled,
                dailyTasksLength: dailyTasks.length,
                progressKeys: Object.keys(progress).length,
                currentDay,
                domain: domain?.title || domain?.name,
                level: level?.name
            });
            
            // Calculate current progress
            const totalTasks = dailyTasks.reduce((sum, day) => sum + day.tasks.length, 0);
            const completedTasks = Object.values(progress).filter(task => task.completed).length;
            const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            console.log('Progress calculation:', { totalTasks, completedTasks, progressPercentage });
            
            // Generate contextual AI suggestions based on progress and domain
            const suggestions = {
                motivational: generateMotivationalMessage(progressPercentage, domain?.title || domain?.name || 'Programming'),
                nextSteps: generateNextSteps(currentDay, dailyTasks, progress),
                resources: generateAdditionalResources(domain?.title || domain?.name || 'Programming', level?.name || 'Beginner'),
                tips: generateStudyTips(progressPercentage, domain?.title || domain?.name || 'Programming')
            };
            
            console.log('Generated AI suggestions:', suggestions);
            setAiSuggestions(suggestions);
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            setAiSuggestions({
                motivational: 'Welcome to your learning journey! Let\'s get started with building your skills.',
                nextSteps: ['Start with the first task in your learning path'],
                resources: ['Official Documentation', 'Video Tutorials', 'Practice Exercises'],
                tips: ['Set aside dedicated time each day for learning', 'Take notes while studying', 'Practice regularly']
            });
        } finally {
            setLoadingAISuggestions(false);
        }
    };

    // Helper functions for AI suggestions
    const generateMotivationalMessage = (progress, domain) => {
        const messages = {
            0: `🚀 Welcome to your ${domain} learning journey! Every expert was once a beginner. You're taking the first step towards mastery!`,
            25: `💪 Great progress! You're 25% through your journey. Keep up the momentum - you're building solid foundations!`,
            50: `🎯 Halfway there! You're showing real dedication. The skills you're learning are already making you a better developer!`,
            75: `🔥 Outstanding! You're 75% complete. You can see the finish line now. Push through - you're so close to achieving your goal!`,
            100: `🎉 Incredible achievement! You've completed your entire learning path. You're now equipped with valuable ${domain} skills!`
        };
        
        const milestones = [0, 25, 50, 75, 100];
        const closestMilestone = milestones.reduce((prev, curr) => 
            Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev
        );
        
        return messages[closestMilestone];
    };

    const generateNextSteps = (currentDay, dailyTasks, progress) => {
        const suggestions = [];
        
        // Check if there are pending tasks
        const pendingTasks = [];
        dailyTasks.forEach((day, dayIndex) => {
            day.tasks.forEach(task => {
                if (!progress[task.id]?.completed) {
                    pendingTasks.push({ ...task, day: dayIndex + 1 });
                }
            });
        });

        if (pendingTasks.length > 0) {
            const nextTask = pendingTasks[0];
            suggestions.push(`Focus on "${nextTask.title}" from Day ${nextTask.day}`);
            suggestions.push(`Estimated time: ${nextTask.estimatedTime}`);
        }

        if (pendingTasks.length > 3) {
            suggestions.push('Consider dedicating 2-3 hours daily for consistent progress');
        }

        return suggestions;
    };

    const generateAdditionalResources = (domain, level) => {
        const resources = {
            'Frontend': {
                beginner: ['MDN Web Docs', 'freeCodeCamp', 'W3Schools', 'CSS-Tricks'],
                intermediate: ['React Documentation', 'JavaScript.info', 'Frontend Masters', 'Codecademy'],
                professional: ['Advanced React Patterns', 'Performance Optimization Guides', 'TypeScript Deep Dive']
            },
            'Backend': {
                beginner: ['Node.js Documentation', 'Express.js Guide', 'MongoDB University'],
                intermediate: ['API Design Best Practices', 'Database Optimization', 'Testing Frameworks'],
                professional: ['Microservices Architecture', 'System Design', 'DevOps Practices']
            },
            'Security': {
                beginner: ['OWASP Top 10', 'Cybrary', 'TryHackMe'],
                intermediate: ['Penetration Testing', 'Security+ Study Guide', 'Vulnerability Assessment'],
                professional: ['Advanced Persistent Threats', 'Red Team Operations', 'Security Architecture']
            }
        };

        const domainKey = Object.keys(resources).find(key => 
            domain.toLowerCase().includes(key.toLowerCase())
        ) || 'Frontend';

        const levelKey = level.toLowerCase().includes('intermediate') ? 'intermediate' :
                        level.toLowerCase().includes('professional') ? 'professional' : 'beginner';

        return resources[domainKey][levelKey] || resources['Frontend']['beginner'];
    };

    const generateStudyTips = (progress, domain) => {
        const tips = [];
        
        if (progress < 25) {
            tips.push('🕒 Set aside dedicated time each day for learning');
            tips.push('📝 Take notes while studying to reinforce concepts');
            tips.push('🎯 Focus on understanding fundamentals before moving to advanced topics');
        } else if (progress < 50) {
            tips.push('🛠️ Start building small projects to apply what you\'ve learned');
            tips.push('👥 Join online communities related to ' + domain);
            tips.push('📚 Review previous lessons periodically to reinforce learning');
        } else if (progress < 75) {
            tips.push('🚀 Challenge yourself with more complex projects');
            tips.push('👩‍💻 Consider contributing to open source projects');
            tips.push('🔄 Refactor your old code using new techniques you\'ve learned');
        } else {
            tips.push('🎓 Start preparing for technical interviews');
            tips.push('📄 Build a portfolio showcasing your projects');
            tips.push('🌐 Network with other professionals in the field');
        }
        
        return tips;
    };

    // Function to save the current learning path to the backend
    const saveCourseToBackend = async () => {
        if (isSaved || isSaving) return; // Prevent duplicate saves
        
        setIsSaving(true);
        setSaveError(null);
        
        try {
            // Prepare learning path data for backend
            const learningPathData = {
                title: `${domain?.title || domain?.name || domain} Learning Path`,
                domain: domain?.title || domain?.name || domain,
                level: level?.name || level?.id || level || 'Beginner',
                description: `A comprehensive ${level?.name || level?.id || level || 'Beginner'} level learning path for ${domain?.title || domain?.name || domain}`,
                skills: selectedSkills || analysis?.skills || [],
                estimatedDuration: analysis?.estimatedDuration || '10 days',
                modules: dailyTasks.map((day, index) => ({
                    title: `Day ${day.day}: ${getDayTheme(day.day, level?.id || level?.name || level || 'beginner')}`,
                    description: `Learning tasks for day ${day.day}`,
                    order: index,
                    tasks: day.tasks.map((task, taskIndex) => ({
                        title: task.title,
                        description: task.description,
                        estimatedTime: task.estimatedTime,
                        order: taskIndex,
                        resources: task.resources || []
                    }))
                })),
                totalDays: dailyTasks.length,
                currentDay: currentDay,
                progress: Object.keys(progress).filter(key => progress[key]).length,
                totalTasks: dailyTasks.reduce((sum, day) => sum + day.tasks.length, 0),
                progressPercentage: Math.round((Object.keys(progress).filter(key => progress[key]).length / dailyTasks.reduce((sum, day) => sum + day.tasks.length, 0)) * 100) || 0,
                isAIGenerated: true,
                completedTasks: progress
            };

            console.log('Saving learning path to backend:', learningPathData);
            
            // Call the backend API to create the learning path
            const response = await api.createLearningPath(learningPathData);
            
            if (response.data.success) {
                setIsSaved(true);
                console.log('Learning path saved successfully to backend:', response.data.data);
                
                // Also save to localStorage for immediate dashboard update
                const newLearningPath = {
                    _id: response.data.data._id,
                    ...learningPathData,
                    user: user?.id || user?._id,
                    userId: user?.id || user?._id,
                    createdAt: new Date().toISOString(),
                    savedToBackend: true // Flag to indicate it's persisted
                };
                
                const userStorageKey = getUserStorageKey(user?.id);
                const existingPaths = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
                
                // Check if already exists to avoid duplicates
                const existingIndex = existingPaths.findIndex(path => 
                    path._id === newLearningPath._id || 
                    (path.domain === newLearningPath.domain && path.level === newLearningPath.level)
                );
                
                if (existingIndex >= 0) {
                    existingPaths[existingIndex] = newLearningPath;
                } else {
                    existingPaths.push(newLearningPath);
                }
                
                localStorage.setItem(userStorageKey, JSON.stringify(existingPaths));
                
                // Trigger dashboard refresh
                window.dispatchEvent(new CustomEvent('learningPathUpdated', {
                    detail: { 
                        paths: existingPaths, 
                        newPath: newLearningPath,
                        action: 'saved',
                        timestamp: Date.now()
                    }
                }));
                
                // Dispatch learning path created event for completion tracking
                window.dispatchEvent(new CustomEvent('learningPathCreated', {
                    detail: {
                        userId: user?.id || user?._id,
                        domain: newLearningPath.domain,
                        level: newLearningPath.level,
                        pathId: newLearningPath._id,
                        createdAt: new Date().toISOString()
                    }
                }));
                
                if (window.dashboardRefresh) {
                    window.dashboardRefresh();
                }
                
                // Show success message temporarily, then hide it
                setTimeout(() => {
                    setIsSaved(false);
                }, 4000);
                
            } else {
                throw new Error(response.data.message || 'Failed to save learning path');
            }
            
        } catch (error) {
            console.error('Error saving learning path to backend:', error);
            
            // If backend fails, save to localStorage only and show appropriate message
            if (error.response?.status === 401 || error.message.includes('401')) {
                setSaveError('Authentication required. Course saved locally only.');
            } else {
                setSaveError(`Backend unavailable. Course saved locally only. (${error.message})`);
            }
            
            // Save to localStorage as fallback
            try {
                const fallbackLearningPath = {
                    _id: learningPathId || `local-${Date.now()}`,
                    ...learningPathData,
                    user: user?.id || user?._id,
                    userId: user?.id || user?._id,
                    createdAt: new Date().toISOString(),
                    savedToBackend: false // Flag to indicate it's not persisted to backend
                };
                
                const userStorageKey = getUserStorageKey(user?.id);
                const existingPaths = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
                
                const existingIndex = existingPaths.findIndex(path => 
                    path.domain === fallbackLearningPath.domain && 
                    path.level === fallbackLearningPath.level
                );
                
                if (existingIndex >= 0) {
                    existingPaths[existingIndex] = fallbackLearningPath;
                } else {
                    existingPaths.push(fallbackLearningPath);
                }
                
                localStorage.setItem(userStorageKey, JSON.stringify(existingPaths));
                
                // Still trigger dashboard refresh for localStorage data
                window.dispatchEvent(new CustomEvent('learningPathUpdated', {
                    detail: { 
                        paths: existingPaths, 
                        newPath: fallbackLearningPath,
                        action: 'saved-locally',
                        timestamp: Date.now()
                    }
                }));
                
                if (window.dashboardRefresh) {
                    window.dashboardRefresh();
                }
                
                // Set as saved (locally) and show warning
                setIsSaved(true);
                setTimeout(() => {
                    setIsSaved(false);
                    setSaveError(null);
                }, 6000);
                
            } catch (localError) {
                console.error('Failed to save to localStorage as well:', localError);
                setSaveError('Failed to save course. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const generateDailyTasks = async () => {
            // Check if this learning path is already saved
            const checkIfAlreadySaved = () => {
                if (isFromDashboard || learningPathId) {
                    setIsSaved(true);
                    return true;
                }
                
                // Check localStorage for existing path
                const userStorageKey = getUserStorageKey(user?.id);
                const storedPaths = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
                const existingPath = storedPaths.find(path => 
                    path.domain === (domain?.title || domain?.name || domain) &&
                    path.level === (level?.name || level?.id || level)
                );
                
                if (existingPath) {
                    setIsSaved(true);
                    return true;
                }
                
                return false;
            };
            
            checkIfAlreadySaved();

            // If we have a pathId from URL, try to load learning path data from localStorage
            if (pathId && !domain) {
                const userStorageKey = getUserStorageKey(user?.id);
                const storedPaths = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
                const foundPath = storedPaths.find(path => path._id === pathId);
                
                if (foundPath) {
                    // Reconstruct the state from stored path data
                    const reconstructedState = {
                        domain: { 
                            id: foundPath.domain?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
                            title: foundPath.domain || 'Unknown Domain',
                            name: foundPath.domain || 'Unknown Domain'
                        },
                        level: { 
                            id: foundPath.level || 'beginner',
                            name: foundPath.level || 'beginner'
                        },
                        selectedSkills: foundPath.skills || [],
                        analysis: {
                            domain: foundPath.domain,
                            level: foundPath.level,
                            skills: foundPath.skills,
                            estimatedDuration: foundPath.estimatedDuration || '10 days',
                            description: `Comprehensive learning path for ${foundPath.domain} at ${foundPath.level} level`
                        },
                        isFromDashboard: true,
                        learningPathId: pathId
                    };
                    
                    // Update the location state internally
                    Object.assign(location.state || {}, reconstructedState);
                    setLearningPathData(foundPath);
                } else {
                    setError('Learning path not found. Please select a new learning path.');
                    setLoading(false);
                    return;
                }
            }

            // Always ensure learning path is saved when we have domain and level data
            // This ensures paths are saved regardless of navigation source
            if (domain && level && (selectedSkills || analysis?.skills)) {
                const skillsToUse = selectedSkills || analysis?.skills || [];
                
                console.log('Creating/updating learning path with:', {
                    domain: domain.title || domain.name || domain,
                    level: level.name || level.id || level,
                    skillsCount: skillsToUse.length,
                    isFromResourceSelection,
                    isFromDashboard,
                    learningPathId
                });
                
                const newLearningPath = {
                    _id: learningPathId || `path-${Date.now()}`,
                    domain: domain.title || domain.name || domain,
                    level: level.name || level.id || level,
                    skills: skillsToUse,
                    estimatedDuration: analysis?.estimatedDuration || calculateEstimatedDuration(skillsToUse),
                    modules: skillsToUse.map((skill, index) => `Module ${index + 1}: ${skill.name || skill}`),
                    completedModules: 0,
                    progress: 0,
                    createdAt: new Date().toISOString(),
                    isAIGenerated: true,
                    userId: user?.id || user?._id, // IMPORTANT: Add userId for proper filtering
                    selectedResources: selectedResources || {}
                };

                // Save to localStorage and update dashboard
                const userStorageKey = getUserStorageKey(user?.id);
                const existingPaths = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
                const pathIndex = existingPaths.findIndex(path => path._id === newLearningPath._id);
                
                console.log('Saving learning path:', newLearningPath);
                console.log('Existing paths before save:', existingPaths);
                console.log('Path data used for creation:', {
                    domain,
                    level,
                    selectedSkills,
                    analysis,
                    isFromDashboard,
                    learningPathId
                });
                
                if (pathIndex >= 0) {
                    existingPaths[pathIndex] = newLearningPath;
                } else {
                    existingPaths.push(newLearningPath);
                    setIsNewlyCreated(true); // Mark as newly created
                }
                
                localStorage.setItem(userStorageKey, JSON.stringify(existingPaths));
                console.log('Saved paths to user-specific localStorage:', existingPaths);
                
                // Ensure localStorage is properly written before triggering events
                setTimeout(() => {
                    // Trigger storage event for dashboard updates
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: userStorageKey,
                        newValue: JSON.stringify(existingPaths),
                        url: window.location.href
                    }));
                    
                    // Also dispatch custom event for same-window updates
                    window.dispatchEvent(new CustomEvent('learningPathUpdated', {
                        detail: { 
                            paths: existingPaths, 
                            newPath: newLearningPath,
                            action: 'created',
                            timestamp: Date.now()
                        }
                    }));
                    
                    console.log('Dispatched events for learning path update');
                    
                    // Also call global dashboard refresh function if available
                    if (window.dashboardRefresh) {
                        console.log('Calling global dashboard refresh function');
                        window.dashboardRefresh();
                    }
                }, 100); // Small delay to ensure localStorage is written
                
                setLearningPathData(newLearningPath);
            }

            // Validate required data - be more flexible for ResourceSelection flow and Dashboard continue
            const currentSkills = selectedSkills || analysis?.skills || [];
            
            // For dashboard continue functionality, if we have a learningPathId, try to load progress first
            if (isFromDashboard && learningPathId && (location.state?.isContinueMode || !domain || currentSkills.length === 0)) {
                console.log('Dashboard continue mode - attempting to load progress for learningPathId:', learningPathId);
                
                try {
                    const response = await api.getProgress();
                    const userProgress = response.data.data || [];
                    
                    // Find progress for this specific learning path
                    const pathProgress = userProgress.find(p => 
                        p.learningPathId === learningPathId || 
                        p.domain === (domain?.id || domain?.name)
                    );
                    
                    if (pathProgress) {
                        console.log('Found existing progress for continue:', pathProgress);
                        
                        // Use existing domain/skills data if available, otherwise create from progress
                        const effectiveDomain = domain || {
                            id: pathProgress.domain?.toLowerCase().replace(/\s+/g, '-') || 'learning-path',
                            name: pathProgress.domain || 'Learning Path',
                            title: pathProgress.domain || 'Learning Path'
                        };
                        
                        const effectiveSkills = currentSkills.length > 0 ? currentSkills : ['Continuing Learning'];
                        const effectiveLevel = level || { id: 'intermediate', name: 'Intermediate' };
                        
                        // Generate daily tasks for this learning path if needed
                        const generatedTasks = generateLocalDailyTasks(
                            effectiveDomain,
                            effectiveSkills,
                            effectiveLevel,
                            pathProgress.totalDays || 10
                        );
                        
                        // Set up the learning path data from progress
                        const progressState = {};
                        if (pathProgress.completedTasks) {
                            if (pathProgress.completedTasks instanceof Map) {
                                pathProgress.completedTasks.forEach((value, key) => {
                                    progressState[key] = value.completed;
                                });
                            } else if (typeof pathProgress.completedTasks === 'object') {
                                Object.keys(pathProgress.completedTasks).forEach(taskId => {
                                    const task = pathProgress.completedTasks[taskId];
                                    progressState[taskId] = task.completed || task;
                                });
                            }
                        }
                        
                        // Create learning path data structure
                        const learningPathFromProgress = {
                            _id: learningPathId,
                            domain: effectiveDomain.name,
                            level: effectiveLevel.name || effectiveLevel.id,
                            skills: effectiveSkills,
                            analysis: analysis || {
                                domain: effectiveDomain.name,
                                level: effectiveLevel.name || effectiveLevel.id,
                                skills: effectiveSkills,
                                description: `Continuing your learning journey in ${effectiveDomain.name}`
                            },
                            isAIGenerated: true,
                            userId: user?.id || user?._id, // IMPORTANT: Add userId for proper filtering
                            createdAt: pathProgress.createdAt || new Date().toISOString(),
                            estimatedDuration: `${pathProgress.totalDays || 30} days`
                        };
                        
                        setLearningPathData(learningPathFromProgress);
                        setCurrentDay(pathProgress.currentDay || 1);
                        setProgress(progressState);
                        setDailyTasks(generatedTasks);
                        
                        // Auto-mark resources as visited for completed tasks in backend progress flow
                        const updatedVisitedLinks = autoMarkResourcesForCompletedTasks(
                            generatedTasks, 
                            progressState, 
                            effectiveDomain, 
                            learningPathId, 
                            user?.id || user?._id
                        );
                        setVisitedLinks(updatedVisitedLinks);
                        
                        setLoading(false);
                        
                        console.log('Successfully set up continue mode with:', {
                            learningPath: learningPathFromProgress,
                            currentDay: pathProgress.currentDay || 1,
                            progress: progressState,
                            dailyTasks: generatedTasks
                        });
                        
                        return;
                    }
                } catch (error) {
                    console.warn('Failed to load progress for continue:', error);
                    // Continue with normal flow if progress loading fails
                }
            }
            
            // Standard validation for new learning paths
            if (!domain || (currentSkills.length === 0 && !isFromResourceSelection)) {
                if (isFromDashboard || pathId) {
                    setError('Invalid learning path data. Please try selecting a new learning path.');
                    setLoading(false);
                    return;
                } else {
                    navigate('/domain-selection');
                    return;
                }
            }

            // For ResourceSelection flow, ensure we have skills even if empty initially
            let finalSkills = currentSkills;
            if (isFromResourceSelection && finalSkills.length === 0) {
                const domainId = domain?.id || domain?.name || 'frontend';
                const fallbackSkills = [
                    { name: 'Getting Started', description: 'Begin your learning journey' },
                    { name: 'Core Concepts', description: 'Learn fundamental concepts' },
                    { name: 'Practice Projects', description: 'Apply your knowledge' }
                ];
                finalSkills = fallbackSkills;
            }

            try {
                setLoading(true);
                setError(null);

                const pathId = learningPathId || `${domain.id || domain.name}-${Date.now()}`;

                // First prioritize saved progress data passed from Dashboard for exact continuation
                let progressState = {};
                let calculatedCurrentDay = 1;

                if (continueFromExactPoint && savedProgress && !isStartingFresh) {
                    // Use the progress data passed from Dashboard for immediate restoration
                    progressState = savedProgress;
                    calculatedCurrentDay = passedCurrentDay || 1;
                    console.log('Using passed progress data for exact continuation:', {
                        progressState,
                        currentDay: calculatedCurrentDay,
                        totalCompletedTasks: Object.keys(progressState).length
                    });
                    
                    // Load visited links from localStorage for exact continuation
                    const visitedLinksKey = getVisitedLinksKey(domain, learningPathId, user?.id || user?._id);
                    const savedVisitedLinks = JSON.parse(localStorage.getItem(visitedLinksKey) || '{}');
                    setVisitedLinks(savedVisitedLinks);
                } else if (isStartingFresh) {
                    // Starting fresh - clear all progress and visited links
                    console.log('🆕 STARTING FRESH - clearing all progress and visited links');
                    console.log('🆕 Fresh start details:', {
                        isStartingFresh,
                        domain: domain?.name || domain?.title || domain,
                        userId: user?.id || user?._id
                    });
                    
                    progressState = {};
                    calculatedCurrentDay = 1;
                    
                    // Clear visited links
                    const visitedLinksKey = getVisitedLinksKey(domain, learningPathId, user?.id || user?._id);
                    console.log('🗑️ Clearing visited links with key:', visitedLinksKey);
                    
                    setVisitedLinks({});
                    localStorage.removeItem(visitedLinksKey);
                    
                    // Also clear progress from localStorage
                    const progressKey = getProgressKey(domain, learningPathId, user?.id || user?._id);
                    console.log('🗑️ Clearing progress with key:', progressKey);
                    localStorage.removeItem(progressKey);
                    
                    console.log('✅ Fresh start cleanup completed');
                } else {
                    // Standard progress loading flow
                    let backendProgressData = null;
                    
                    // Determine if this is a new course vs continuing
                    const hasExistingProgress = Object.keys(progressState).length > 0;
                    
                    // Only load visited links if this is a continuing course
                    const visitedLinksKey = getVisitedLinksKey(domain, learningPathId, user?.id || user?._id);
                    
                    if ((isFromDashboard || hasExistingProgress) && !isStartingFresh) {
                        // Continuing course - load existing visited links
                        console.log('🔄 Loading existing visited links for continuing course');
                        console.log('🔄 Continue conditions:', {
                            isFromDashboard,
                            hasExistingProgress,
                            isStartingFresh,
                            visitedLinksKey
                        });
                        const savedVisitedLinks = JSON.parse(localStorage.getItem(visitedLinksKey) || '{}');
                        console.log('🔄 Loaded visited links:', savedVisitedLinks);
                        setVisitedLinks(savedVisitedLinks);
                    } else {
                        // New course OR explicitly starting fresh - start with empty visited links
                        console.log('🆕 Starting with empty visited links for new/fresh course', {
                            isStartingFresh,
                            isFromDashboard,
                            hasExistingProgress,
                            visitedLinksKey
                        });
                        setVisitedLinks({});
                        // Clear any existing visited links for this learning path
                        console.log('🗑️ Removing visited links from localStorage');
                        localStorage.removeItem(visitedLinksKey);
                    }

                    try {
                        const response = await api.getProgress();
                        const userProgress = response.data.data || [];
                        
                        // Find progress for this specific learning path
                        const pathProgress = userProgress.find(p => 
                            (p.learningPathId === pathId || p.domain === (domain.id || domain.name)) &&
                            p.userId === (user?.id || user?._id)
                        );
                        
                        if (pathProgress && pathProgress.completedTasks) {
                            backendProgressData = pathProgress;
                            console.log('Loaded progress from backend:', pathProgress);
                            
                            // Convert backend progress to frontend format
                            if (pathProgress.completedTasks instanceof Map) {
                                pathProgress.completedTasks.forEach((value, key) => {
                                    progressState[key] = value.completed || value;
                                });
                            } else if (typeof pathProgress.completedTasks === 'object') {
                                Object.keys(pathProgress.completedTasks).forEach(taskId => {
                                    const task = pathProgress.completedTasks[taskId];
                                    progressState[taskId] = task.completed || task;
                                });
                            }
                            
                            calculatedCurrentDay = pathProgress.currentDay || 1;
                            console.log('Using backend current day:', calculatedCurrentDay);
                        }
                    } catch (apiError) {
                        console.warn('Failed to load progress from backend, using localStorage:', apiError);
                    }

                    // Fallback to localStorage if no backend progress
                    if (Object.keys(progressState).length === 0) {
                        const progressKey = getProgressKey(domain, learningPathId, user?.id || user?._id);
                        const localProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
                        Object.keys(localProgress).forEach(taskId => {
                            progressState[taskId] = localProgress[taskId].completed;
                        });
                        console.log('Using localStorage progress:', progressState);
                    }
                }

                setProgress(progressState);

                // Set current day with priority: passed value > calculated from progress > default
                if (continueFromExactPoint && passedCurrentDay) {
                    setCurrentDay(passedCurrentDay);
                    console.log('Using exact continuation current day:', passedCurrentDay);
                } else if (passedCurrentDay) {
                    setCurrentDay(passedCurrentDay);
                    console.log('Using passed current day:', passedCurrentDay);
                } else if (calculatedCurrentDay > 1) {
                    setCurrentDay(calculatedCurrentDay);
                    console.log('Using calculated current day:', calculatedCurrentDay);
                } else if (isFromDashboard && Object.keys(progressState).length > 0) {
                    // Calculate current day from progress if not passed
                    const completedDays = new Set();
                    Object.keys(progressState).forEach(taskId => {
                        if (progressState[taskId]) {
                            const dayMatch = taskId.match(/day-(\d+)/);
                            if (dayMatch) {
                                completedDays.add(parseInt(dayMatch[1]));
                            }
                        }
                    });
                    
                    if (completedDays.size > 0) {
                        const lastCompletedDay = Math.max(...completedDays);
                        const newCurrentDay = Math.min(lastCompletedDay + 1, 30);
                        setCurrentDay(newCurrentDay);
                        console.log('Calculated current day from progress:', newCurrentDay);
                    } else {
                        setCurrentDay(1);
                    }
                } else {
                    setCurrentDay(1);
                }

                // Simulate processing time for better UX
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Generate daily learning tasks locally
                console.log('Generating tasks with params:', {
                    domain: domain,
                    selectedSkills: finalSkills,
                    level: level,
                    skillsType: typeof finalSkills,
                    skillsIsArray: Array.isArray(finalSkills)
                });
                
                const tasks = generateLocalDailyTasks(
                    domain.id || domain.name || domain,
                    finalSkills,
                    level?.id || level?.name || level || 'beginner',
                    10 // 10-day learning path
                );

                console.log('Generated daily tasks:', tasks);
                setDailyTasks(tasks);
                
                // Determine if this is a truly NEW course (not continuing)
                // Check multiple indicators to ensure we start fresh when user selects a new course
                const hasExistingProgress = Object.keys(progressState).length > 0;
                const isExplicitNewCourse = location.state?.isNewCourse === true;
                const isFromNewSelection = !isFromDashboard && !isContinueMode && !continueFromExactPoint;
                const isNewCourse = isExplicitNewCourse || (isFromNewSelection && !hasExistingProgress) || isFromResourceSelection;
                
                console.log('🔍 Course type detection for user', user?.id || user?._id, ':', {
                    isFromDashboard,
                    isContinueMode, 
                    continueFromExactPoint,
                    isFromResourceSelection,
                    hasExistingProgress,
                    isExplicitNewCourse,
                    isFromNewSelection,
                    progressStateKeys: Object.keys(progressState).length,
                    finalDecision: isNewCourse ? 'NEW COURSE' : 'CONTINUING COURSE'
                });
                
                // Handle visited links based on course type
                const visitedLinksKey = getVisitedLinksKey(domain, learningPathId, user?.id || user?._id);
                let finalVisitedLinks = {};
                
                if (isNewCourse) {
                    // For truly NEW courses: completely reset all data for this user and course
                    console.log(`🆕 NEW COURSE detected for user ${user?.id || user?._id} - complete reset`);
                    console.log('✅ New course conditions met:', {
                        explicitNewCourse: location.state?.isNewCourse === true,
                        fromNewSelection: !isFromDashboard && !isContinueMode && !continueFromExactPoint,
                        noExistingProgress: !hasExistingProgress,
                        fromResourceSelection: isFromResourceSelection
                    });
                    
                    // Clear ALL data for this specific user-course combination
                    const visitedLinksKey = getVisitedLinksKey(domain, learningPathId, user?.id || user?._id);
                    const progressKey = getProgressKey(domain, learningPathId, user?.id || user?._id);
                    
                    console.log(`🧹 Clearing localStorage for new course:`, {
                        visitedLinksKey,
                        progressKey,
                        userId: user?.id || user?._id
                    });
                    
                    localStorage.removeItem(visitedLinksKey);
                    localStorage.removeItem(progressKey);
                    
                    // Start with completely empty visited links
                    finalVisitedLinks = {};
                    
                    // Reset progress state
                    setProgress({});
                    
                    console.log(`✨ Fresh start initialized for user ${user?.id || user?._id}`);
                } else {
                    // For CONTINUING courses: load existing visited links
                    console.log('🔄 Continuing course - loading existing visited links');
                    console.log('Continuing course conditions:', {
                        fromDashboard: isFromDashboard,
                        continueMode: isContinueMode,
                        exactContinuation: continueFromExactPoint,
                        hasProgress: Object.keys(progressState).length > 0
                    });
                    const savedVisitedLinks = JSON.parse(localStorage.getItem(visitedLinksKey) || '{}');
                    
                    // Auto-mark resources as visited for any completed tasks using helper function
                    const progressKey = getProgressKey(domain, learningPathId, user?.id || user?._id);
                    const existingProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
                    
                    finalVisitedLinks = autoMarkResourcesForCompletedTasks(
                        tasks, 
                        existingProgress, 
                        domain, 
                        learningPathId, 
                        user?.id || user?._id
                    );
                }
                
                // Set the visited links state
                setVisitedLinks(finalVisitedLinks);
            } catch (err) {
                console.error('Error generating daily tasks:', err);
                setError('Failed to generate daily tasks');
            } finally {
                setLoading(false);
            }
        };

        generateDailyTasks();
    }, [domain, selectedSkills, analysis, level, navigate, isFromDashboard, learningPathId, pathId]);

    // Generate AI suggestions when AI assistance is enabled and tasks are loaded
    useEffect(() => {
        if (aiAssistanceEnabled && dailyTasks.length > 0 && !loading) {
            const generateSuggestions = async () => {
                await generateAISuggestions();
            };
            generateSuggestions();
        }
    }, [aiAssistanceEnabled, dailyTasks.length, Object.keys(progress).length, currentDay, loading]);

    // Auto-mark resources as visited for completed tasks whenever progress or tasks change
    // But only for continuing courses, not new courses
    useEffect(() => {
        if (dailyTasks.length > 0 && Object.keys(progress).length > 0) {
            // Only auto-mark if this is a continuing course (has progress or from dashboard)
            const isContinuingCourse = isFromDashboard || isContinueMode || Object.keys(progress).length > 0;
            
            if (isContinuingCourse) {
                console.log('🔄 Auto-marking visited links for continuing course with progress');
                const updatedVisitedLinks = autoMarkResourcesForCompletedTasks(
                    dailyTasks, 
                    progress, 
                    domain, 
                    learningPathId, 
                    user?.id || user?._id
                );
                setVisitedLinks(updatedVisitedLinks);
            } else {
                console.log('🆕 Skipping auto-mark for new course');
            }
        }
    }, [dailyTasks.length, Object.keys(progress).length, domain, learningPathId, user?.id, user?._id, isFromDashboard, isContinueMode]);

    const handleTaskComplete = async (dayNumber, taskIndex) => {
        try {
            const taskId = `day-${dayNumber}-task-${taskIndex}`;
            const userId = user?.id || user?._id;
            
            // Mark task as complete in local progress tracking
            setProgress(prev => ({
                ...prev,
                [taskId]: true
            }));

            // Auto-mark all resources in this task as visited when task is completed
            const currentDayData = dailyTasks.find(day => day.day === dayNumber);
            if (currentDayData && currentDayData.tasks[taskIndex] && currentDayData.tasks[taskIndex].resources) {
                const task = currentDayData.tasks[taskIndex];
                const visitedLinksKey = getVisitedLinksKey(domain, learningPathId, userId);
                const currentVisitedLinks = JSON.parse(localStorage.getItem(visitedLinksKey) || '{}');
                
                // Mark all resources in this task as visited
                task.resources.forEach((_, resIndex) => {
                    const linkId = `day-${dayNumber}-task-${taskIndex}-link-${resIndex}`;
                    currentVisitedLinks[linkId] = true;
                });
                
                // Update visited links state and localStorage
                setVisitedLinks(prev => ({
                    ...prev,
                    ...currentVisitedLinks
                }));
                localStorage.setItem(visitedLinksKey, JSON.stringify(currentVisitedLinks));
            }

            // Store progress in local storage as backup
            const progressKey = getProgressKey(domain, learningPathId, userId);
            const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
            currentProgress[taskId] = {
                completed: true,
                completedAt: new Date().toISOString(),
                domain: domain.id || domain.name,
                day: dayNumber,
                taskIndex: taskIndex,
                userId: userId
            };
            localStorage.setItem(progressKey, JSON.stringify(currentProgress));

            // Always save progress to backend for persistence across sessions
            try {
                const pathId = learningPathId || `${domain.id || domain.name}-${Date.now()}`;
                
                // Save individual task completion to backend
                await api.completeTask({
                    domain: domain.id || domain.name,
                    day: dayNumber,
                    taskIndex: taskIndex,
                    taskId: taskId,
                    learningPathId: pathId,
                    userId: userId
                });

                // Calculate overall progress
                const allTasks = dailyTasks.reduce((acc, day) => acc + day.tasks.length, 0);
                const completedTasksCount = Object.keys(currentProgress).length;
                let overallProgressPercent = Math.round((completedTasksCount / allTasks) * 100);
                
                // Ensure 100% completion is detected correctly
                if (allTasks > 0 && completedTasksCount >= allTasks) {
                    overallProgressPercent = 100;
                    console.log(`🎯 100% completion detected: ${completedTasksCount}/${allTasks} tasks completed`);
                }
                
                console.log(`📊 Progress calculation for user ${userId}:`, {
                    allTasks,
                    completedTasksCount,
                    overallProgressPercent,
                    justCompleted: taskId,
                    domain: domain.id || domain.name
                });
                
                // Check if all tasks for the day are complete
                const dayTasks = dailyTasks.find(d => d.day === dayNumber)?.tasks || [];
                const completedDayTasks = dayTasks.filter((_, index) => 
                    progress[`day-${dayNumber}-task-${index}`] || index === taskIndex
                );
                
                const newCurrentDay = completedDayTasks.length === dayTasks.length ? 
                    Math.min(dayNumber + 1, dailyTasks.length) : currentDay;

                // Update overall learning path progress in backend
                await api.updateProgress({
                    learningPathId: pathId,
                    domain: domain.id || domain.name,
                    currentDay: newCurrentDay,
                    totalDays: dailyTasks.length,
                    completedTasks: currentProgress,
                    overallProgress: overallProgressPercent,
                    userId: userId
                });

                console.log(`✅ Progress saved to backend for user ${userId}:`, {
                    taskId,
                    currentDay: newCurrentDay,
                    overallProgress: overallProgressPercent,
                    completedTasksCount,
                    isCompleted: overallProgressPercent >= 100,
                    pathId,
                    domain: domain.id || domain.name
                });

                // Dispatch progress update event for Dashboard refresh
                window.dispatchEvent(new CustomEvent('progressUpdated', {
                    detail: {
                        userId: userId,
                        domain: domain.id || domain.name,
                        pathId: pathId,
                        overallProgress: overallProgressPercent,
                        currentDay: newCurrentDay,
                        taskId: taskId,
                        updatedAt: new Date().toISOString()
                    }
                }));
                
                // If course is completed (100%), trigger additional completion logic
                if (overallProgressPercent >= 100) {
                    console.log(`🎉 COURSE COMPLETION DETECTED for user ${userId}! Domain: ${domain.id || domain.name}`);
                    console.log(`📊 Final progress: ${overallProgressPercent}%, Path ID: ${pathId}`);
                    
                    // Update learning path status in backend
                    try {
                        await api.updateLearningPath(pathId, {
                            status: 'completed',
                            completedAt: new Date().toISOString(),
                            finalProgress: 100
                        });
                        
                        console.log(`✅ Learning path marked as completed in backend for user ${userId}`);
                        
                        // Trigger dashboard refresh to show updated completion count
                        if (window.dashboardRefresh) {
                            console.log(`🔄 Triggering dashboard refresh for user ${userId}`);
                            setTimeout(() => window.dashboardRefresh(), 500);
                        }
                        
                        // Dispatch completion event with enhanced data
                        console.log(`📡 Dispatching courseCompleted event for user ${userId}`);
                        window.dispatchEvent(new CustomEvent('courseCompleted', {
                            detail: {
                                userId: userId,
                                domain: domain.id || domain.name,
                                pathId: pathId,
                                completedAt: new Date().toISOString(),
                                finalProgress: 100,
                                overallProgressPercent: overallProgressPercent
                            }
                        }));
                        
                        // Force trigger dashboard refresh multiple ways
                        setTimeout(() => {
                            if (window.dashboardRefresh) {
                                console.log(`🔄 Additional dashboard refresh for completion`);
                                window.dashboardRefresh();
                            }
                            
                            // Also dispatch a localStorage event as backup
                            localStorage.setItem('dashboardRefresh', new Date().toISOString());
                            window.dispatchEvent(new StorageEvent('storage', {
                                key: 'dashboardRefresh',
                                newValue: new Date().toISOString()
                            }));
                        }, 100);
                        
                        // Additional progress update event
                        console.log(`📡 Dispatching final progressUpdated event for user ${userId}`);
                        window.dispatchEvent(new CustomEvent('progressUpdated', {
                            detail: {
                                userId: userId,
                                domain: domain.id || domain.name,
                                pathId: pathId,
                                overallProgress: 100,
                                currentDay: newCurrentDay,
                                taskId: taskId,
                                updatedAt: new Date().toISOString(),
                                isComplete: true
                            }
                        }));
                        
                    } catch (completionError) {
                        console.warn('Failed to update completion status:', completionError);
                    }
                }
                
                if (completedDayTasks.length === dayTasks.length) {
                    console.log(`Day ${dayNumber} completed for user ${userId}!`);
                    setCurrentDay(newCurrentDay);
                }

            } catch (apiError) {
                console.warn(`Failed to save progress to backend for user ${userId}:`, apiError);
                // Show user-friendly message
                setError('Progress saved locally but failed to sync with server. Your progress will be restored on next login.');
                // Auto-clear error after 5 seconds
                setTimeout(() => setError(null), 5000);
            }

            // Check if all tasks for the day are complete (local state update)
            const dayTasks = dailyTasks.find(d => d.day === dayNumber)?.tasks || [];
            const completedTasks = dayTasks.filter((_, index) => 
                progress[`day-${dayNumber}-task-${index}`] || index === taskIndex
            );

            if (completedTasks.length === dayTasks.length) {
                // All tasks completed for this day
                console.log(`Day ${dayNumber} completed locally for user ${userId}!`);
                
                // Show success message or animation
                setError(null); // Clear any previous errors
            }
        } catch (err) {
            console.error('Error marking task as complete:', err);
            setError('Failed to save progress. Please try again.');
        }
    };

    const handleLinkClick = (dayNumber, taskIndex, linkIndex) => {
        const linkId = `day-${dayNumber}-task-${taskIndex}-link-${linkIndex}`;
        const updatedVisitedLinks = {
            ...visitedLinks,
            [linkId]: true
        };
        
        setVisitedLinks(updatedVisitedLinks);
        
        // Save visited links to localStorage
        const userId = user?.id || user?._id || 'guest';
        const visitedLinksKey = getVisitedLinksKey(domain, learningPathId, userId);
        localStorage.setItem(visitedLinksKey, JSON.stringify(updatedVisitedLinks));
    };

    const areAllLinksVisited = (dayNumber, taskIndex, task) => {
        if (!task.resources || task.resources.length === 0) return true;
        
        return task.resources.every((_, linkIndex) => {
            const linkId = `day-${dayNumber}-task-${taskIndex}-link-${linkIndex}`;
            return visitedLinks[linkId];
        });
    };

    const handleCompleteAllTasks = () => {
        // Navigate to feedback page when all tasks are completed
        navigate('/feedback', {
            state: {
                domain,
                selectedSkills,
                level,
                completedDays: currentDay,
                totalTasks: dailyTasks.reduce((total, day) => total + day.tasks.length, 0)
            }
        });
    };

    const isTaskCompleted = (dayNumber, taskIndex) => {
        const taskId = `day-${dayNumber}-task-${taskIndex}`;
        return progress[taskId] || false;
    };

    const isDayCompleted = (dayNumber) => {
        const dayTasks = dailyTasks.find(d => d.day === dayNumber)?.tasks || [];
        // Days with zero tasks are not considered completed
        if (dayTasks.length === 0) {
            return false;
        }
        return dayTasks.every((_, index) => isTaskCompleted(dayNumber, index));
    };

    const allTasksCompleted = dailyTasks.length > 0 && dailyTasks.every(day => isDayCompleted(day.day));

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-content">
                    <div className="error-message">{error}</div>
                    <button
                        onClick={() => navigate(-1)}
                        className="error-button"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="learning-path-container">
            <div className="learning-path-content">
                {/* Back to Dashboard Button */}
                <div className="back-button-container">
                    <button
                        onClick={() => {
                            // Trigger dashboard refresh before navigation
                            window.dispatchEvent(new CustomEvent('learningPathUpdated', {
                                detail: { refresh: true }
                            }));
                            // Also call global refresh function
                            if (window.dashboardRefresh) {
                                window.dashboardRefresh();
                            }
                            navigate('/dashboard');
                        }}
                        className="back-to-dashboard-button"
                    >
                        ← Back to Dashboard
                    </button>
                    
                    {/* Save Course Button */}
                    {!isSaved && (
                        <button
                            onClick={saveCourseToBackend}
                            disabled={isSaving}
                            className="save-course-button"
                            style={{
                                marginLeft: '10px',
                                background: isSaving ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? '💾 Saving...' : '💾 Save Course'}
                        </button>
                    )}
                    
                    {/* Save Success Message */}
                    {isSaved && (
                        <span 
                            className="save-success-message"
                            style={{
                                marginLeft: '10px',
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}
                        >
                            ✅ Course Saved!
                        </span>
                    )}
                    
                    {/* Save Error Message */}
                    {saveError && (
                        <div 
                            className="save-error-message"
                            style={{
                                marginLeft: '10px',
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                maxWidth: '300px'
                            }}
                        >
                            ❌ {saveError}
                            <button 
                                onClick={() => setSaveError(null)}
                                style={{
                                    marginLeft: '10px',
                                    background: 'transparent',
                                    border: '1px solid white',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>

                <div className="learning-path-header">
                    <h1 className="learning-path-title">
                        Your {level?.name || level?.id || 'Beginner'} Learning Journey
                    </h1>
                    <p className="learning-path-subtitle">
                        {domain?.title || domain?.name || domain?.id || 'Programming'} Development Path
                    </p>
                    {isFromDashboard && progressPercentage !== undefined && (
                        <div className="resume-info">
                            <span className="resume-status">
                                {progressPercentage === 100 ? '🎓 Completed!' : 
                                 progressPercentage > 0 ? `📚 Resuming Day ${currentDay} (${progressPercentage}% Complete)` : 
                                 '🚀 Starting fresh!'}
                            </span>
                        </div>
                    )}
                    {continueFromExactPoint && (
                        <div className="continuation-banner">
                            <div className="continuation-content">
                                <h4>🔄 Welcome Back!</h4>
                                <p>Continuing from Day {currentDay} - Your progress has been restored.</p>
                                <p>Completed tasks: {Object.keys(progress).filter(key => progress[key]).length}</p>
                            </div>
                        </div>
                    )}
                    <p className="learning-path-skills">
                        Selected Skills: {selectedSkills?.map(skill => typeof skill === 'object' ? skill.name : skill).join(', ')}
                    </p>
                </div>

                {/* New Learning Path Created Banner */}
                {isNewlyCreated && (
                    <div className="new-path-banner">
                        <div className="banner-content">
                            <h3>🎉 Learning Path Created Successfully!</h3>
                            <p>Your personalized learning journey has been saved to your dashboard.</p>
                            <div className="banner-actions">
                                <button 
                                    onClick={() => {
                                        console.log('View on Dashboard clicked - ensuring path is saved');
                                        
                                        // Ensure the current learning path is saved before navigating
                                        if (learningPathData || (domain && level)) {
                                            const pathToSave = learningPathData || {
                                                _id: learningPathId || `path-${Date.now()}`,
                                                domain: domain.title || domain.name || domain,
                                                level: level.name || level.id || level,
                                                skills: selectedSkills || analysis?.skills || [],
                                                estimatedDuration: analysis?.estimatedDuration || '10 days',
                                                modules: (selectedSkills || analysis?.skills || []).map((skill, index) => `Module ${index + 1}: ${skill.name || skill}`),
                                                completedModules: 0,
                                                progress: 0,
                                                createdAt: new Date().toISOString(),
                                                isAIGenerated: true,
                                                userId: user?.id || user?._id // IMPORTANT: Add userId for proper filtering
                                            };
                                            
                                            const userStorageKey = getUserStorageKey(user?.id);
                                            const existingPaths = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
                                            const pathIndex = existingPaths.findIndex(path => path._id === pathToSave._id);
                                            
                                            if (pathIndex >= 0) {
                                                existingPaths[pathIndex] = pathToSave;
                                            } else {
                                                existingPaths.push(pathToSave);
                                            }
                                            
                                            localStorage.setItem(userStorageKey, JSON.stringify(existingPaths));
                                            console.log('Ensured learning path is saved before navigation:', pathToSave);
                                        }
                                        
                                        // Trigger events to update dashboard
                                        window.dispatchEvent(new CustomEvent('learningPathUpdated', {
                                            detail: { refresh: true, source: 'viewOnDashboard' }
                                        }));
                                        
                                        // Also call global refresh function
                                        if (window.dashboardRefresh) {
                                            console.log('Calling global dashboard refresh function');
                                            window.dashboardRefresh();
                                        }
                                        
                                        // Navigate to dashboard
                                        navigate('/dashboard');
                                    }}
                                    className="go-to-dashboard-button"
                                >
                                    📊 View on Dashboard
                                </button>
                                <button 
                                    onClick={() => setIsNewlyCreated(false)}
                                    className="dismiss-banner-button"
                                >
                                    Continue Learning
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Assistant Panel */}
                {aiAssistanceEnabled && (
                    <div className="ai-assistant-panel">
                        <div className="ai-panel-header">
                            <h3>🤖 AI Learning Assistant</h3>
                            <div className="ai-toggle">
                                <button 
                                    onClick={() => setAiAssistanceEnabled(false)}
                                    className="ai-toggle-button"
                                >
                                    Hide AI Assistant
                                </button>
                            </div>
                        </div>
                        
                        {loadingAISuggestions ? (
                            <div className="ai-loading">
                                <div className="ai-loading-spinner"></div>
                                <p>AI is analyzing your progress...</p>
                            </div>
                        ) : aiSuggestions ? (
                            <div className="ai-suggestions">
                                <div className="ai-suggestion-section">
                                    <h4>💭 Motivation</h4>
                                    <p className="ai-motivational-message">{aiSuggestions.motivational}</p>
                                </div>
                                
                                {aiSuggestions.nextSteps.length > 0 && (
                                    <div className="ai-suggestion-section">
                                        <h4>🎯 Next Steps</h4>
                                        <ul className="ai-next-steps">
                                            {aiSuggestions.nextSteps.map((step, index) => (
                                                <li key={index}>{step}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <div className="ai-suggestion-section">
                                    <h4>📚 Additional Resources</h4>
                                    <div className="ai-resources">
                                        {aiSuggestions.resources.map((resource, index) => (
                                            <span key={index} className="ai-resource-tag">{resource}</span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="ai-suggestion-section">
                                    <h4>💡 Study Tips</h4>
                                    <ul className="ai-study-tips">
                                        {aiSuggestions.tips.map((tip, index) => (
                                            <li key={index}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="ai-refresh">
                                    <button 
                                        onClick={generateAISuggestions}
                                        className="ai-refresh-button"
                                        disabled={loadingAISuggestions}
                                    >
                                        🔄 Refresh AI Suggestions
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="ai-placeholder">
                                <p>Click "Refresh AI Suggestions" to get personalized learning guidance!</p>
                                <button 
                                    onClick={generateAISuggestions}
                                    className="ai-generate-button"
                                >
                                    🧠 Generate AI Suggestions
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Show AI Toggle for users who disabled it */}
                {!aiAssistanceEnabled && enableAIAssistance && (
                    <div className="ai-toggle-section">
                        <button 
                            onClick={() => setAiAssistanceEnabled(true)}
                            className="ai-enable-button"
                        >
                            🤖 Enable AI Assistant
                        </button>
                    </div>
                )}

                {allTasksCompleted && (
                    <div className="completion-banner">
                        <h2>
                            🎉 Congratulations! You've completed your learning journey!
                        </h2>
                        <div className="completion-actions">
                            <button
                                onClick={handleCompleteAllTasks}
                                className="completion-button"
                            >
                                Share Your Feedback
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="grid gap-6">
                    {dailyTasks.map((dayData, dayIndex) => {
                        const dayCompleted = isDayCompleted(dayData.day);
                        const completedTasksCount = dayData.tasks.filter((_, index) => 
                            isTaskCompleted(dayData.day, index)
                        ).length;

                        return (
                            <div 
                                key={dayData.day} 
                                className={`day-card ${dayCompleted ? 'completed' : ''}`}
                                style={{animationDelay: `${dayIndex * 0.1}s`}}
                            >
                                <div className="day-card-header">
                                    <h2 className="day-title">
                                        Day {dayData.day}: {getDayTheme(dayData.day, level?.id || level?.name || level || 'beginner')}
                                    </h2>
                                    <div className="day-progress">
                                        <span className="progress-text">
                                            {completedTasksCount}/{dayData.tasks.length} tasks completed
                                        </span>
                                        {dayCompleted && (
                                            <span className="day-complete-badge">
                                                ✓ Day Complete
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div style={{padding: '0 2rem 2rem'}}>
                                    <div className="space-y-4">
                                        {dayData.tasks.map((task, taskIndex) => {
                                            const taskCompleted = isTaskCompleted(dayData.day, taskIndex);
                                            const allLinksVisited = areAllLinksVisited(dayData.day, taskIndex, task);
                                            
                                            return (
                                                <div 
                                                    key={taskIndex}
                                                    className={`task-card ${taskCompleted ? 'completed' : ''}`}
                                                    style={{animationDelay: `${(dayIndex * 0.1) + (taskIndex * 0.05)}s`}}
                                                >
                                                    <div className="task-header">
                                                        <div className="task-content">
                                                            <h3 className="task-title">
                                                                Task {taskIndex + 1}: {task.title}
                                                            </h3>
                                                            <p className="task-description">{task.description}</p>
                                                            
                                                            {task.resources && task.resources.length > 0 && (
                                                                <div className="resources-section">
                                                                    <h4 className="resources-header">
                                                                        {(() => {
                                                                            const visitedCount = task.resources.filter((_, linkIndex) => visitedLinks[`day-${dayData.day}-task-${taskIndex}-link-${linkIndex}`]).length;
                                                                            const totalCount = task.resources.length;
                                                                            
                                                                            if (visitedCount > 0) {
                                                                                return `📚 Resources (${visitedCount}/${totalCount} visited)`;
                                                                            } else {
                                                                                return `📚 Resources (${totalCount} available)`;
                                                                            }
                                                                        })()}
                                                                    </h4>
                                                                    <ul className="resources-list">
                                                                        {task.resources.map((resource, resIndex) => {
                                                                            const linkId = `day-${dayData.day}-task-${taskIndex}-link-${resIndex}`;
                                                                            const isVisited = visitedLinks[linkId];
                                                                            
                                                                            return (
                                                                                <li key={resIndex}>
                                                                                    <a 
                                                                                        href={resource.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        onClick={() => handleLinkClick(dayData.day, taskIndex, resIndex)}
                                                                                        className={`resource-link ${isVisited ? 'visited' : ''}`}
                                                                                    >
                                                                                        <span className="resource-icon">{getResourceIcon(resource.type)}</span>
                                                                                        <span className="resource-title">{resource.title}</span>
                                                                                        <span className="external-icon">↗</span>
                                                                                        {isVisited && <span className="visited-check">✓</span>}
                                                                                    </a>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ul>
                                                                    {!allLinksVisited && !taskCompleted && (
                                                                        <div className="visit-warning">
                                                                            📌 Visit all resources to enable task completion
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            <div className="task-time">
                                                                <span className="font-medium">Estimated time:</span> {task.estimatedTime || '1-2 hours'}
                                                            </div>
                                                        </div>
                                                        
                                                        <button
                                                            onClick={() => handleTaskComplete(dayData.day, taskIndex)}
                                                            disabled={taskCompleted || !allLinksVisited}
                                                            className={`task-button ${
                                                                taskCompleted
                                                                    ? 'completed'
                                                                    : !allLinksVisited
                                                                    ? 'disabled'
                                                                    : 'active'
                                                            }`}
                                                            title={!allLinksVisited && !taskCompleted ? 'Visit all resources first' : ''}
                                                        >
                                                            {taskCompleted ? '✓ Completed' : !allLinksVisited ? 'Visit All Links' : 'Mark Complete'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LearningPath;
