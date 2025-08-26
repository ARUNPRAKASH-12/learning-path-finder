import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AIAnalysis = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { domain, selectedSkills } = location.state || {};
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const analyzeSkills = async () => {
            if (!domain || !selectedSkills) {
                navigate('/domain-selection');
                return;
            }

            try {
                const response = await axios.post('/api/ai/analyze', {
                    domain,
                    skills: selectedSkills
                });

                if (response.data.success) {
                    setAnalysis(response.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to analyze skills');
            } finally {
                setLoading(false);
            }
        };

        analyzeSkills();
    }, [domain, selectedSkills, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">{error}</div>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Analysis Results</h1>
            
            {analysis && (
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Learning Path Overview</h2>
                        <p className="text-gray-600">{analysis.overview}</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Recommended Learning Order</h2>
                        <ol className="list-decimal list-inside space-y-4">
                            {analysis.recommendedOrder.map((item, index) => (
                                <li key={index} className="text-gray-600">
                                    <span className="font-medium text-gray-900">{item.skill}</span>
                                    <p className="ml-6 mt-1">{item.reason}</p>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="text-center mt-8">
                        <button
                            onClick={() => navigate('/learning-path', { 
                                state: { 
                                    domain,
                                    selectedSkills,
                                    analysis
                                }
                            })}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700"
                        >
                            Continue to Learning Path
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAnalysis;
