import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const domains = [
    {
        id: 'frontend',
        title: 'Frontend Developer',
        icon: '💻',
        description: 'Create user interfaces and web applications'
    },
    {
        id: 'backend',
        title: 'Backend Developer',
        icon: '⚙️',
        description: 'Build server-side logic and databases'
    },
    {
        id: 'fullstack',
        title: 'Fullstack Developer',
        icon: '🔄',
        description: 'Develop both frontend and backend'
    },
    {
        id: 'security',
        title: 'Ethical Hacker',
        icon: '🔒',
        description: 'Protect systems and find vulnerabilities'
    },
    {
        id: 'devops',
        title: 'DevOps Engineer',
        icon: '🚀',
        description: 'Automate deployment and manage infrastructure'
    }
];

const DomainSelection = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [showLevels, setShowLevels] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [completedCourses, setCompletedCourses] = useState([]);
    const [loadingCompleted, setLoadingCompleted] = useState(true);
    const navigate = useNavigate();
    
    const levels = [
        { id: 'beginner', title: 'Beginner', icon: '🌱', description: 'New to this domain' },
        { id: 'intermediate', title: 'Intermediate', icon: '📚', description: 'Some experience in this field' },
        { id: 'advanced', title: 'Professional', icon: '🏆', description: 'Significant experience in this domain' }
    ];

    // Fetch completed courses to filter out completed domain-level combinations
    useEffect(() => {
        const fetchCompletedCourses = async () => {
            if (!user?.id && !user?._id) {
                setLoadingCompleted(false);
                return;
            }

            try {
                setLoadingCompleted(true);
                const [progressResponse, completedPathsResponse] = await Promise.all([
                    api.getProgress(),
                    api.getCompletedLearningPaths()
                ]);
                
                const allProgress = progressResponse.data.data || [];
                const completedPaths = completedPathsResponse.data.data || [];
                
                // Get completed courses for current user
                const userCompletedProgress = allProgress.filter(p => 
                    p.userId === (user?.id || user?._id) && p.overallProgress >= 100
                );
                
                const userCompletedPaths = completedPaths.filter(p => 
                    p.userId === (user?.id || user?._id)
                );
                
                // Combine both sources
                const completedDomainLevels = new Set();
                
                userCompletedProgress.forEach(p => {
                    if (p.domain && p.level) {
                        completedDomainLevels.add(`${p.domain.toLowerCase()}-${p.level.toLowerCase()}`);
                    }
                });
                
                userCompletedPaths.forEach(p => {
                    if (p.domain && p.level) {
                        completedDomainLevels.add(`${p.domain.toLowerCase()}-${p.level.toLowerCase()}`);
                    }
                });
                
                console.log('🏆 Completed domain-level combinations:', Array.from(completedDomainLevels));
                setCompletedCourses(Array.from(completedDomainLevels));
                
            } catch (error) {
                console.error('Error fetching completed courses:', error);
            } finally {
                setLoadingCompleted(false);
            }
        };

        fetchCompletedCourses();
    }, [user]);

    // Check if a domain-level combination is completed
    const isLevelCompleted = (domain, level) => {
        const key = `${domain.id || domain.title.toLowerCase()}-${level.id}`;
        return completedCourses.includes(key);
    };

    const handleDomainSelect = (domain) => {
        setSelectedDomain(domain);
        setShowLevels(true);
    };
    
    const handleLevelSelect = async (level) => {
        // Check if this domain-level combination is already completed
        if (isLevelCompleted(selectedDomain, level)) {
            alert(`You have already completed ${selectedDomain.title} at ${level.title} level! Please choose a different level to continue learning.`);
            return;
        }

        try {
            setSelectedLevel(level);
            setLoading(true);
            setError(null);
            
            // Call the AI API to analyze the selected domain with level
            const domainId = selectedDomain.id || selectedDomain.title;
            const levelId = level.id;
            
            console.log(`🆕 Starting NEW course: ${domainId} - ${levelId} for user ${user?.id || user?._id}`);
            
            // Pass both domain and level to the API
            const response = await api.analyzeDomainWithLevel(domainId, levelId);
            const aiData = response.data && response.data.data;
            
            if (response.data && response.data.success && aiData) {
                // Check if skills exist and are non-empty
                if (aiData.skills && Array.isArray(aiData.skills) && aiData.skills.length > 0) {
                    navigate('/skill-selection', {
                        state: {
                            domain: selectedDomain,
                            level: level,
                            analysis: aiData,
                            isNewCourse: true, // Mark as new course for fresh start
                            userId: user?.id || user?._id
                        }
                    });
                } else {
                    setError('No skills were found for this domain and level. Please try another combination or try again later.');
                }
            } else {
                setError('AI did not return valid results.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to analyze domain');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Choose Your Learning Path
                </h1>
                <p className="text-lg text-gray-600">
                    Select a domain to start your <span className="font-semibold text-indigo-600">AI-guided learning journey</span>
                </p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {loading && (
                <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-md text-center">
                    <div className="mb-2">AI is searching online for the most recommended skills in this domain...</div>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
            )}

            {!showLevels ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {domains.map((domain) => (
                        <button
                            key={domain.id}
                            onClick={() => handleDomainSelect(domain)}
                            disabled={loading}
                            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-left"
                        >
                            <div className="text-4xl mb-4">{domain.icon}</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {domain.title}
                            </h3>
                            <p className="text-gray-600">{domain.description}</p>
                            {loading && (
                                <div className="mt-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <>
                    <div className="mb-8">
                        <button 
                            onClick={() => setShowLevels(false)}
                            className="flex items-center text-indigo-600 hover:text-indigo-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to domains
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mt-4">
                            Selected: {selectedDomain?.title} 
                        </h2>
                        <p className="text-lg text-gray-600 mt-2">Now choose your experience level</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {levels.map((level) => {
                            const isCompleted = isLevelCompleted(selectedDomain, level);
                            return (
                                <button
                                    key={level.id}
                                    onClick={() => handleLevelSelect(level)}
                                    disabled={loading || isCompleted}
                                    className={`p-6 rounded-lg shadow-md transition-all duration-200 text-left relative ${
                                        isCompleted 
                                            ? 'bg-gray-100 opacity-60 cursor-not-allowed' 
                                            : 'bg-white hover:shadow-lg hover:scale-105'
                                    }`}
                                >
                                    {isCompleted && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                            ✅ Completed
                                        </div>
                                    )}
                                    <div className="text-4xl mb-4">{level.icon}</div>
                                    <h3 className={`text-xl font-semibold mb-2 ${
                                        isCompleted ? 'text-gray-500' : 'text-gray-900'
                                    }`}>
                                        {level.title}
                                    </h3>
                                    <p className={isCompleted ? 'text-gray-400' : 'text-gray-600'}>
                                        {isCompleted ? 'Already completed! Choose a higher level.' : level.description}
                                    </p>
                                    {loading && !isCompleted && (
                                        <div className="mt-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default DomainSelection;
