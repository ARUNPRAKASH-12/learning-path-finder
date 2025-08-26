import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './CompletedCourses.css';

const CompletedCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompletedCourses();
    
    // Set up event listeners for real-time updates
    const handleCourseCompleted = (e) => {
      console.log('CompletedCourses: Course completion detected, refreshing...', e.detail);
      setTimeout(() => fetchCompletedCourses(), 500);
      // Additional refresh to ensure data is captured
      setTimeout(() => fetchCompletedCourses(), 2000);
    };
    
    const handleProgressUpdate = (e) => {
      if (e.detail?.overallProgress >= 100 || e.detail?.isComplete) {
        console.log('CompletedCourses: Progress completion detected, refreshing...', e.detail);
        setTimeout(() => fetchCompletedCourses(), 1000);
        setTimeout(() => fetchCompletedCourses(), 3000);
      }
    };
    
    // Handle new course creation/enrollment
    const handleLearningPathCreated = (e) => {
      console.log('CompletedCourses: New learning path created, future completion tracking enabled');
      // Don't refresh immediately, just log for tracking
    };
    
    // Handle localStorage changes (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'dashboardRefresh' || e.key?.includes('learning-progress')) {
        console.log('CompletedCourses: Storage change detected, refreshing...', e.key);
        setTimeout(() => fetchCompletedCourses(), 1000);
      }
    };
    
    // Handle focus events (when returning to this page)
    const handleWindowFocus = () => {
      console.log('CompletedCourses: Window focused, refreshing completed courses');
      fetchCompletedCourses();
    };
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden && document.visibilityState === 'visible') {
        console.log('CompletedCourses: Page became visible, refreshing completed courses');
        fetchCompletedCourses();
      }
    };
    
    window.addEventListener('courseCompleted', handleCourseCompleted);
    window.addEventListener('progressUpdated', handleProgressUpdate);
    window.addEventListener('learningPathCreated', handleLearningPathCreated);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('courseCompleted', handleCourseCompleted);
      window.removeEventListener('progressUpdated', handleProgressUpdate);
      window.removeEventListener('learningPathCreated', handleLearningPathCreated);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Additional useEffect to refresh when navigating back to this page
  useEffect(() => {
    if (location.pathname === '/completed-courses') {
      console.log('CompletedCourses: Navigated to completed courses page, refreshing data');
      // Small delay to allow any completion events to process first
      setTimeout(() => {
        fetchCompletedCourses();
      }, 300);
    }
  }, [location.pathname]);

  const fetchCompletedCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('CompletedCourses: Fetching latest completed courses data...');
      
      // Get completed courses from multiple sources with cache busting
      const [completedPathsResponse, progressResponse] = await Promise.all([
        api.getCompletedLearningPaths(`?_t=${Date.now()}`), // Cache bust
        api.getProgress(`?_t=${Date.now()}`) // Cache bust
      ]);
      
      console.log('CompletedCourses: Backend responses received:', {
        completedPaths: completedPathsResponse.data,
        progress: progressResponse.data
      });
      
      const completedPaths = completedPathsResponse.data.data || [];
      const allProgress = progressResponse.data.data || [];
      
      console.log('CompletedCourses: Processing data:', {
        completedPathsCount: completedPaths.length,
        allProgressCount: allProgress.length,
        currentUserId: user?.id || user?._id
      });
      
      // Filter progress for completed courses (100% progress)
      const completedProgress = allProgress.filter(p => 
        p.userId === (user?.id || user?._id) && p.overallProgress >= 100
      );
      
      console.log('CompletedCourses: Filtered completed progress:', completedProgress);
      
      // Combine and deduplicate completed courses
      const completedCourseMap = new Map();
      
      // Add completed paths from backend
      completedPaths.forEach(path => {
        completedCourseMap.set(path._id, {
          _id: path._id,
          domain: path.domain,
          level: path.level,
          skills: path.skills || [],
          completedAt: path.completedAt || path.updatedAt,
          status: path.status,
          finalProgress: path.finalProgress || 100,
          estimatedDuration: path.estimatedDuration,
          totalDays: path.totalDays || 10,
          source: 'backend-status'
        });
      });
      
      // Add completed courses from progress data
      completedProgress.forEach(progress => {
        const key = progress.learningPathId || `${progress.domain}-${progress.userId}`;
        if (!completedCourseMap.has(key)) {
          completedCourseMap.set(key, {
            _id: key,
            domain: progress.domain,
            level: 'Unknown',
            skills: [],
            completedAt: progress.updatedAt,
            status: 'completed',
            finalProgress: progress.overallProgress,
            estimatedDuration: `${progress.totalDays || 10} days`,
            totalDays: progress.totalDays || 10,
            currentDay: progress.currentDay,
            source: 'progress-data'
          });
        }
      });
      
      const completedCoursesArray = Array.from(completedCourseMap.values()).sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      );
      
      console.log('CompletedCourses: Final completed courses array:', {
        count: completedCoursesArray.length,
        courses: completedCoursesArray.map(c => ({
          id: c._id,
          domain: c.domain,
          completedAt: c.completedAt,
          source: c.source
        }))
      });
      
      setCompletedCourses(completedCoursesArray);
    } catch (error) {
      console.error('Error fetching completed courses:', error);
      setError('Failed to load completed courses');
    } finally {
      setLoading(false);
    }
  };

  const formatCompletionDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCourseIcon = (domain) => {
    if (domain?.includes('Web')) return '🌐';
    if (domain?.includes('Data')) return '📊';
    if (domain?.includes('Mobile')) return '📱';
    if (domain?.includes('AI') || domain?.includes('ML')) return '🤖';
    if (domain?.includes('DevOps')) return '⚙️';
    if (domain?.includes('Security')) return '🔒';
    if (domain?.includes('Backend')) return '⚙️';
    if (domain?.includes('Frontend')) return '🎨';
    if (domain?.includes('React')) return '⚛️';
    if (domain?.includes('Node')) return '📗';
    return '🎓';
  };

  if (loading) {
    return (
      <div className="completed-courses-container">
        <div className="completed-courses-header">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <h2>🎓 Completed Courses</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your completed courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="completed-courses-container">
        <div className="completed-courses-header">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <h2>🎓 Completed Courses</h2>
        </div>
        <div className="error-container">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button onClick={fetchCompletedCourses} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="completed-courses-container">
      <div className="completed-courses-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h2>🎓 Completed Courses</h2>
          <p className="header-subtitle">
            {user?.name}'s learning achievements • {completedCourses.length} courses completed
          </p>
        </div>
        
        {/* Debug controls - Remove in production */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#f0f9ff',
          borderRadius: '6px',
          border: '1px solid #0369a1'
        }}>
          <button
            onClick={() => {
              console.log('🔄 Manual CompletedCourses Refresh Triggered');
              fetchCompletedCourses();
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#0369a1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Refresh Completed
          </button>
        </div>
      </div>

      {completedCourses.length === 0 ? (
        <div className="no-completed-courses">
          <div className="empty-icon">🎯</div>
          <h3>No Completed Courses Yet</h3>
          <p>
            Complete your first learning path to see it here! Once you finish all tasks in a learning path, 
            it will appear in your completed courses collection.
          </p>
          <div className="empty-actions">
            <button 
              onClick={() => navigate('/dashboard')}
              className="primary-button"
            >
              🚀 Start Learning
            </button>
            <button 
              onClick={() => navigate('/domain-selection')}
              className="secondary-button"
            >
              📚 Browse Domains
            </button>
          </div>
        </div>
      ) : (
        <div className="completed-courses-grid">
          {completedCourses.map((course, index) => (
            <div key={course._id || index} className="completed-course-card">
              <div className="course-completion-badge">
                <span className="completion-icon">✅</span>
                <span className="completion-text">Completed</span>
              </div>
              
              <div className="course-header">
                <div className="course-icon">
                  {getCourseIcon(course.domain)}
                </div>
                <div className="course-info">
                  <h3 className="course-title">{course.domain}</h3>
                  <p className="course-level">Level: {course.level}</p>
                  <p className="completion-date">
                    Completed on {formatCompletionDate(course.completedAt)}
                  </p>
                </div>
              </div>

              <div className="course-progress-summary">
                <div className="progress-bar-completed">
                  <div className="progress-fill-completed"></div>
                </div>
                <div className="progress-details">
                  <span className="progress-text">100% Complete</span>
                  <span className="progress-badge">
                    🏆 {Math.round(course.finalProgress || 100)}%
                  </span>
                </div>
              </div>

              <div className="course-metadata">
                <div className="meta-item">
                  <span className="meta-label">Duration:</span>
                  <span className="meta-value">{course.estimatedDuration}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Skills Learned:</span>
                  <span className="meta-value">
                    {course.skills?.length || 0} skills
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Final Day:</span>
                  <span className="meta-value">
                    Day {course.currentDay || course.totalDays || 10}
                  </span>
                </div>
              </div>

              {course.skills && course.skills.length > 0 && (
                <div className="course-skills-summary">
                  <div className="skills-label">Skills Mastered:</div>
                  <div className="skills-tags">
                    {course.skills.slice(0, 3).map((skill, skillIndex) => (
                      <span key={skillIndex} className="skill-tag completed">
                        {typeof skill === 'string' ? skill : skill.name || skill.title}
                      </span>
                    ))}
                    {course.skills.length > 3 && (
                      <span className="skill-tag more">+{course.skills.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="course-achievement">
                <div className="achievement-icon">🏆</div>
                <div className="achievement-text">
                  <strong>Course Completed!</strong>
                  <br />
                  <small>You've mastered {course.domain} fundamentals</small>
                </div>
              </div>

              <div className="course-actions">
                <button
                  onClick={() => {
                    navigate('/learning-path', {
                      state: {
                        domain: {
                          id: course.domain?.toLowerCase().replace(/\s+/g, '-'),
                          title: course.domain,
                          name: course.domain
                        },
                        level: {
                          id: course.level?.toLowerCase(),
                          name: course.level
                        },
                        selectedSkills: course.skills || [],
                        learningPathId: course._id,
                        isFromDashboard: true,
                        showResourcesOnly: true,
                        reviewMode: true,
                        userName: user?.name
                      }
                    });
                  }}
                  className="review-button"
                >
                  📚 Review Resources
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="completed-courses-summary">
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="stat-number">{completedCourses.length}</div>
            <div className="stat-label">Courses Completed</div>
          </div>
          <div className="summary-stat">
            <div className="stat-number">
              {completedCourses.reduce((total, course) => total + (course.skills?.length || 0), 0)}
            </div>
            <div className="stat-label">Skills Mastered</div>
          </div>
          <div className="summary-stat">
            <div className="stat-number">
              {completedCourses.reduce((total, course) => total + (course.totalDays || 10), 0)}
            </div>
            <div className="stat-label">Days of Learning</div>
          </div>
        </div>
        
        <div className="achievements-section">
          <h4>🏆 Your Learning Achievements</h4>
          <div className="achievements-list">
            {completedCourses.length >= 1 && (
              <div className="achievement-item">
                <span className="achievement-emoji">🎓</span>
                <span>First Course Completed</span>
              </div>
            )}
            {completedCourses.length >= 3 && (
              <div className="achievement-item">
                <span className="achievement-emoji">🔥</span>
                <span>Learning Streak</span>
              </div>
            )}
            {completedCourses.length >= 5 && (
              <div className="achievement-item">
                <span className="achievement-emoji">⚡</span>
                <span>Skill Master</span>
              </div>
            )}
            {completedCourses.reduce((total, course) => total + (course.skills?.length || 0), 0) >= 10 && (
              <div className="achievement-item">
                <span className="achievement-emoji">🚀</span>
                <span>Knowledge Explorer</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedCourses;
