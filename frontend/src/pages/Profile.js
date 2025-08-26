import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [settingsData, setSettingsData] = useState({
    name: '',
    email: '',
    bio: '',
    location: ''
  });
  const [isSettingsChanged, setIsSettingsChanged] = useState(false);

  useEffect(() => {
    fetchProfileData();
    
    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Initialize settings data when user changes
  useEffect(() => {
    if (user) {
      setSettingsData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      console.log('Fetching profile data using API service...');
      const response = await api.getUserAnalytics();
      
      console.log('Profile analytics response:', response.data);
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      console.log('Using fallback profile data');
      setProfileData(getFallbackProfileData());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackProfileData = () => ({
    totalStudyTime: 0,
    coursesCompleted: 0,
    skillsLearned: 0,
    averageScore: 0,
    weeklyProgress: [
      { day: 'Mon', hours: 0 },
      { day: 'Tue', hours: 0 },
      { day: 'Wed', hours: 0 },
      { day: 'Thu', hours: 0 },
      { day: 'Fri', hours: 0 },
      { day: 'Sat', hours: 0 },
      { day: 'Sun', hours: 0 }
    ],
    topSkills: [
      { name: 'Getting Started', progress: 0 },
      { name: 'Learning Foundation', progress: 0 },
      { name: 'Goal Setting', progress: 0 }
    ],
    recentAchievements: [
      { title: 'Welcome to Learning!', date: new Date().toISOString().split('T')[0], icon: '🎯' },
      { title: 'Profile Created', date: new Date().toISOString().split('T')[0], icon: '👤' }
    ],
    learningStreak: 0,
    rank: 'Beginner',
    completionRate: 0
  });

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditedProfile({
      name: user?.name || ''
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Prepare data with only the name field
      const updateData = {
        name: editedProfile.name
      };

      console.log('Updating user profile with:', updateData);

      // Use the API service to update profile
      const response = await api.updateUserProfile(updateData);
      
      console.log('Profile update response:', response.data);

      if (response.data.success) {
        // Update the user in the context
        updateUser({ name: editedProfile.name });
        
        console.log('Username updated successfully via backend:', response.data);
        alert('Username updated successfully!');
        setIsEditing(false);
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      
      // More detailed error handling
      let errorMessage = 'Error updating username. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.status === 404) {
          errorMessage = 'User not found.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      name: user?.name || ''
    });
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      alert('Please type "delete" to confirm account deletion');
      return;
    }

    try {
      console.log('Attempting to delete account using API service...');
      
      const response = await api.deleteUserAccount();
      
      console.log('Delete account response:', response.data);
      
      if (response.data.success) {
        alert('Account deleted successfully');
        logout();
        navigate('/');
      } else {
        throw new Error(response.data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      
      let errorMessage = 'Error deleting account';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.status === 404) {
          errorMessage = 'User account not found.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleSettingsChange = (field, value) => {
    setSettingsData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsSettingsChanged(true);
  };

  const handleSaveSettings = async () => {
    try {
      // Prepare data excluding email (which should not be editable)
      const settingsToUpdate = {
        name: settingsData.name,
        bio: settingsData.bio,
        location: settingsData.location
      };
      
      console.log('Saving settings using API service:', settingsToUpdate);

      // Try to update via backend API
      const response = await api.updateUserProfile(settingsToUpdate);
      
      console.log('Settings update response:', response.data);

      if (response.data.success) {
        console.log('Settings updated successfully via backend:', response.data);
        
        // Update the user context with the new data
        updateUser({
          name: settingsData.name,
          bio: settingsData.bio,
          location: settingsData.location
        });
        
        alert('Profile updated successfully!');
        setIsSettingsChanged(false);
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (backendError) {
      console.warn('Backend update failed, using local storage fallback:', backendError.message);
      
      // Fallback: Update user data in localStorage (excluding email)
      const existingUserData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = {
        ...existingUserData,
        name: settingsData.name,
        bio: settingsData.bio,
        location: settingsData.location,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      console.log('Profile updated in localStorage:', updatedUserData);
      alert('Profile updated successfully! (Changes saved locally)');
      setIsSettingsChanged(false);
    }
  };

  const handleCancelSettings = () => {
    // Reset to original user data
    setSettingsData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || ''
    });
    setIsSettingsChanged(false);
  };

  // 📊 Learning Statistics function
  const getLearningStatistics = () => {
    if (!profileData) return null;
    
    return {
      totalStudyTime: Math.round(profileData.totalStudyTime * 10) / 10,
      coursesCompleted: profileData.coursesCompleted || 0,
      skillsLearned: profileData.skillsLearned || 0,
      averageScore: profileData.averageScore || 0,
      completionRate: profileData.completionRate || 0,
      learningStreak: profileData.learningStreak || 0,
      rank: profileData.rank || 'Beginner'
    };
  };

  // 🎯 Top Skills function
  const getTopSkills = () => {
    if (!profileData || !profileData.topSkills) return [];
    
    return profileData.topSkills.map(skill => ({
      name: skill.name,
      progress: skill.progress,
      level: skill.progress >= 80 ? 'Expert' : skill.progress >= 60 ? 'Advanced' : skill.progress >= 40 ? 'Intermediate' : 'Beginner',
      category: skill.category || 'General',
      lastUpdated: skill.lastUpdated || new Date().toISOString().split('T')[0]
    })).sort((a, b) => b.progress - a.progress);
  };

  // 📅 Recent Activity function
  const getRecentActivity = () => {
    if (!profileData || !profileData.weeklyProgress) return [];
    
    const today = new Date();
    
    return profileData.weeklyProgress.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      
      const intensity = day.hours >= 2 ? 'high' : day.hours >= 1 ? 'medium' : day.hours > 0 ? 'low' : 'none';
      
      return {
        title: `${day.day} Learning Session`,
        description: day.hours > 0 ? `Studied for ${day.hours} hours` : 'No study session',
        date: date.toLocaleDateString(),
        type: intensity,
        duration: `${day.hours}h`,
        progress: Math.min(100, (day.hours / 2) * 100), // Progress based on 2-hour daily goal
        day: day.day,
        hours: day.hours,
        activities: day.activities || [],
        studyGoalMet: day.hours >= 1
      };
    }).filter(item => item.hours > 0); // Only show days with activity
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="profile-content">
        {/* Profile Hero Section */}
        <div className="profile-hero">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {(user?.name && typeof user.name === 'string' && user.name.length > 0) ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-status">
              <div className="online-indicator"></div>
              <span>Online</span>
            </div>
          </div>
          
          <div className="profile-info">
            <div className="profile-main-info">
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                  className="edit-input large"
                  placeholder="Your name"
                />
              ) : (
                <h1 className="profile-name">{user?.name || 'Anonymous User'}</h1>
              )}
              
              {/* Email is always read-only */}
              <p className="profile-email">{user?.email || 'No email provided'}</p>
            </div>
            
            <div className="profile-stats-quick">
              <div className="quick-stat">
                <span className="stat-number">{profileData.coursesCompleted}</span>
                <span className="stat-label">Courses</span>
              </div>
              <div className="quick-stat">
                <span className="stat-number">{profileData.skillsLearned}</span>
                <span className="stat-label">Skills</span>
              </div>
              <div className="quick-stat">
                <span className="stat-number">{Math.round(profileData.totalStudyTime)}h</span>
                <span className="stat-label">Study Time</span>
              </div>
            </div>
            
            <div className="profile-actions">
              {isEditing ? (
                <div className="edit-actions">
                  <button className="save-button" onClick={handleSaveProfile}>
                    💾 Save Changes
                  </button>
                  <button className="cancel-button" onClick={handleCancelEdit}>
                    ❌ Cancel
                  </button>
                </div>
              ) : (
                <button className="edit-profile-button" onClick={handleEditProfile}>
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>
          
          <div className="profile-rank">
            <div className="rank-badge">
              <span className="rank-icon">🏆</span>
              <span className="rank-text">{profileData.rank}</span>
            </div>
            <div className="rank-progress">
              <div className="rank-progress-bar">
                <div 
                  className="rank-progress-fill"
                  style={{ width: `${profileData.completionRate}%` }}
                ></div>
              </div>
              <span className="rank-percentage">{profileData.completionRate}% to next rank</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-nav">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            📈 Progress
          </button>
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                {/* Learning Stats */}
                <div className="overview-card stats-card">
                  <h3 className="card-title">📊 Learning Statistics</h3>
                  <div className="stats-grid">
                    {(() => {
                      const stats = getLearningStatistics();
                      if (!stats) return <div>Loading statistics...</div>;
                      
                      return (
                        <>
                          <div className="stat-item">
                            <div className="stat-icon">⏰</div>
                            <div className="stat-details">
                              <span className="stat-value">{stats.totalStudyTime}h</span>
                              <span className="stat-label">Total Study Time</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-icon">🎓</div>
                            <div className="stat-details">
                              <span className="stat-value">{stats.coursesCompleted}</span>
                              <span className="stat-label">Completed Courses</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-icon">🧠</div>
                            <div className="stat-details">
                              <span className="stat-value">{stats.skillsLearned}</span>
                              <span className="stat-label">Skills Learned</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-icon">📝</div>
                            <div className="stat-details">
                              <span className="stat-value">{stats.averageScore}%</span>
                              <span className="stat-label">Average Score</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Top Skills */}
                <div className="overview-card skills-card">
                  <h3 className="card-title">🎯 Top Skills</h3>
                  <div className="skills-list">
                    {(() => {
                      const skills = getTopSkills();
                      
                      if (skills.length === 0) {
                        return (
                          <div className="no-skills-message">
                            <p>🌱 Start learning to see your skill progress here!</p>
                          </div>
                        );
                      }
                      
                      return skills.map((skill, index) => (
                        <div key={index} className={`skill-item enhanced ${skill.category === 'Certified' ? 'certified-skill' : ''}`}>
                          <div className="skill-info">
                            <div className="skill-header">
                              <div className="skill-name-container">
                                <span className="skill-name">{skill.name}</span>
                                {skill.category === 'Certified' && (
                                  <span className="certified-badge">🏆 Certified</span>
                                )}
                              </div>
                              <span className="skill-level">{skill.level}</span>
                            </div>
                            <span className="skill-percentage">{skill.progress}%</span>
                          </div>
                          <div className="skill-progress-bar">
                            <div 
                              className="skill-progress-fill"
                              style={{ 
                                width: `${skill.progress}%`,
                                backgroundColor: skill.category === 'Certified' ? '#dc2626' : // Red for certified
                                               skill.level === 'Expert' ? '#22c55e' :
                                               skill.level === 'Advanced' ? '#3b82f6' :
                                               skill.level === 'Intermediate' ? '#f59e0b' : '#6b7280'
                              }}
                            ></div>
                          </div>
                          <div className="skill-meta">
                            <small>
                              {skill.category === 'Certified' ? '🎓 Proven through certification' : `Category: ${skill.category}`} 
                              {' • Updated: ' + skill.lastUpdated}
                            </small>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="overview-card activity-card">
                  <h3 className="card-title">📅 Recent Activity</h3>
                  <div className="activity-list">
                    {(() => {
                      const activity = getRecentActivity();
                      
                      if (activity.length === 0) {
                        return (
                          <div className="no-activity-message">
                            <p>🎯 Complete some learning activities to see your progress!</p>
                          </div>
                        );
                      }
                      
                      return activity.map((item, index) => (
                        <div key={index} className="activity-item enhanced">
                          <div className="activity-icon">
                            {item.type === 'high' ? '🔥' : 
                             item.type === 'medium' ? '⚡' : '💫'}
                          </div>
                          <div className="activity-content">
                            <div className="activity-header">
                              <span className="activity-title">{item.title}</span>
                              <span className="activity-date">{item.date}</span>
                            </div>
                            <p className="activity-description">{item.description}</p>
                            <div className="activity-meta">
                              <span className="activity-type">
                                Intensity: {(item.type && typeof item.type === 'string' && item.type.length > 0) ? 
                                  item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Unknown'}
                              </span>
                              <span className="activity-duration">
                                {item.duration} • {item.progress}% complete
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="progress-tab">
              <div className="progress-cards">
                <div className="progress-card">
                  <h3 className="card-title">📈 Learning Journey</h3>
                  <div className="journey-timeline">
                    <div className="timeline-item completed">
                      <div className="timeline-marker">✅</div>
                      <div className="timeline-content">
                        <h4>Profile Setup</h4>
                        <p>Created your learning profile</p>
                        <span className="timeline-date">Completed</span>
                      </div>
                    </div>
                    {(() => {
                      const stats = getLearningStatistics();
                      if (!stats) return null;
                      
                      return (
                        <>
                          <div className={`timeline-item ${stats.coursesCompleted > 0 ? 'completed' : 'current'}`}>
                            <div className="timeline-marker">{stats.coursesCompleted > 0 ? '✅' : '🎯'}</div>
                            <div className="timeline-content">
                              <h4>First Course</h4>
                              <p>{stats.coursesCompleted > 0 ? `Completed ${stats.coursesCompleted} course${stats.coursesCompleted > 1 ? 's' : ''}` : 'Start your first learning path'}</p>
                              <span className="timeline-date">{stats.coursesCompleted > 0 ? 'Completed' : 'In Progress'}</span>
                            </div>
                          </div>
                          <div className={`timeline-item ${stats.coursesCompleted >= 3 ? 'completed' : stats.coursesCompleted > 0 ? 'current' : ''}`}>
                            <div className="timeline-marker">{stats.coursesCompleted >= 3 ? '✅' : '📚'}</div>
                            <div className="timeline-content">
                              <h4>Skill Development</h4>
                              <p>{stats.coursesCompleted >= 3 ? 'Completed 3+ courses!' : `Complete 3 courses in your domain (${stats.coursesCompleted}/3)`}</p>
                              <span className="timeline-date">{stats.coursesCompleted >= 3 ? 'Completed' : 'In Progress'}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="progress-card">
                  <h3 className="card-title">🎯 Current Goals</h3>
                  <div className="goals-list">
                    {(() => {
                      const stats = getLearningStatistics();
                      if (!stats) return <div>Loading goals...</div>;
                      
                      const firstCourseProgress = Math.min(stats.coursesCompleted * 100, 100);
                      
                      return (
                        <>
                          <div className="goal-item">
                            <div className="goal-icon">📖</div>
                            <div className="goal-content">
                              <h4>{stats.coursesCompleted > 0 ? 'Course Mastery' : 'Complete First Course'}</h4>
                              <p>{stats.coursesCompleted > 0 ? `You've completed ${stats.coursesCompleted} course${stats.coursesCompleted > 1 ? 's' : ''}! Keep learning.` : 'Finish your first learning path to unlock advanced features'}</p>
                              <div className="goal-progress">
                                <div className="goal-progress-bar">
                                  <div className="goal-progress-fill" style={{ width: `${firstCourseProgress}%` }}></div>
                                </div>
                                <span>{stats.coursesCompleted > 0 ? '✅ Completed!' : '0% Complete'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="goal-item">
                            <div className="goal-icon">⏰</div>
                            <div className="goal-content">
                              <h4>Study Time Goal</h4>
                              <p>Build consistent learning habits with regular study sessions</p>
                              <div className="goal-progress">
                                <div className="goal-progress-bar">
                                  <div className="goal-progress-fill" style={{ width: `${Math.min(stats.totalStudyTime * 10, 100)}%` }}></div>
                                </div>
                                <span>{stats.totalStudyTime}h total study time</span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-cards">
                {/* Learning Summary Card */}
                <div className="settings-card">
                  <h3 className="card-title">📊 Learning Summary</h3>
                  <div className="learning-summary">
                    {(() => {
                      const stats = getLearningStatistics();
                      if (!stats) return <div>Loading summary...</div>;
                      
                      return (
                        <div className="summary-grid">
                          <div className="summary-stat">
                            <span className="summary-number">{stats.coursesCompleted}</span>
                            <span className="summary-label">Completed Courses</span>
                          </div>
                          <div className="summary-stat">
                            <span className="summary-number">{stats.totalStudyTime}h</span>
                            <span className="summary-label">Study Time</span>
                          </div>
                          <div className="summary-stat">
                            <span className="summary-number">{stats.rank}</span>
                            <span className="summary-label">Current Rank</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="settings-card">
                  <h3 className="card-title">👤 Personal Information</h3>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        value={settingsData.name} 
                        onChange={(e) => handleSettingsChange('name', e.target.value)}
                        placeholder="Enter your name" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Bio</label>
                      <textarea 
                        value={settingsData.bio}
                        onChange={(e) => handleSettingsChange('bio', e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows="4"
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input 
                        type="text" 
                        value={settingsData.location}
                        onChange={(e) => handleSettingsChange('location', e.target.value)}
                        placeholder="City, Country" 
                      />
                    </div>
                    
                    {isSettingsChanged && (
                      <div className="form-actions">
                        <button 
                          className="save-button" 
                          onClick={handleSaveSettings}
                        >
                          💾 Save Changes
                        </button>
                        <button 
                          className="cancel-button" 
                          onClick={handleCancelSettings}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="settings-card danger-zone">
                  <h3 className="card-title">⚠️ Account Management</h3>
                  <div className="danger-actions">
                    <button className="danger-button" onClick={logout}>
                      🚪 Logout
                    </button>
                    <button className="danger-button delete" onClick={handleDeleteAccount}>
                      🗑️ Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h2 className="modal-title">⚠️ Delete Account</h2>
            <p className="modal-message">
              This action cannot be undone. This will permanently delete your account, 
              all your progress, learning paths, and remove all associated data.
            </p>
            <div className="delete-confirmation">
              <label htmlFor="delete-confirm">
                Type <strong>"delete"</strong> to confirm:
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="delete-confirm-input"
                placeholder="Type 'delete' here"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-button" 
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button 
                className="danger-button delete" 
                onClick={handleConfirmDelete}
                disabled={deleteConfirmText.toLowerCase() !== 'delete'}
              >
                Delete Account Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
