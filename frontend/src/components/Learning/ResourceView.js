import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResourceView = () => {
    const { skillId } = useParams();
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await axios.get(`/api/resources/${skillId}`);
                if (response.data.success) {
                    setResources(response.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch resources');
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [skillId]);

    const handleFeedback = async (resourceId) => {
        try {
            await axios.post('/api/feedback', {
                resourceId,
                feedback
            });
            setFeedback('');
            alert('Thank you for your feedback!');
        } catch (err) {
            alert('Failed to submit feedback');
        }
    };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Learning Resources</h1>
            
            <div className="space-y-8">
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <div key={level} className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 capitalize">{level} Level</h2>
                        <div className="space-y-4">
                            {resources
                                .filter(resource => resource.level === level)
                                .map((resource) => (
                                    <div key={resource._id} className="border-b pb-4">
                                        <h3 className="font-medium text-lg mb-2">{resource.title}</h3>
                                        <p className="text-gray-600 mb-3">{resource.description}</p>
                                        <div className="flex items-center justify-between">
                                            <a
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                Visit Resource →
                                            </a>
                                            <span className="text-sm text-gray-500">
                                                Type: {resource.type}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-4">
                                            <textarea
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                placeholder="How was this resource? Was it helpful?"
                                                className="w-full p-2 border rounded-md mb-2"
                                                rows={3}
                                            />
                                            <button
                                                onClick={() => handleFeedback(resource._id)}
                                                disabled={!feedback}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                Submit Feedback
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResourceView;
