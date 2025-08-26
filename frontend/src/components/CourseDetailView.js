import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Helper function to get user-specific localStorage key
const getUserStorageKey = (userId) => {
    return userId ? `userLearningPaths_${userId}` : 'userLearningPaths_guest';
};

export default function CourseDetailView({ course }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  async function handleViewOnDashboard(courseData) {
    try {
      // Ensure the course has the required fields
      const courseWithId = {
        ...courseData,
        _id: courseData._id || `course-${Date.now()}`,
        isAIGenerated: true,
      };

      // Save to user-specific localStorage
      const userStorageKey = getUserStorageKey(user?.id);
      const existingPaths = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
      const alreadyExists = existingPaths.some(c => c._id === courseWithId._id);

      if (!alreadyExists) {
        localStorage.setItem(userStorageKey, JSON.stringify([...existingPaths, courseWithId]));
      }

      // Try to save to backend
      try {
        console.log('Attempting to save course to backend:', courseWithId);
        
        // Transform course data to match LearningPath model
        const learningPathData = {
          title: courseWithId.domain || 'New Learning Path',
          description: courseWithId.analysis?.description || `Learning path for ${courseWithId.domain}`,
          difficulty: courseWithId.level?.toLowerCase() || 'beginner',
          estimatedDuration: {
            value: parseInt(courseWithId.estimatedDuration) || 6,
            unit: 'weeks'
          },
          modules: [], // Will be populated later
          tags: courseWithId.skills || [],
          // Store original course data in a custom field
          courseData: courseWithId
        };
        
        console.log('Transformed learning path data:', learningPathData);
        
        const response = await api.createLearningPath(learningPathData);
        console.log('Course saved to backend successfully:', response.data);
        
        // Dispatch events to notify dashboard to refresh
        window.dispatchEvent(new CustomEvent('learningPathCreated', {
          detail: {
            userId: user?.id || user?._id,
            learningPathId: response.data?.data?._id || courseWithId._id,
            domain: courseWithId.domain,
            timestamp: new Date().toISOString()
          }
        }));
        
        // Update user-specific localStorage with the real database ID
        if (response.data?.data?._id) {
          const updatedCourse = { ...courseWithId, _id: response.data.data._id };
          const pathsWithoutCurrent = existingPaths.filter(p => p._id !== courseWithId._id);
          localStorage.setItem(userStorageKey, JSON.stringify([...pathsWithoutCurrent, updatedCourse]));
        }
      } catch (apiError) {
        console.error('Failed to save course to backend:', apiError);
        console.error('API Error details:', apiError.response?.data);
        
        // Still dispatch event even if backend save failed
        window.dispatchEvent(new CustomEvent('learningPathCreated', {
          detail: {
            userId: user?.id || user?._id,
            learningPathId: courseWithId._id,
            domain: courseWithId.domain,
            timestamp: new Date().toISOString(),
            backendSaveFailed: true
          }
        }));
      }

      // Dispatch event to update dashboard
      window.dispatchEvent(new CustomEvent('learningPathUpdated', { 
        detail: { added: courseWithId } 
      }));

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error handling view on dashboard:', error);
    }
  }

  return (
    <button
      className="go-to-dashboard-button"
      onClick={() => handleViewOnDashboard(course)}
    >
      📊 View on Dashboard
    </button>
  );
}
