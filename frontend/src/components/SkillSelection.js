import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';

const SkillSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [domainData, setDomainData] = useState(null);

    useEffect(() => {
        const state = location.state || {};
        if (!state.domain) {
            console.error('No domain specified');
            navigate('/domain-selection');
            return;
        }

        setDomainData(state.domain);
        setLoading(true);
        
        // If we have analysis data in state, use it
        if (state.analysis && Array.isArray(state.analysis.skills)) {
            setAnalysisData({
                ...state.analysis,
                level: state.level // Store level information
            });
            setLoading(false);
        } else {
            // Otherwise, fetch it with level if available
            const level = state.level ? state.level.id : null;
            fetchAnalysis(state.domain, level);
        }
    }, [location.state, navigate, fetchAnalysis]);

    // Fetch analysis if not provided in state
    const fetchAnalysis = useCallback(async (domain, level = null) => {
        try {
            setLoading(true);
            setError(null);
            
            let response;
            if (level) {
                // Use the level-specific API if level is provided
                response = await api.analyzeDomainWithLevel(domain.id || domain, level);
            } else {
                response = await api.analyzeDomain(domain.id || domain);
            }
            
            setAnalysisData({
                ...response.data.analysis,
                level: level // Store the level information
            });
        } catch (err) {
            console.error('Failed to fetch analysis:', err);
            setError(err.response?.data?.message || 'Failed to analyze domain');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSkillSelect = (skill) => {
        if (!skill || !skill.name) return; // Validate skill object
        
        setSelectedSkills(prev => 
            prev.includes(skill.name)
                ? prev.filter(s => s !== skill.name)
                : [...prev, skill.name]
        );
    };

    const handleContinue = async () => {
        if (selectedSkills.length === 0 || !analysisData?.skills) return;

        try {
            setLoading(true);
            setError(null);
            
            // Get full skill objects for selected skills
            const selectedSkillObjects = selectedSkills.map(skillName => 
                analysisData.skills.find(s => s?.name === skillName)
            ).filter(Boolean);

            // Create resources for each skill
            const responses = await Promise.all(
                selectedSkillObjects.map(skill =>
                    api.getSkillResources(skill.name, skill.level || 'beginner')
                )
            );

            const resources = responses.map(r => r.data.data).flat();
            
            // Navigate with all necessary data
            navigate('/learning-path', {
                state: {
                    domain: domainData,
                    level: analysisData.level ? { id: analysisData.level, name: analysisData.level } : { id: 'beginner', name: 'Beginner' },
                    selectedSkills: selectedSkillObjects,
                    analysis: analysisData,
                    resources,
                    pathId: location.state?.pathId,
                    isNewCourse: location.state?.isNewCourse || true, // Pass through new course flag
                    userId: location.state?.userId
                }
            });
        } catch (err) {
            console.error('Failed to fetch resources:', err);
            setError(err.response?.data?.message || 'Failed to fetch resources');
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Loading...
                    </h1>
                    <p className="text-gray-600">Please wait while we analyze the skills...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">
                        Error
                    </h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/domain-selection')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!domainData || !analysisData || !analysisData.skills) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        No Data Available
                    </h1>
                    <p className="text-gray-600 mb-4">Please select a domain first.</p>
                    <button
                        onClick={() => navigate('/domain-selection')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md"
                    >
                        Select Domain
                    </button>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Select Skills to Learn
                </h1>
                <p className="text-lg text-gray-600">
                    Choose the skills you want to master in {domainData.title || domainData}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Select one or more skills to create your learning path
                </p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {analysisData?.skills?.length > 0 ? (
                    analysisData.skills.map((skill, index) => (
                        skill && skill.name ? (
                            <div
                                key={skill.name || index}
                                onClick={() => handleSkillSelect(skill)}
                                className={`p-6 bg-white rounded-lg shadow-md cursor-pointer transition-all duration-200 ${
                                    selectedSkills.includes(skill.name)
                                        ? 'ring-2 ring-indigo-600'
                                        : 'hover:shadow-lg'
                                }`}
                            >
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {skill.name}
                                </h3>
                                <p className="text-gray-600 mb-2">
                                    {skill.description || 'No description available'}
                                </p>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Level: {skill.level || 'beginner'}</span>
                                    <span>Priority: {skill.priority || 'medium'}</span>
                                </div>
                            </div>
                        ) : null
                    ))
                ) : (
                    <div className="col-span-3 text-center text-gray-600">
                        No skills available. Please go back and try again.
                    </div>
                )}
            </div>

            <div className="text-center">
                <button
                    onClick={() => navigate('/domain-selection')}
                    className="mr-4 px-6 py-2 text-gray-600 hover:text-gray-900"
                >
                    Back
                </button>
                <button
                    onClick={handleContinue}
                    disabled={loading || selectedSkills.length === 0}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : `Continue with ${selectedSkills.length} skill${selectedSkills.length === 1 ? '' : 's'}`}
                </button>
            </div>
        </div>
    );
};

export default SkillSelection;
