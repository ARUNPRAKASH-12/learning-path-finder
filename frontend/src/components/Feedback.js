import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../services/api';
import './Feedback.css';

const Feedback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { domain, selectedSkills, level, completedDays, totalTasks } = location.state || {};
    
    const [feedback, setFeedback] = useState({
        rating: 0,
        difficulty: '',
        mostHelpful: '',
        improvements: '',
        wouldRecommend: '',
        additionalComments: ''
    });
    
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleRatingClick = (rating) => {
        setFeedback(prev => ({ ...prev, rating }));
    };

    const handleInputChange = (field, value) => {
        setFeedback(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (feedback.rating === 0) {
            alert('Please provide a rating before submitting.');
            return;
        }

        try {
            setSubmitting(true);
            
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please log in to submit feedback.');
                return;
            }
            
            // Ensure the auth token is set for this request
            setAuthToken(token);
            
            console.log('Submitting feedback:', {
                feedback: {
                    ...feedback,
                    domain: domain?.name || domain,
                    skills: selectedSkills,
                    level: level?.name || level,
                    completedDays,
                    totalTasks,
                    completedAt: new Date().toISOString()
                }
            });
            
            // Submit feedback directly without test endpoint
            const response = await api.submitFeedback({
                feedback: {
                    ...feedback,
                    domain: domain?.name || domain,
                    skills: selectedSkills,
                    level: level?.name || level,
                    completedDays,
                    totalTasks,
                    completedAt: new Date().toISOString()
                }
            });

            console.log('Feedback submission successful:', response.data);
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            let errorMessage = 'Failed to submit feedback. Please try again.';
            
            if (error.response) {
                // Server responded with error status
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Network error - no response received
                errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
            } else {
                // Other error
                errorMessage = error.message || 'An unexpected error occurred.';
            }
            
            alert(`Failed to submit feedback. Please try again. Error: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartNewJourney = () => {
        navigate('/domain-selection');
    };

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    if (submitted) {
        return (
            <div className="success-container">
                <div className="success-card">
                    <div className="success-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    
                    <h1 className="success-title">Thank You!</h1>
                    <p className="success-message">
                        Your feedback has been submitted successfully. It will help us improve the learning experience for everyone.
                    </p>
                    
                    <div className="success-actions">
                        <button
                            onClick={handleStartNewJourney}
                            className="action-button-primary"
                        >
                            🚀 Start New Learning Journey
                        </button>
                        <button
                            onClick={handleGoToDashboard}
                            className="action-button-secondary"
                        >
                            📊 Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="feedback-container">
            <div className="feedback-content">
                {/* Header */}
                <div className="feedback-header">
                    <h1 className="feedback-title">
                        🎉 Congratulations on Completing Your Learning Journey!
                    </h1>
                    <div className="completion-summary">
                        <div className="summary-grid">
                            <div className="summary-item">
                                <div className="summary-value">{domain?.name || domain}</div>
                                <div className="summary-label">Domain</div>
                            </div>
                            <div className="summary-item">
                                <div className="summary-value">{completedDays || 0}</div>
                                <div className="summary-label">Days Completed</div>
                            </div>
                            <div className="summary-item">
                                <div className="summary-value">{level?.name || level}</div>
                                <div className="summary-label">Level</div>
                            </div>
                        </div>
                        <div className="skills-summary">
                            <strong>Skills Mastered:</strong> {selectedSkills?.join(', ')}
                        </div>
                    </div>
                </div>

                {/* Feedback Form */}
                <div className="feedback-form-container">
                    <h2 className="form-title">Share Your Experience</h2>
                    
                    <form onSubmit={handleSubmit}>
                        {/* Overall Rating */}
                        <div className="form-group">
                            <label className="form-label">
                                How would you rate your overall learning experience?
                            </label>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingClick(star)}
                                        className={`star-button ${star <= feedback.rating ? 'active' : ''}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty Level */}
                        <div className="form-group">
                            <label className="form-label">
                                How was the difficulty level?
                            </label>
                            <div className="radio-group">
                                {['Too Easy', 'Just Right', 'Too Difficult'].map((option) => (
                                    <div key={option} className="radio-option">
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value={option}
                                            checked={feedback.difficulty === option}
                                            onChange={(e) => handleInputChange('difficulty', e.target.value)}
                                        />
                                        <label>{option}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Most Helpful Aspect */}
                        <div className="form-group">
                            <label className="form-label">
                                What was most helpful in your learning journey?
                            </label>
                            <textarea
                                value={feedback.mostHelpful}
                                onChange={(e) => handleInputChange('mostHelpful', e.target.value)}
                                className="feedback-textarea"
                                placeholder="Tell us what worked best for you..."
                            />
                        </div>

                        {/* Improvements */}
                        <div className="form-group">
                            <label className="form-label">
                                What could we improve?
                            </label>
                            <textarea
                                value={feedback.improvements}
                                onChange={(e) => handleInputChange('improvements', e.target.value)}
                                className="feedback-textarea"
                                placeholder="Any suggestions for improvement..."
                            />
                        </div>

                        {/* Recommendation */}
                        <div className="form-group">
                            <label className="form-label">
                                Would you recommend this learning path to others?
                            </label>
                            <div className="radio-group">
                                {['Definitely', 'Probably', 'Maybe', 'Probably Not', 'Definitely Not'].map((option) => (
                                    <div key={option} className="radio-option">
                                        <input
                                            type="radio"
                                            name="wouldRecommend"
                                            value={option}
                                            checked={feedback.wouldRecommend === option}
                                            onChange={(e) => handleInputChange('wouldRecommend', e.target.value)}
                                        />
                                        <label>{option}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Comments */}
                        <div className="form-group">
                            <label className="form-label">
                                Any additional comments?
                            </label>
                            <textarea
                                value={feedback.additionalComments}
                                onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                                className="feedback-textarea"
                                style={{ minHeight: '150px' }}
                                placeholder="Share any other thoughts about your learning experience..."
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting || feedback.rating === 0}
                            className="submit-button"
                        >
                            {submitting ? '🔄 Submitting...' : '📤 Submit Feedback'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
