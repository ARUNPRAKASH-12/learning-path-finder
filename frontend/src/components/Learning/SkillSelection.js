import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './SkillSelection.css';

const SkillSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { domain, level, analysis } = location.state || {};
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    console.log('SkillSelection received:', { domain, level, analysis });

    // Helper function to get user-specific storage key
    const getUserStorageKey = () => {
        return `userLearningPaths_${user?.id || 'guest'}`;
    };

    if (!domain) {
        navigate('/domain-selection');
        return null;
    }

    const handleSkillSelect = (skill) => {
        const skillName = skill.name || skill.title || skill.id;
        setSelectedSkills(prev => 
            prev.includes(skillName)
                ? prev.filter(s => s !== skillName)
                : [...prev, skillName]
        );
    };

    const handleContinue = async () => {
        if (selectedSkills.length === 0) {
            setError('Please select at least one skill to continue');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Create learning path data - match backend model structure
            const learningPathData = {
                // Backend required fields
                title: `${domain.title || domain.name || domain.id} Learning Path`,
                description: `Learning path for ${domain.title || domain.name || domain.id} at ${level.id || level.name || level} level`,
                difficulty: (level.id || level.name || level).toLowerCase(),
                estimatedDuration: {
                    value: 10,
                    unit: 'days'
                },
                tags: selectedSkills,
                progress: 0,
                
                // Custom fields for frontend compatibility
                domain: domain.title || domain.name || domain.id,
                level: level.id || level.name || level,
                skills: selectedSkills,
                modules: analysis?.skills || [],
                completedModules: 0,
                isAIGenerated: true, // Mark as AI-generated so it appears on dashboard
                userId: user?.id || user?._id // IMPORTANT: Add userId for proper filtering (handle both id and _id)
            };

            // Try to save to backend
            try {
                const response = await api.createLearningPath(learningPathData);
                console.log('Learning path created successfully:', response.data);
                learningPathData._id = response.data.data?._id || Date.now().toString();
                
                // Dispatch event to notify dashboard to refresh
                window.dispatchEvent(new CustomEvent('learningPathCreated', {
                    detail: {
                        userId: user?.id || user?._id,
                        learningPathId: learningPathData._id,
                        domain: domain?.name || domain?.title || domain,
                        timestamp: new Date().toISOString()
                    }
                }));
                
                // Also trigger dashboard refresh if function exists
                if (window.dashboardRefresh && typeof window.dashboardRefresh === 'function') {
                    console.log('Triggering dashboard refresh after learning path creation');
                    setTimeout(() => window.dashboardRefresh(), 500);
                }
                
            } catch (apiError) {
                console.warn('Failed to save to backend, using local storage:', apiError);
                learningPathData._id = Date.now().toString();
                
                // Still dispatch event even if backend save failed
                window.dispatchEvent(new CustomEvent('learningPathCreated', {
                    detail: {
                        userId: user?.id || user?._id,
                        learningPathId: learningPathData._id,
                        domain: domain?.name || domain?.title || domain,
                        timestamp: new Date().toISOString(),
                        backendSaveFailed: true
                    }
                }));
            }

            // Save to localStorage as backup
            const userStorageKey = getUserStorageKey();
            const existingPaths = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
            const updatedPaths = [...existingPaths, learningPathData];
            localStorage.setItem(userStorageKey, JSON.stringify(updatedPaths));

            // Navigate to learning path with selected data
            navigate('/learning-path', {
                state: {
                    domain,
                    level,
                    selectedSkills,
                    analysis,
                    learningPathId: learningPathData._id
                }
            });
        } catch (err) {
            console.error('Error continuing to learning path:', err);
            setError('Failed to continue. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Check if we have analysis data and skills
    if (!analysis || !analysis.skills || !Array.isArray(analysis.skills) || analysis.skills.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        No Skills Data Available
                    </h1>
                    <p className="text-gray-600 mb-4">
                        No skills were found for {domain?.title || 'this domain'}. This might be a temporary issue.
                    </p>
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/domain-selection')}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 mr-4"
                        >
                            Back to Domain Selection
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                        >
                            Try Again
                        </button>
                    </div>
                    <div className="mt-6 text-sm text-gray-500">
                        Debug info: {JSON.stringify({ domain: domain?.title, hasAnalysis: !!analysis, skillsLength: analysis?.skills?.length })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="skill-selection-container">
            <div className="skill-selection-content">
                <div className="skill-header">
                    <h1 className="skill-title">
                        Select Your Skills to Learn
                    </h1>
                    <p className="skill-subtitle">
                        Choose the skills you want to master in {domain.title} at {level?.name || level?.id || 'selected'} level
                    </p>
                    <p className="skill-description">
                        Found {analysis.skills.length} skills perfectly suited for your journey
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {/* Progress Indicator */}
                <div className="selection-progress">
                    <h3 className="progress-title">Selection Progress</h3>
                    <p className="progress-subtitle">
                        Selected {selectedSkills.length} of {analysis.skills.length} skills
                    </p>
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar"
                            style={{width: `${(selectedSkills.length / analysis.skills.length) * 100}%`}}
                        ></div>
                    </div>
                    <p className="progress-text">
                        {selectedSkills.length === 0 ? 'Select skills to get started' : 
                         selectedSkills.length < 3 ? 'Great start! Select a few more for optimal learning' :
                         selectedSkills.length < 6 ? 'Perfect selection! You can continue or add more' :
                         'Excellent! You have a comprehensive skill set selected'}
                    </p>
                </div>

                {/* Selected Skills Summary */}
                {selectedSkills.length > 0 && (
                    <div className="selected-skills-summary">
                        <h3 className="summary-title">Your Selected Skills</h3>
                        <div className="selected-skills-list">
                            {selectedSkills.map((skillName, index) => (
                                <div key={index} className="selected-skill-tag">
                                    <span>{skillName}</span>
                                    <button
                                        onClick={() => {
                                            const skill = analysis.skills.find(s => 
                                                (s.name || s.title || `Skill ${analysis.skills.indexOf(s) + 1}`) === skillName
                                            );
                                            if (skill) handleSkillSelect(skill);
                                        }}
                                        className="remove-skill"
                                        title="Remove skill"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="skills-grid">
                    {analysis.skills.map((skill, index) => {
                        const skillName = skill.name || skill.title || `Skill ${index + 1}`;
                        const isSelected = selectedSkills.includes(skillName);
                        
                        return (
                            <div
                                key={index}
                                onClick={() => handleSkillSelect(skill)}
                                className={`skill-card ${isSelected ? 'selected' : ''}`}
                                style={{animationDelay: `${index * 0.05}s`}}
                            >
                                <div className="skill-card-header">
                                    <h3 className="skill-name">
                                        {skillName}
                                    </h3>
                                    {skill.priority && (
                                        <span className={`skill-priority ${skill.priority}`}>
                                            {skill.priority}
                                        </span>
                                    )}
                                </div>
                                
                                <p className="skill-description">
                                    {skill.description || 'Important skill for your learning journey'}
                                </p>
                                
                                <div className="skill-meta">
                                    <span className="skill-level">
                                        {skill.level || level?.name || level?.id || 'All Levels'}
                                    </span>
                                    <span className="skill-time">
                                        {skill.estimatedLearningTime || '2-4 weeks'}
                                    </span>
                                </div>

                                <div className="selected-indicator">
                                    ✓
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="continue-section">
                    <button
                        onClick={handleContinue}
                        disabled={loading || selectedSkills.length === 0}
                        className="continue-button"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                Processing...
                            </div>
                        ) : (
                            `Continue with ${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkillSelection;
