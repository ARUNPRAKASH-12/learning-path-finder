import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [userProgress, setUserProgress] = useState([]);

  // Safe render function to prevent object rendering errors
  const safeRender = (value, fallback = 'N/A') => {
    try {
      if (value === null || value === undefined) return fallback;
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          // Handle array of skills or other objects
          return value.map(item => {
            if (typeof item === 'object' && item !== null) {
              return item.name || item.title || item.skill || JSON.stringify(item);
            }
            return String(item);
          }).join(', ') || fallback;
        }
        // Handle single object (like skill object)
        if (value.name) return String(value.name);
        if (value.title) return String(value.title);
        if (value.skill) return String(value.skill);
        // For any other object, safely convert to string
        return String(value.name || value.title || Object.keys(value).join(',') || fallback);
      }
      return String(value);
    } catch (err) {
      console.error('Error in safeRender:', err, 'Value:', value);
      return fallback || 'Error rendering value';
    }
  };

  useEffect(() => {
    // Ensure user is logged in for dashboard functionality
    const userId = user?.id || user?._id;
    if (!userId) {
      console.log('No user ID found, checking authentication...');
      console.log('User needs to be properly authenticated');
    }
    
    fetchEnrolledCourses();
    
    // Set up global refresh function for other components to call
    window.dashboardRefresh = () => {
      console.log('Dashboard refresh called from external component');
      fetchEnrolledCourses();
    };
    
    // Listen for custom learning path updates from other components
    const handleLearningPathUpdate = (e) => {
      if (!userId) return;
      
      console.log(`User ${userId} - Learning path updated event detected:`, e.detail);
      console.log(`User ${userId} - Event timestamp:`, new Date().toISOString());
      
      // Refresh dashboard after learning path update
      setTimeout(() => {
        console.log(`User ${userId} - Refreshing dashboard after learning path update...`);
        fetchEnrolledCourses();
      }, 200);
    };
    
    // Listen for progress updates
    const handleProgressUpdate = (e) => {
      if (!userId) return;
      
      console.log(`📊 User ${userId} - Progress updated event detected:`, e.detail);
      console.log(`📈 Progress details:`, {
        domain: e.detail.domain,
        overallProgress: e.detail.overallProgress,
        currentDay: e.detail.currentDay,
        isComplete: e.detail.isComplete
      });
      
      // Immediate refresh for progress updates
      console.log(`🔄 Progress Update: Immediate refresh...`);
      fetchEnrolledCourses();
      
      // Add a small delay to ensure backend has processed the update
      setTimeout(() => {
        console.log(`🔄 Progress Update: Delayed refresh (500ms)...`);
        fetchEnrolledCourses();
      }, 500);
      
      // If this is a completion update (100% progress), refresh again later
      if (e.detail.overallProgress >= 100 || e.detail.isComplete) {
        console.log(`🎯 Course completion detected via progress update!`);
        setTimeout(() => {
          console.log(`🔄 Completion: Final refresh for course completion (2s)...`);
          fetchEnrolledCourses();
        }, 2000);
      }
    };
    
    // Listen for course completion events
    const handleCourseCompleted = (e) => {
      if (!userId || e.detail.userId !== userId) {
        console.log(`❌ Course completion event ignored - userId mismatch. Event userId: ${e.detail.userId}, Current userId: ${userId}`);
        return;
      }
      
      console.log(`🎉 User ${userId} - Course completion detected:`, e.detail);
      console.log(`📊 Completion details:`, {
        domain: e.detail.domain,
        pathId: e.detail.pathId,
        finalProgress: e.detail.finalProgress,
        completedAt: e.detail.completedAt
      });
      
      // Immediately refresh dashboard to show updated completion count
      console.log(`🔄 Step 1: Immediate dashboard refresh...`);
      fetchEnrolledCourses();
      
      // Then refresh again after a delay to ensure backend processing
      setTimeout(() => {
        console.log(`🔄 Step 2: Delayed dashboard refresh (1s)...`);
        fetchEnrolledCourses();
      }, 1000);
      
      // Force another refresh after even longer delay as final backup
      setTimeout(() => {
        console.log(`🔄 Step 3: Final dashboard refresh (3s)...`);
        fetchEnrolledCourses();
      }, 3000);
    };
    
    window.addEventListener('learningPathUpdated', handleLearningPathUpdate);
    window.addEventListener('courseCompleted', handleCourseCompleted);
    window.addEventListener('progressUpdated', handleProgressUpdate);
    
    // Also listen for focus events to refresh when returning to dashboard
    const handleFocus = () => {
      console.log(`User ${userId} - Window focus detected, refreshing dashboard`);
      fetchEnrolledCourses();
    };
    
    // Listen for page visibility changes (when returning to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && document.visibilityState === 'visible') {
        console.log(`User ${userId} - Page became visible, refreshing dashboard`);
        fetchEnrolledCourses();
      }
    };
    
    // Listen for storage events (in case other tabs create learning paths)
    const handleStorageChange = (e) => {
      if (e.key === 'learningPathCreated' || e.key === 'dashboardRefresh') {
        console.log(`User ${userId} - Storage change detected, refreshing dashboard`);
        fetchEnrolledCourses();
      }
    };
    
    // Listen for custom events when returning from learning path creation
    const handleLearningPathCreated = (e) => {
      console.log(`User ${userId} - Learning path created event detected, refreshing dashboard`);
      setTimeout(() => fetchEnrolledCourses(), 500); // Small delay to ensure backend has saved
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('learningPathCreated', handleLearningPathCreated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('learningPathUpdated', handleLearningPathUpdate);
      window.removeEventListener('courseCompleted', handleCourseCompleted);
      window.removeEventListener('progressUpdated', handleProgressUpdate);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('learningPathCreated', handleLearningPathCreated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      delete window.dashboardRefresh;
    };
  }, [user?.id, user?._id]); // Re-run when user changes

  // Additional useEffect to refresh dashboard when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const userId = user?.id || user?._id;
      if (!document.hidden && userId) {
        console.log(`User ${userId} - Page visibility changed to visible, refreshing dashboard`);
        fetchEnrolledCourses();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, user?._id]);

  // useEffect to refresh dashboard when navigating back from learning path
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId && location.pathname === '/dashboard') {
      console.log(`User ${userId} - Navigated to dashboard, refreshing courses`);
      // Small delay to allow any completion events to process first
      setTimeout(() => {
        fetchEnrolledCourses();
      }, 200);
    }
  }, [location.pathname, user?.id, user?._id]);


  const fetchEnrolledCourses = async () => {
    // Debug: Log the complete user object
    console.log('=== DEBUG USER OBJECT ===');
    console.log('Full user object:', user);
    console.log('user.id:', user?.id);
    console.log('user._id:', user?._id);
    console.log('user.name:', user?.name);
    console.log('user.email:', user?.email);
    console.log('user keys:', user ? Object.keys(user) : 'user is null/undefined');
    console.log('========================');
    
    if (!user?.id && !user?._id) {
      console.log('No user ID available, cannot fetch user-specific courses');
      console.log('User object available:', user);
      setEnrolledCourses([]);
      setLoadingCourses(false);
      return;
    }

    // Use either id or _id
    const userId = user?.id || user?._id;
    console.log('Using userId:', userId);

    try {
      setLoadingCourses(true);
      setCoursesError(null); // Clear any previous errors
      console.log(`=== FETCHING COURSES FROM MULTIPLE SOURCES FOR USER ${userId} (${user.name}) ===`);
      
      let courses = [];
      
      // Try to fetch from backend API first
      try {
        console.log('🔄 Fetching courses from backend...');
        const response = await api.getUserLearningPaths();
        console.log(`User ${userId} - Backend API Response:`, response);
        
        const backendCourses = response.data.data || [];
        console.log(`User ${userId} - Raw courses from backend:`, backendCourses);
        
        // Filter backend courses for current user
        const userBackendCourses = backendCourses.filter(course => 
          course.user === userId || course.userId === userId
        );
        
        courses = [...userBackendCourses];
        console.log(`User ${userId} - Backend courses for current user:`, courses);
        
      } catch (backendError) {
        console.warn(`User ${userId} - Backend API failed, will use localStorage:`, backendError);
        // Continue to localStorage fallback
      }
      
      // Also fetch from localStorage as backup and to get newly saved courses
      const userStorageKey = userId ? `userLearningPaths_${userId}` : 'userLearningPaths_guest';
      const localStorageCourses = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
      console.log(`User ${userId} - localStorage courses:`, localStorageCourses);
      
      // Merge courses, avoiding duplicates (prefer backend data, but include localStorage-only items)
      localStorageCourses.forEach(localCourse => {
        const existsInBackend = courses.find(backendCourse => 
          backendCourse._id === localCourse._id || 
          (backendCourse.domain === localCourse.domain && backendCourse.level === localCourse.level)
        );
        
        if (!existsInBackend) {
          courses.push(localCourse);
        }
      });
      
      console.log(`User ${userId} - Combined courses from backend + localStorage:`, courses);
      console.log(`User ${userId} - Combined courses from backend + localStorage:`, courses);
      
      // Debug: Log the structure of each course
      courses.forEach((course, index) => {
        console.log(`User ${userId} - Course ${index + 1}:`, {
          id: course._id,
          user: course.user,
          userId: course.userId,
          domain: course.domain,
          level: course.level,
          skills: course.skills,
          createdAt: course.createdAt,
          source: course.user ? 'backend' : 'localStorage'
        });
      });
      
      // Also fetch progress data to enhance course information
      try {
        console.log(`🔄 Fetching progress data from backend for user ${userId}...`);
        const progressResponse = await api.getProgress();
        console.log(`User ${userId} - Progress API Response:`, progressResponse);
        const allProgress = progressResponse.data.data || [];
        console.log(`User ${userId} - All progress entries from backend:`, allProgress);
        
        // Filter progress to ONLY current user's data
        const userProgressData = allProgress.filter(progress => {
          const matches = progress.userId === userId;
          console.log(`Progress entry matching check:`, {
            progressUserId: progress.userId,
            currentUserId: userId,
            domain: progress.domain,
            learningPathId: progress.learningPathId,
            overallProgress: progress.overallProgress,
            currentDay: progress.currentDay,
            matches
          });
          return matches;
        });
        console.log(`User ${userId} - Found ${userProgressData.length} progress entries:`, userProgressData);
        setUserProgress(userProgressData);
        
        // Enhance courses with progress data
        courses = courses.map(course => {
          console.log(`🔍 Enhancing course:`, {
            courseId: course._id,
            courseDomain: course.domain,
            availableProgressEntries: userProgressData.length
          });
          
          const progressData = userProgressData.find(p => {
            const learningPathMatch = String(p.learningPathId) === String(course._id);
            const domainMatch = p.domain === course.domain;
            console.log(`Checking progress match:`, {
              progressLearningPathId: p.learningPathId,
              courseId: course._id,
              progressDomain: p.domain,
              courseDomain: course.domain,
              learningPathMatch,
              domainMatch,
              overallMatch: learningPathMatch || domainMatch
            });
            return learningPathMatch || domainMatch;
          });
          
          if (progressData) {
            console.log(`✅ Found progress data for course ${course.domain}:`, progressData);
            return {
              ...course,
              progress: progressData.overallProgress || 0,
              completedModules: progressData.completedTasks || 0,
              currentDay: progressData.currentDay || 1,
              totalDays: progressData.totalDays || 10,
              hasProgress: true
            };
          } else {
            console.log(`❌ No progress data found for course ${course.domain}`);
          }
          
          return course;
        });
        
      } catch (progressError) {
        console.warn(`User ${userId} - Failed to fetch progress data:`, progressError);
      }

      if (courses.length === 0) {
        console.log(`User ${userId} - No learning paths found in backend for this user`);
      } else {
        console.log(`User ${userId} - Found ${courses.length} user-specific learning paths in backend`);
      }

      // Process courses to ensure proper structure for user-specific display
      const processedCourses = courses.map(course => ({
        ...course,
        _id: course._id || Date.now().toString(),
        userId: userId, // Ensure userId is always set to current user
        domain: course.domain || 'Programming',
        level: course.level || 'Beginner',
        skills: Array.isArray(course.skills) ? course.skills.map(skill => {
          if (typeof skill === 'object' && skill !== null) {
            return skill.name || skill.title || skill.skill || String(skill);
          }
          return String(skill);
        }).filter(skill => skill && skill !== 'undefined' && skill !== 'null') : [],
        estimatedDuration: (() => {
          
          return '10 days';
        })(),
        modules: Array.isArray(course.modules) ? course.modules : [],
        completedModules: Number(course.completedModules) || 0,
        progress: Number(course.progress) || 0,
        currentDay: Number(course.currentDay) || 1,
        totalDays: Number(course.totalDays) || 10,
        createdAt: course.createdAt || new Date().toISOString(),
        // Calculate progress percentage - use backend progress data if available
        progressPercentage: (() => {
          // First, try to get progress from backend progress data
          if (course.progress && typeof course.progress === 'number') {
            return Math.min(Math.round(course.progress), 100);
          }
          
          // Second, check if there's detailed progress data with completed tasks
          const progressData = userProgress.find(p => 
            String(p.learningPathId) === String(course._id) || 
            p.domain === course.domain
          );
          
          if (progressData && progressData.completedTasks) {
            // Count completed tasks from backend progress
            let completedTasksCount = 0;
            let totalTasksCount = 0;
            
            if (progressData.completedTasks instanceof Map) {
              progressData.completedTasks.forEach((value, key) => {
                totalTasksCount++;
                if (value.completed || value === true) {
                  completedTasksCount++;
                }
              });
            } else if (typeof progressData.completedTasks === 'object') {
              Object.keys(progressData.completedTasks).forEach(taskId => {
                totalTasksCount++;
                const task = progressData.completedTasks[taskId];
                if (task.completed || task === true) {
                  completedTasksCount++;
                }
              });
            }
            
            if (totalTasksCount > 0) {
              const calculatedProgress = Math.round((completedTasksCount / totalTasksCount) * 100);
              console.log(`User ${userId} - Calculated progress for ${course.domain}:`, {
                completedTasksCount,
                totalTasksCount,
                calculatedProgress
              });
              return Math.min(calculatedProgress, 100);
            }
          }
          
          // Third, fallback to module-based calculation
          const totalModules = course.modules?.length || 0;
          const completed = Number(course.completedModules) || 0;
          // If no modules exist, default to 0% progress
          if (totalModules === 0) return 0;
          return Math.min(Math.round((completed / totalModules) * 100), 100);
        })()
      }));

      console.log(`User ${userId} - Final processed user-specific courses:`, processedCourses);
      
      // Debug: Log completion status for each course
      processedCourses.forEach(course => {
        console.log(`📋 Course Status Summary:`, {
          domain: course.domain,
          progressPercentage: course.progressPercentage,
          progress: course.progress,
          currentDay: course.currentDay,
          completedModules: course.completedModules,
          totalModules: course.modules?.length || 0,
          isCompleted: course.progressPercentage >= 100 || course.progress >= 100,
          hasProgress: course.hasProgress
        });
      });
      
      setEnrolledCourses(processedCourses);
    } catch (error) {
      console.error(`User ${userId} - Error fetching enrolled courses:`, error);
      setCoursesError(`Failed to load courses for ${user.name || 'user'}`);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Function to clear all learning paths for current user from backend
  const clearAllPaths = async () => {
    const userId = user?.id || user?._id;
    if (!userId) {
      console.log('No user ID available, cannot clear paths');
      return;
    }
    
    if (window.confirm(`Are you sure you want to clear all learning paths for ${user.name}? This action cannot be undone.`)) {
      try {
        console.log(`User ${userId} - Clearing all learning paths from backend`);
        
        // Get all user's learning paths
        const response = await api.getUserLearningPaths();
        const userPaths = response.data.data || [];
        
        // Delete each learning path using the backend API
        for (const path of userPaths) {
          try {
            await api.deleteLearningPath(path._id);
            console.log(`User ${userId} - Deleted learning path:`, path._id);
          } catch (deleteError) {
            console.warn(`User ${userId} - Failed to delete path ${path._id}:`, deleteError);
          }
        }
        
        // Clear local state
        setEnrolledCourses([]);
        
        console.log(`User ${userId} - All user learning paths cleared from backend`);
        alert('All learning paths have been cleared successfully!');
        
      } catch (error) {
        console.error(`User ${userId} - Error clearing learning paths:`, error);
        alert('Failed to clear learning paths. Please try again.');
      }
    }
  };

  // Enhanced user-specific course card component
  const SafeCourseCard = ({ course }) => {
    const [backendProgress, setBackendProgress] = useState(null);
    const [progressLoaded, setProgressLoaded] = useState(false);
    const [userSpecificData, setUserSpecificData] = useState(null);

    console.log(`SafeCourseCard rendered for user ${user?.id} course:`, course);

    // Load user-specific progress and course data
    useEffect(() => {
      const loadUserSpecificData = async () => {
        console.log(`Loading user-specific data for user ${user?.id}, course:`, course?._id, course?.domain);
        
        try {
          // Load backend progress specific to this user
          const response = await api.getProgress();
          console.log(`Progress API response for user ${user?.id}:`, response.data);
          const allUserProgress = response.data.data || [];
          
          const courseId = String(course?._id || 'unknown');
          const courseDomain = course?.domain;
          
          console.log(`User ${user?.id} - Looking for progress with courseId:`, courseId, 'or domain:', courseDomain);
          console.log(`User ${user?.id} - Available progress:`, allUserProgress);
          console.log(`User ${user?.id} - User ID variations:`, { id: user?.id, _id: user?._id });
          
          // Find progress for this specific course and user
          const courseProgress = allUserProgress.find(p => {
            const learningPathMatch = p.learningPathId === courseId;
            const domainMatch = p.domain === courseDomain;
            const userIdMatch = p.userId === user?.id || p.userId === user?._id;
            
            console.log(`Checking progress entry:`, {
              progressLearningPathId: p.learningPathId,
              progressDomain: p.domain,
              progressUserId: p.userId,
              courseId,
              courseDomain,
              userIds: [user?.id, user?._id],
              learningPathMatch,
              domainMatch,
              userIdMatch,
              overallMatch: (learningPathMatch || domainMatch) && userIdMatch
            });
            
            return (learningPathMatch || domainMatch) && userIdMatch;
          });
          
          console.log(`User ${user?.id} - Found course progress:`, courseProgress);
          
          if (courseProgress) {
            setBackendProgress(courseProgress);
            console.log(`User ${user?.id} - Set backend progress:`, courseProgress);
          }

          // No localStorage usage - rely only on backend data
          setUserSpecificData(course);

        } catch (error) {
          console.warn(`User ${user?.id} - Failed to load progress from backend:`, error);
        } finally {
          setProgressLoaded(true);
        }
      };

      if (user?.id && course) {
        loadUserSpecificData();
      }
    }, [course?._id, course?.domain, user?.id]);

    try {
      const courseId = String(course?._id || 'unknown');
      
      // Use user-specific data if available, otherwise fall back to course data
      const effectiveCourseData = course; // Always use the enhanced course data from fetchEnrolledCourses
      
      const domain = safeRender(effectiveCourseData?.domain) || 'Unknown Domain';
      const level = safeRender(effectiveCourseData?.level) || 'Beginner';
      
      // Get user's actually selected skills for this course
      const userSelectedSkills = Array.isArray(effectiveCourseData?.skills) ? 
        effectiveCourseData.skills.map(skill => {
          if (typeof skill === 'object' && skill !== null) {
            return skill.name || skill.title || skill.skill || String(skill);
          }
          return String(skill);
        }).filter(skill => skill && skill !== 'undefined' && skill !== 'null') : 
        [];
      
      const modules = Array.isArray(effectiveCourseData?.modules) ? effectiveCourseData.modules : [];
      
      console.log(`User ${user?.id} - Course Details:`, {
        courseId,
        domain,
        level,
        userSelectedSkills,
        effectiveCourseData
      });

      console.log(`🔍 Enhanced Data Check for ${domain}:`, {
        hasProgress: effectiveCourseData?.hasProgress,
        progress: effectiveCourseData?.progress,
        currentDay: effectiveCourseData?.currentDay,
        progressPercentage: effectiveCourseData?.progressPercentage,
        allKeys: effectiveCourseData ? Object.keys(effectiveCourseData) : 'no data'
      });
      
      // Always prefer backend progress if available and matches user/course
      let realProgressPercentage = 0;
      let currentDay = 1;
      let totalTasks = modules.length || 1;
      let completedTasks = 0;
      let userStatus = 'Not Started';
      let statusColor = '#gray';

      console.log(`🔍 User ${user?.id} - Progress calculation debug for ${domain}:`, {
        hasBackendProgress: !!backendProgress,
        backendProgressUserId: backendProgress?.userId,
        currentUserId: user?.id || user?._id,
        backendProgressData: backendProgress,
        effectiveCourseData: effectiveCourseData,
        modulesLength: modules.length
      });

      if (backendProgress && (backendProgress.userId === user?.id || backendProgress.userId === user?._id)) {
        // Use backend progress only if it belongs to current user
        realProgressPercentage = backendProgress.overallProgress || 0;
        currentDay = backendProgress.currentDay || 1;
        if (backendProgress.completedTasks) {
          const tasks = backendProgress.completedTasks instanceof Map ? 
            Array.from(backendProgress.completedTasks.values()) :
            Object.values(backendProgress.completedTasks);
          completedTasks = tasks.filter(task => task.completed || task === true).length;
          totalTasks = tasks.length;
        }
        // If all tasks are completed, force 100%
        if (totalTasks > 0 && completedTasks === totalTasks) {
          realProgressPercentage = 100;
        }
        userStatus = realProgressPercentage === 100 ? 'Completed' : 
                    realProgressPercentage > 0 ? `In Progress - Day ${currentDay}` : 'Not Started';
        statusColor = realProgressPercentage === 100 ? '#22c55e' : 
                     realProgressPercentage > 0 ? '#3b82f6' : '#gray';
        console.log(`User ${user?.id} - Using backend progress:`, {
          realProgressPercentage,
          currentDay,
          userStatus,
          completedTasks,
          totalTasks,
          backendProgressUserId: backendProgress.userId,
          currentUserId: user?.id || user?._id
        });
      } else if (effectiveCourseData?.hasProgress && effectiveCourseData?.progress !== undefined) {
        realProgressPercentage = effectiveCourseData.progress || 0;
        currentDay = effectiveCourseData.currentDay || 1;
        totalTasks = effectiveCourseData.totalTasks || modules.length || 1;
        completedTasks = effectiveCourseData.completedModules || 0;
        // If all tasks are completed, force 100%
        if (totalTasks > 0 && completedTasks === totalTasks) {
          realProgressPercentage = 100;
        }
        userStatus = realProgressPercentage >= 100 ? 'Completed' : 
                    realProgressPercentage > 0 ? `In Progress - Day ${currentDay}` : 'Not Started';
        statusColor = realProgressPercentage >= 100 ? '#22c55e' : 
                     realProgressPercentage > 0 ? '#3b82f6' : '#gray';
        console.log(`User ${user?.id} - Using enhanced course data for ${domain}:`, {
          realProgressPercentage,
          currentDay,
          userStatus,
          completedTasks,
          totalTasks,
          hasProgress: effectiveCourseData.hasProgress,
          rawProgress: effectiveCourseData.progress
        });
      } else if (effectiveCourseData?.progress !== undefined && effectiveCourseData?.progress > 0) {
        // Fallback: Check if progress exists even without hasProgress flag
        realProgressPercentage = effectiveCourseData.progress || 0;
        currentDay = effectiveCourseData.currentDay || 1;
        // If all tasks are completed, force 100%
        if (totalTasks > 0 && completedTasks === totalTasks) {
          realProgressPercentage = 100;
        }
        userStatus = realProgressPercentage >= 100 ? 'Completed' : 
                    realProgressPercentage > 0 ? `In Progress - Day ${currentDay}` : 'Not Started';
        statusColor = realProgressPercentage >= 100 ? '#22c55e' : 
                     realProgressPercentage > 0 ? '#3b82f6' : '#gray';
        console.log(`User ${user?.id} - Using fallback course progress for ${domain}:`, {
          realProgressPercentage,
          currentDay,
          userStatus
        });
      } else if (effectiveCourseData?.progressPercentage !== undefined || effectiveCourseData?.progress !== undefined) {
        // Use course progress percentage if available
        realProgressPercentage = Number(effectiveCourseData.progressPercentage || effectiveCourseData.progress) || 0;
        currentDay = Number(effectiveCourseData.currentDay) || 1;
        completedTasks = Number(effectiveCourseData.completedModules) || 0;
        totalTasks = modules.length || 1;
        // If all tasks are completed, force 100%
        if (totalTasks > 0 && completedTasks === totalTasks) {
          realProgressPercentage = 100;
        }
        userStatus = realProgressPercentage === 100 ? 'Completed' : 
                    realProgressPercentage > 0 ? `In Progress - Day ${currentDay}` : 'Not Started';
        statusColor = realProgressPercentage === 100 ? '#22c55e' : 
                     realProgressPercentage > 0 ? '#3b82f6' : '#gray';
        console.log(`User ${user?.id} - Using course progress percentage:`, {
          realProgressPercentage,
          currentDay,
          userStatus,
          completedTasks,
          totalTasks
        });
      } else {
        // No progress data available - use default values
        console.log(`User ${user?.id} - No progress data found, using default values`);
        userStatus = 'Not Started';
        statusColor = '#gray';
      }

      const completedModules = Math.floor((realProgressPercentage / 100) * modules.length);
      
      return (
        <div key={courseId} className="course-card">
          <div className="course-header">
            <div className="course-icon">
              {domain.includes('Web') ? '🌐' :
               domain.includes('Data') ? '📊' :
               domain.includes('Mobile') ? '📱' :
               domain.includes('AI') || domain.includes('ML') ? '🤖' :
               domain.includes('DevOps') ? '⚙️' :
               domain.includes('Security') ? '🔒' : 
               domain.includes('Backend') ? '⚙️' :
               domain.includes('Frontend') ? '🎨' : 
               domain.includes('React') ? '⚛️' :
               domain.includes('Node') ? '📗' : '💼'}
            </div>
            <div className="course-info">
              <h4 className="course-title">{domain}</h4>
              <p className="course-level">Level: {level}</p>
              <p className="course-user">👤 {user?.name}'s Learning Path</p>
            </div>
          </div>
          
          <div className="course-progress">
            <div className="progress-info">
              <span className="progress-label">Learning Progress</span>
              <span className="progress-percentage" style={{ color: statusColor }}>
                {realProgressPercentage}%
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${realProgressPercentage}%` }}
              ></div>
            </div>
            <div className="progress-details">
              <small>
                {realProgressPercentage === 100 ? 
                  `✅ Completed! ${completedTasks} of ${totalTasks} tasks done` :
                  realProgressPercentage > 0 ? 
                    `📚 Day ${currentDay} - ${completedTasks} of ${totalTasks} tasks completed` :
                    '🆕 Ready to start learning'
                }
              </small>
            </div>
          </div>

          <div className="course-stats">
            <div className="stat">
              <span className="stat-value">{userSelectedSkills.length}</span>
              <span className="stat-label">Skills Selected</span>
            </div>
            <div className="stat">
              <span className="stat-value">{realProgressPercentage}%</span>
              <span className="stat-label">Complete</span>
            </div>
            <div className="stat">
              <span className="stat-value">Day {currentDay}</span>
              <span className="stat-label">Current Day</span>
            </div>
            <div className="stat">
              <span className="stat-value">{
                typeof effectiveCourseData?.estimatedDuration === 'object' && effectiveCourseData?.estimatedDuration?.value && effectiveCourseData?.estimatedDuration?.unit
                  ? `${effectiveCourseData.estimatedDuration.value} ${effectiveCourseData.estimatedDuration.unit}`
                  : effectiveCourseData?.estimatedDuration || '10 days'
              }</span>
              <span className="stat-label">Duration</span>
            </div>
          </div>

          <div className="course-skills">
            <div className="skills-label">Selected Skills for {domain}:</div>
            <div className="skills-list">
              {userSelectedSkills.length > 0 ? (
                <>
                  {userSelectedSkills.slice(0, 4).map((skill, index) => (
                    <span key={index} className="skill-tag user-skill">
                      {String(skill)}
                    </span>
                  ))}
                  {userSelectedSkills.length > 4 && (
                    <span className="skill-tag more">+{userSelectedSkills.length - 4} more</span>
                  )}
                </>
              ) : (
                <span className="skill-tag no-skills">General {domain} Skills</span>
              )}
            </div>
          </div>

          <div className="course-actions">
            <button
              onClick={async () => {
                // Get the most up-to-date progress data before navigation
                let latestProgress = null;
                let latestCurrentDay = currentDay;
                let progressData = {};
                let hasUnvisitedResources = false;
                
                try {
                  // Fetch latest progress from backend
                  const progressResponse = await api.getProgress();
                  const latestUserProgress = progressResponse.data.data || [];
                  
                  // Find progress for this specific learning path
                  latestProgress = latestUserProgress.find(p => 
                    (p.learningPathId === courseId || p.domain === domain) &&
                    p.userId === (user?.id || user?._id)
                  );
                  
                  if (latestProgress) {
                    latestCurrentDay = latestProgress.currentDay || currentDay;
                    
                    // Convert backend progress to frontend format
                    if (latestProgress.completedTasks) {
                      if (latestProgress.completedTasks instanceof Map) {
                        latestProgress.completedTasks.forEach((value, key) => {
                          progressData[key] = value.completed || value;
                        });
                      } else if (typeof latestProgress.completedTasks === 'object') {
                        Object.keys(latestProgress.completedTasks).forEach(taskId => {
                          const task = latestProgress.completedTasks[taskId];
                          progressData[taskId] = task.completed || task;
                        });
                      }
                    }

                    // Check for unvisited resources if course is completed and we have meaningful resource data
                    if (realProgressPercentage >= 100 && latestProgress.resourcesVisited && latestProgress.totalResources > 0) {
                      const visitedResources = latestProgress.resourcesVisited instanceof Map ? 
                        Array.from(latestProgress.resourcesVisited.values()) :
                        Object.values(latestProgress.resourcesVisited || {});
                      const totalResources = latestProgress.totalResources || 0;
                      hasUnvisitedResources = visitedResources.length < totalResources && totalResources > 0;
                    }
                    
                    console.log(`User ${user?.id} - Latest progress loaded:`, {
                      currentDay: latestCurrentDay,
                      completedTasks: Object.keys(progressData).length,
                      progressData,
                      hasUnvisitedResources
                    });
                  }
                } catch (error) {
                  console.warn(`User ${user?.id} - Failed to fetch latest progress:`, error);
                  // Use fallback localStorage if backend fails
                  const progressKey = `learning-progress-${domain.toLowerCase().replace(/\s+/g, '-')}-${user?.id || user?._id || 'guest'}`;
                  console.log(`🔍 Using localStorage fallback with key: ${progressKey}`);
                  const savedProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
                  console.log(`📱 localStorage progress found:`, savedProgress);
                  Object.keys(savedProgress).forEach(taskId => {
                    progressData[taskId] = savedProgress[taskId].completed;
                  });
                }

                // Only prevent navigation if course is actually completed with real progress data and no unvisited resources
                if (realProgressPercentage >= 100 && backendProgress && !hasUnvisitedResources) {
                  return;
                }

                // Navigate to continue learning with comprehensive progress data
                const isStartingFresh = realProgressPercentage === 0; // If 0% progress, treat as fresh start
                
                console.log(`🚀 NAVIGATION DEBUG for ${domain}:`, {
                  realProgressPercentage,
                  isStartingFresh,
                  hasProgressData: Object.keys(progressData).length > 0,
                  latestCurrentDay,
                  courseId
                });
                
                const navigationState = {
                  domain: { 
                    id: domain.toLowerCase().replace(/\s+/g, '-'),
                    title: domain,
                    name: domain
                  },
                  level: { 
                    id: level.toLowerCase(),
                    name: level
                  },
                  selectedSkills: userSelectedSkills.length > 0 ? userSelectedSkills.map(skill => String(skill)) : [domain],
                  analysis: {
                    domain: domain,
                    level: level,
                    skills: userSelectedSkills.length > 0 ? userSelectedSkills.map(skill => String(skill)) : [domain],
                    estimatedDuration: effectiveCourseData?.estimatedDuration || '10 days',
                    description: `${user?.name}'s ${domain} learning path at ${level} level`
                  },
                  learningPathId: courseId,
                  isFromDashboard: true,
                  enableAIAssistance: true,
                  currentDay: latestCurrentDay,
                  progressPercentage: realProgressPercentage,
                  isContinueMode: realProgressPercentage > 0,
                  isStartingFresh: isStartingFresh, // Add flag for fresh start
                  userId: user?.id || user?._id,
                  userName: user?.name,
                  userSpecificCourse: true,
                  // Pass the exact progress data for immediate restoration
                  savedProgress: isStartingFresh ? {} : progressData, // Clear saved progress if starting fresh
                  backendProgress: latestProgress,
                  continueFromExactPoint: realProgressPercentage > 0 && Object.keys(progressData).length > 0, // Only continue if there's actual progress
                  showResourcesOnly: realProgressPercentage >= 100 && hasUnvisitedResources // Flag to show only resources
                };
                
                console.log(`🚀 FINAL NAVIGATION STATE for ${domain}:`, navigationState);
                console.log(`User ${user?.id} - Continuing learning path from exact point:`, navigationState);
                navigate('/learning-path', { state: navigationState });
              }}
              className="continue-button"
              style={{
                background: realProgressPercentage >= 100 ? 
                  'linear-gradient(135deg, #22c55e, #16a34a)' : 
                  realProgressPercentage > 0 ? 
                    'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 
                    'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '8px'
              }}
            >
              {(() => {
                console.log(`🎯 Button text debug for ${domain}:`, {
                  realProgressPercentage,
                  currentDay,
                  backendProgress: !!backendProgress,
                  hasBackendResourceData: !!(backendProgress?.resourcesVisited),
                  backendCompletedTasks: backendProgress?.completedTasks ? Object.keys(backendProgress.completedTasks).length : 0
                });
                
                if (realProgressPercentage >= 100) {
                  // Only show resource information if we have meaningful backend progress data AND actual tasks completed
                  if (backendProgress && backendProgress.resourcesVisited && backendProgress.totalResources > 0 && 
                      (backendProgress.completedTasks && Object.keys(backendProgress.completedTasks).length > 0)) {
                    const visitedResources = backendProgress.resourcesVisited instanceof Map ? 
                      Array.from(backendProgress.resourcesVisited.values()) :
                      Object.values(backendProgress.resourcesVisited || {});
                    const totalResources = backendProgress.totalResources || 0;
                    const hasUnvisited = visitedResources.length < totalResources;
                    
                    console.log(`📚 Resource check for ${domain}:`, {
                      visitedResourcesLength: visitedResources.length,
                      totalResources,
                      hasUnvisited
                    });
                    
                    if (hasUnvisited && totalResources > 0) {
                      return `📚 View Resources (${visitedResources.length}/${totalResources} visited)`;
                    }
                  }
                  console.log(`🎉 Showing completion for ${domain}`);
                  return `🎉 Course Completed`;
                } else if (realProgressPercentage > 0) {
                  // Convert days to weeks for better UX (assuming 7 days = 1 week)
                  const currentWeek = Math.ceil(currentDay / 7);
                  const totalWeeks = Math.ceil((effectiveCourseData?.totalDays || 10) / 7);
                  
                  if (currentDay > 7) {
                    return `📚 Resume Week ${currentWeek} - Day ${currentDay} (${Math.min(realProgressPercentage, 100)}% Complete)`;
                  } else {
                    return `📚 Continue Day ${currentDay} (${Math.min(realProgressPercentage, 100)}% Complete)`;
                  }
                } else {
                  return `🚀 Start Learning ${domain}`;
                }
              })()}
            </button>
          </div>

          <div className="course-footer">
            <div className="course-metadata">
              <div className="metadata-item">
                <span className="metadata-label">Domain:</span>
                <span className="metadata-value">{domain}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Created:</span>
                <span className="metadata-value">
                  {effectiveCourseData?.createdAt ? 
                    new Date(effectiveCourseData.createdAt).toLocaleDateString() : 
                    'Recently'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error(`User ${user?.id} - Error rendering course card:`, error, course);
      return (
        <div className="course-card">
          <div className="error-message">
            <h3>Error displaying your course</h3>
            <p>User: {user?.name || 'Unknown'}</p>
            <p>Course ID: {String(course?._id || 'Unknown')}</p>
            <p>Domain: {course?.domain || 'Unknown'}</p>
          </div>
        </div>
      );
    }
  };

  const handleTrackProgress = () => {
    setShowProgressModal(true);
  };

  const handleShowAnalytics = async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    
    try {
      // Use the API service instead of direct fetch
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Fetching analytics data...');
      console.log('Token available:', !!token);
      console.log('User data:', user);
      
      const response = await api.getUserAnalytics();
      const data = response.data;
      
      console.log('Analytics data received:', data);
      
      // Check if this is a new user with no progress
      const isNewUser = data.totalStudyTime === 0 && 
                       data.coursesCompleted === 0 && 
                       data.skillsLearned === 0;
      
      if (isNewUser) {
        setAnalyticsError('No learning progress yet. Start your first course to see your personalized analytics!');
      }
      
      setAnalyticsData(data);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      
      if (error.response?.status === 401) {
        setAnalyticsError('Authentication error. Please log in again.');
      } else if (error.message.includes('No authentication token')) {
        setAnalyticsError('Please log in to view your analytics.');
      } else {
        setAnalyticsError('Unable to load your analytics at this time. Please try again later.');
      }
      
      setShowAnalytics(true);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleCloseAnalytics = () => {
    setShowAnalytics(false);
  };

  // Sample analytics data as fallback
  const getSampleAnalyticsData = () => ({
    totalStudyTime: 0,
    coursesCompleted: 0,
    skillsLearned: 0,
    averageScore: 0,
    aiInsights: {
      strengths: [
        "You've taken the first important step by joining our learning platform",
        "Your willingness to learn and improve shows great potential",
        "Ready to embark on an exciting educational journey"
      ],
      improvements: [
        "Start by exploring different learning domains to find your interests",
        "Complete your first learning module to begin tracking progress",
        "Set specific learning goals to maintain motivation and direction"
      ],
      recommendations: [
        "Begin with our domain selection to discover what interests you most",
        "Choose beginner-friendly courses to build confidence and momentum",
        "Join our learning community to connect with other learners"
      ],
      nextGoals: [
        "Complete your first course to unlock detailed analytics",
        "Establish a consistent daily learning routine",
        "Connect with fellow learners in your area of interest"
      ]
    },
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
      { title: 'Profile Created', date: new Date().toISOString().split('T')[0], icon: '�' }
    ]
  });

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-brand">
              <div className="brand-logo">
                📚
              </div>
              <h1 className="brand-title">Learning Path Finder</h1>
            </div>
            <div className="nav-user">
              <div className="user-welcome">
                <div className="user-avatar">
                  {(user?.name && typeof user.name === 'string' && user.name.length > 0) ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>Welcome, {user?.name || 'User'}</span>
              </div>
              <button
                onClick={logout}
                className="logout-button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="dashboard-main">
        {/* Stats Section - User Specific */}
        <div className="stats-section">
          <div className="user-stats-header">
            <h3>📊 {user?.name}'s Learning Dashboard</h3>
            <p>Your personalized learning progress and achievements</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {loadingCourses ? (
                <div className="loading-spinner-small">...</div>
              ) : (() => {
              // Count completed learning paths based on progress
              const completedLearningPaths = enrolledCourses.filter(course => course.progressPercentage === 100).length;
              
              // Count unique learning paths that have 100% overall progress in backend
              const uniqueCompletedPaths = new Set();
              
              enrolledCourses.forEach(course => {
                const progressData = userProgress.find(p => 
                  String(p.learningPathId) === String(course._id) || 
                  p.domain === course.domain
                );
                
                if (progressData && progressData.overallProgress >= 100) {
                  uniqueCompletedPaths.add(progressData.learningPathId || course._id);
                }
              });
              
              // Debug logging for completion count calculation
              console.log(`🔍 User ${user?.id} - Dashboard Completion Count Debug:`, {
                completedLearningPaths,
                uniqueCompletedPathsSize: uniqueCompletedPaths.size,
                enrolledCoursesLength: enrolledCourses.length,
                userProgressLength: userProgress.length
              });
              
              // Use the maximum of the counts to ensure accuracy
              const finalCompletedCount = Math.max(
                completedLearningPaths, 
                uniqueCompletedPaths.size
              );
              
              console.log(`User ${user?.id} - Completed Courses Calculation:`, {
                fromProgressPercentage: completedLearningPaths,
                fromBackendProgress: uniqueCompletedPaths.size,
                finalCount: finalCompletedCount,
                enrolledCourses: enrolledCourses.map(c => ({
                  id: c._id,
                  domain: c.domain,
                  progress: c.progressPercentage
                })),
                completedProgress: userProgress.filter(p => p.overallProgress >= 100).map(p => ({
                  learningPathId: p.learningPathId,
                  domain: p.domain,
                  overallProgress: p.overallProgress
                }))
              });
              
              return finalCompletedCount;
            })()}</div>
            <div className="stat-label">Completed Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {(() => {
                const skillsCount = enrolledCourses.reduce((total, course) => {
                  // Handle skills array properly
                  if (Array.isArray(course.skills)) {
                    const validSkills = course.skills.filter(skill => 
                      skill && skill !== 'undefined' && skill !== 'null' && skill.toString().trim() !== ''
                    );
                    console.log(`User ${user?.id} - Course ${course._id} skills:`, validSkills);
                    return total + validSkills.length;
                  }
                  return total;
                }, 0);
                console.log(`User ${user?.id} - Total Skills Count:`, skillsCount);
                return skillsCount;
              })()}
            </div>
            <div className="stat-label">Skills Learning</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{(() => {
              console.log(`User ${user?.id} - Active Paths Count:`, enrolledCourses.length);
              return enrolledCourses.length;
            })()}</div>
            <div className="stat-label">Active Paths</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {(() => {
                let avgProgress = enrolledCourses.length > 0 
                  ? Math.round(enrolledCourses.reduce((total, course) => total + (course.progressPercentage || 0), 0) / enrolledCourses.length)
                  : 0;
                if (avgProgress > 100) avgProgress = 100;
                console.log(`User ${user?.id} - Average Progress:`, avgProgress + '%', 'from progress values:', enrolledCourses.map(c => c.progressPercentage));
                return avgProgress;
              })()}%
            </div>
            <div className="stat-label">Avg Progress</div>
          </div>
        </div>

        {/* Welcome Section - Personalized */}
        <div className="welcome-section">
          <h2 className="welcome-title">
            Welcome to {user?.name}'s Learning Journey!
          </h2>
          <p className="welcome-subtitle">
            Hi {user?.name}! Discover personalized learning paths tailored to your goals. Start building skills that matter with our AI-powered recommendations and structured learning approach.
          </p>
          <div className="action-buttons">
            <button
              onClick={() => navigate('/domain-selection')}
              className="primary-button"
            >
              🚀 Start Learning Journey
            </button>
            {user?.learningPath && (
              <button
                onClick={() => navigate('/learning-path')}
                className="secondary-button"
              >
                📖 Continue Learning
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">🎯</div>
            <h3 className="card-title">Personalized Learning</h3>
            <p className="card-description">
              Get custom learning paths based on your experience level, goals, and preferred learning style.
            </p>
            <button 
              onClick={() => navigate('/domain-selection')}
              className="card-button"
            >
              Explore Domains
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3 className="card-title">Track Progress</h3>
            <p className="card-description">
              Monitor your learning journey with detailed analytics, skill assessments, and achievement tracking.
            </p>
            <button 
              onClick={handleTrackProgress}
              className="card-button"
            >
              View Progress
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3 className="quick-actions-title">
            ⚡ Quick Actions
          </h3>
          <div className="quick-actions-grid">
            <div 
              className="quick-action-item"
              onClick={() => navigate('/domain-selection')}
            >
              <div className="quick-action-icon">🚀</div>
              <div className="quick-action-text">New Path</div>
            </div>
            <div 
              className="quick-action-item"
              onClick={() => navigate('/profile')}
            >
              <div className="quick-action-icon">👤</div>
              <div className="quick-action-text">Profile</div>
            </div>
            <div 
              className="quick-action-item"
              onClick={() => navigate('/completed-courses')}
            >
              <div className="quick-action-icon">🎓</div>
              <div className="quick-action-text">Completed</div>
            </div>
            <div 
              className="quick-action-item"
              onClick={() => navigate('/profile?tab=settings')}
            >
              <div className="quick-action-icon">⚙️</div>
              <div className="quick-action-text">Settings</div>
            </div>
            <div 
              className="quick-action-item"
              onClick={() => navigate('/feedback')}
            >
              <div className="quick-action-icon">💬</div>
              <div className="quick-action-text">Feedback</div>
            </div>
          </div>
        </div>

        {/* My Learning Paths Overview - User Specific */}
        <div className="learning-paths-overview">
          <div className="learning-paths-header">
            <h3 className="learning-paths-title">
              🎯 {user?.name}'s Learning Paths
              <div className="title-actions">
                <button 
                  onClick={fetchEnrolledCourses}
                  className="refresh-button"
                  title="Refresh learning paths"
                >
                  🔄
                </button>
                {enrolledCourses.length > 0 && (
                  <button 
                    onClick={clearAllPaths}
                    className="clear-button"
                    title="Clear all learning paths"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </h3>
            <p className="learning-paths-subtitle">
              AI-analyzed personalized learning journeys for {user?.name}
            </p>
          </div>

          {loadingCourses ? (
            <div className="learning-paths-loading">
              <div className="loading-spinner"></div>
              <p>Analyzing your learning paths...</p>
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="learning-paths-grid">
              {enrolledCourses.map((course, index) => (
                <div key={course._id || index} className="learning-path-card">
                  <div className="path-card-header">
                    <div className="path-icon">
                      {course.domain?.includes('Web') ? '🌐' :
                       course.domain?.includes('Data') ? '📊' :
                       course.domain?.includes('Mobile') ? '📱' :
                       course.domain?.includes('AI') || course.domain?.includes('ML') ? '🤖' :
                       course.domain?.includes('DevOps') ? '⚙️' :
                       course.domain?.includes('Security') || course.domain?.includes('Ethical') ? '🔒' : 
                       course.domain?.includes('Backend') ? '⚙️' :
                       course.domain?.includes('Frontend') ? '🎨' :
                       course.domain?.includes('React') ? '⚛️' :
                       course.domain?.includes('Node') ? '�' : '�💼'}
                    </div>
                    <div className="path-status">
                      <span className="user-badge">👤 {user?.name}</span>
                      {course.progressPercentage === 100 ? 
                        <span className="status-complete">✅ Complete</span> :
                        course.progressPercentage > 0 ?
                        <span className="status-progress">🔄 In Progress</span> :
                        <span className="status-new">🆕 Not Started</span>
                      }
                    </div>
                  </div>

                  <div className="path-details">
                    <h4 className="path-title">{course.domain}</h4>
                    <div className="path-meta">
                      <div className="meta-item">
                        <span className="meta-label">Level:</span>
                        <span className={`meta-value level-badge level-${(course.level?.toLowerCase() || 'beginner')}`}>
                          {course.level || 'Beginner'}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Duration:</span>
                        <span className="meta-value">{course.estimatedDuration || '10 days'}</span>
                      </div>
                    </div>

                    <div className="path-skills">
                      <span className="skills-label">Your Selected Skills:</span>
                      <div className="skills-tags">
                        {(course.skills && course.skills.length > 0) ? (
                          <>
                            {course.skills.slice(0, 3).map((skill, skillIndex) => (
                              <span key={skillIndex} className="skill-badge">{skill}</span>
                            ))}
                            {course.skills.length > 3 && (
                              <span className="skill-badge more">+{course.skills.length - 3}</span>
                            )}
                          </>
                        ) : (
                          <span className="skill-badge general-skills">General {course.domain} Skills</span>
                        )}
                      </div>
                    </div>

                    <div className="path-progress">
                      <div className="progress-header">
                        <span className="progress-text">Learning Progress</span>
                        <span className="progress-percent">
                          {Math.min(course.progressPercentage || 0, 100)}%
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${Math.min(course.progressPercentage || 0, 100)}%`,
                            background: (course.progressPercentage >= 100 ? 
                              'linear-gradient(90deg, #22c55e, #16a34a)' :
                              course.progressPercentage > 0 ?
                              'linear-gradient(90deg, #3b82f6, #1d4ed8)' :
                              '#e5e7eb')
                          }}
                        ></div>
                      </div>
                      <div className="progress-status">
                        <small>
                          {Math.min(course.progressPercentage || 0, 100) === 100 ? 
                            `🎉 Completed ${course.domain}!` :
                            Math.min(course.progressPercentage || 0, 100) > 0 ? 
                              `📚 Day ${course.currentDay || 1} of ${course.totalDays || 10}` :
                              `🚀 Ready to start ${course.domain}`
                          }
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="path-actions">
                    <button
                      onClick={() => {
                        if ((course.progressPercentage || 0) >= 100) return;
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
                            analysis: {
                              domain: course.domain,
                              level: course.level,
                              skills: course.skills,
                              estimatedDuration: course.estimatedDuration || '10 days',
                              description: `${user?.name}'s ${course.domain} learning path at ${course.level} level`
                            },
                            learningPathId: course._id,
                            isFromDashboard: true,
                            currentDay: course.currentDay || 1,
                            progressPercentage: course.progressPercentage || 0,
                            userId: user?.id,
                            userName: user?.name
                          }
                        });
                      }}
                      className="path-action-primary"
                      style={{
                        background: (course.progressPercentage || 0) >= 100 ? 
                          'linear-gradient(135deg, #22c55e, #16a34a)' : 
                          course.progressPercentage > 0 ? 
                            'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 
                            'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: (course.progressPercentage || 0) >= 100 ? 'default' : 'pointer'
                      }}
                      disabled={(course.progressPercentage || 0) >= 100}
                    >
                      {(course.progressPercentage || 0) >= 100 ? 
                        `� Course Completed` : 
                        course.progressPercentage > 0 ? 
                          `📚 Continue Day ${course.currentDay || 1}` :
                          `🚀 Start ${course.domain}`
                      }
                    </button>
                  </div>

                  <div className="path-summary">
                    <p className="path-description">
                      {course.progressPercentage === 100 ? 
                        `You've successfully completed your ${course.domain} learning journey! 🎉` :
                        course.progressPercentage > 0 ? 
                          `You're making great progress in ${course.domain}. Keep it up!` :
                          `Your personalized ${course.domain} learning path is ready to begin.`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-learning-paths">
              <div className="no-paths-icon">🎯</div>
              <h4>{user?.name}, Start Your Learning Journey!</h4>
              <p>Create your first personalized learning path and track your progress towards mastering new skills.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => navigate('/domain-selection')}
                  className="create-path-button"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Create Your First Learning Path
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enrolled Courses - User Specific */}
        <div className="enrolled-courses">
          <div className="enrolled-courses-header">
            <h3 className="enrolled-courses-title">
              📚 {user?.name}'s Course Details
            </h3>
            <div className="enrolled-courses-actions">
              <button 
                onClick={() => {
                  console.log(`User ${user?.id} - Manual refresh triggered by user`);
                  fetchEnrolledCourses();
                }}
                className="refresh-button"
                disabled={loadingCourses}
                title="Refresh to see latest learning paths"
              >
                {loadingCourses ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
              <button 
                onClick={clearAllPaths}
                className="clear-button"
                title="Clear all your learning paths"
              >
                🗑️ Clear My Data
              </button>
            </div>
          </div>
          
          {loadingCourses ? (
            <div className="courses-loading">
              <div className="loading-spinner"></div>
              <p>Loading your learning paths...</p>
            </div>
          ) : coursesError ? (
            <div className="courses-error">
              <div className="error-icon">❌</div>
              <p>{coursesError}</p>
              <button onClick={fetchEnrolledCourses} className="retry-button">
                Try Again
              </button>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="no-courses">
              <div className="empty-icon">�</div>
              <h4>{user?.name}, Your Learning Dashboard is Ready!</h4>
              <p>Once you create a learning path, you'll see your progress, selected skills, and continue learning options here.</p>
              <div className="user-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">🎯</span>
                  <span>Track your domain-specific progress</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📈</span>
                  <span>Monitor skill development</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔄</span>
                  <span>Continue learning from where you left off</span>
                </div>
              </div>
              <div className="empty-state-help" style={{
                background: '#f3f4f6',
                padding: '16px',
                borderRadius: '8px',
                margin: '20px 0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                <p><strong>💡 Just created a learning path?</strong></p>
                <p>If you just created a learning path and don't see it here, try clicking the "🔄 Refresh" button above or wait a moment for it to appear automatically.</p>
              </div>
              <div className="action-buttons" style={{display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px'}}>
                <button 
                  onClick={() => {
                    console.log(`User ${user?.id} - Starting domain selection for first learning path`);
                    navigate('/domain-selection');
                  }} 
                  className="start-path-button"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Create Your Learning Path
                </button>
                <button 
                  onClick={() => {
                    console.log(`User ${user?.id} - Manual refresh from empty state`);
                    fetchEnrolledCourses();
                  }}
                  disabled={loadingCourses}
                  className="refresh-from-empty"
                  style={{
                    background: loadingCourses ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: loadingCourses ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loadingCourses ? '⏳ Loading...' : '🔄 Check for Learning Paths'}
                </button>
              </div>
            </div>
          ) : (
            <div className="courses-grid">
              {enrolledCourses.map((course, index) => (
                <SafeCourseCard key={course?._id || index} course={course} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📊 Track Progress</h3>
              <button 
                className="modal-close"
                onClick={() => setShowProgressModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                Monitor your learning journey with detailed analytics, skill assessments, and achievement tracking.
              </p>
              <div className="progress-features">
                <div 
                  className="feature-item clickable"
                  onClick={handleShowAnalytics}
                  disabled={isLoadingAnalytics}
                >
                  <span className="feature-icon">
                    {isLoadingAnalytics ? '⏳' : '📈'}
                  </span>
                  <span>
                    {isLoadingAnalytics ? 'Analyzing Progress...' : 'Detailed Analytics'}
                  </span>
                  <span className="feature-arrow">→</span>
                </div>
                <div 
                  className="feature-item clickable"
                  onClick={() => {
                    setShowProgressModal(false);
                    navigate('/assessment');
                  }}
                >
                  <span className="feature-icon">🧠</span>
                  <span>Skill Assessments</span>
                  <span className="feature-arrow">→</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button primary"
                onClick={() => {
                  setShowProgressModal(false);
                  navigate('/profile');
                }}
              >
                Go to Profile
              </button>
              <button 
                className="modal-button secondary"
                onClick={() => setShowProgressModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="modal-overlay" onClick={handleCloseAnalytics}>
          <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📈 Your Learning Analytics</h3>
              <button 
                className="modal-close"
                onClick={handleCloseAnalytics}
              >
                ×
              </button>
            </div>
            
            <div className="analytics-content">
              {analyticsError && (
                <div className={`analytics-error ${
                  analyticsError.includes('No learning progress') ? 'info' :
                  analyticsError.includes('Unable to connect') ? 'warning' : ''
                }`}>
                  <span className="error-icon">
                    {analyticsError.includes('No learning progress') ? 'ℹ️' :
                     analyticsError.includes('Unable to connect') ? '⚠️' : '⚠️'}
                  </span>
                  <span>{analyticsError}</span>
                </div>
              )}

              {/* AI Insights Section */}
              {analyticsData?.aiInsights && (
                <div className="analytics-section ai-insights-section">
                  <h4 className="section-title">
                    🤖 {analyticsData.totalStudyTime === 0 ? 'Welcome Message from AI' : 'AI Analysis of Your Progress'}
                  </h4>
                  
                  <div className="insights-grid">
                    <div className="insight-card strengths">
                      <h5 className="insight-title">
                        {analyticsData.totalStudyTime === 0 ? '🌟 Your Potential' : '💪 Your Strengths'}
                      </h5>
                      <ul className="insight-list">
                        {analyticsData.aiInsights.strengths.map((strength, index) => (
                          <li key={index} className="insight-item">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="insight-card improvements">
                      <h5 className="insight-title">
                        {analyticsData.totalStudyTime === 0 ? '🚀 Getting Started' : '📈 Areas for Improvement'}
                      </h5>
                      <ul className="insight-list">
                        {analyticsData.aiInsights.improvements.map((improvement, index) => (
                          <li key={index} className="insight-item">{improvement}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="insight-card recommendations">
                      <h5 className="insight-title">💡 AI Recommendations</h5>
                      <ul className="insight-list">
                        {analyticsData.aiInsights.recommendations.map((recommendation, index) => (
                          <li key={index} className="insight-item">{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="insight-card goals">
                      <h5 className="insight-title">🎯 Next Goals</h5>
                      <ul className="insight-list">
                        {analyticsData.aiInsights.nextGoals.map((goal, index) => (
                          <li key={index} className="insight-item">{goal}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Overview Stats */}
              <div className="analytics-overview">
                <div className="analytics-stat">
                  <div className="stat-value">{analyticsData?.totalStudyTime || 0}h</div>
                  <div className="stat-label">Total Study Time</div>
                </div>
                <div className="analytics-stat">
                  <div className="stat-value">{analyticsData?.coursesCompleted || 0}</div>
                  <div className="stat-label">Courses Completed</div>
                </div>
                <div className="analytics-stat">
                  <div className="stat-value">{analyticsData?.skillsLearned || 0}</div>
                  <div className="stat-label">Skills Learned</div>
                </div>
                <div className="analytics-stat">
                  <div className="stat-value">{analyticsData?.averageScore || 0}%</div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>

              {/* Weekly Progress Chart */}
              <div className="analytics-section">
                <h4 className="section-title">📊 Weekly Study Hours</h4>
                <div className="progress-chart">
                  {analyticsData?.weeklyProgress?.map((day, index) => (
                    <div key={index} className="chart-bar">
                      <div 
                        className="bar-fill" 
                        style={{ height: `${(day.hours / 5) * 100}%` }}
                      ></div>
                      <div className="bar-label">{day.day}</div>
                      <div className="bar-value">{day.hours}h</div>
                    </div>
                  )) || <div className="no-data">No weekly data available</div>}
                </div>
              </div>

              {/* Top Skills */}
              <div className="analytics-section">
                <h4 className="section-title">🎯 Top Skills Progress</h4>
                <div className="skills-list">
                  {analyticsData?.topSkills?.map((skill, index) => (
                    <div key={index} className="skill-item">
                      <div className="skill-info">
                        <span className="skill-name">
                          {skill.name}
                          {skill.category === 'Certified' && (
                            <span className="certified-badge">🏆 Certified</span>
                          )}
                        </span>
                        <span className="skill-percentage">{skill.progress}%</span>
                      </div>
                      <div className="skill-progress-bar">
                        <div 
                          className={`skill-progress-fill ${skill.category === 'Certified' ? 'certified' : ''}`}
                          style={{ width: `${skill.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )) || <div className="no-data">No skills data available</div>}
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="analytics-section">
                <h4 className="section-title">🏆 Recent Achievements</h4>
                <div className="achievements-list">
                  {analyticsData?.recentAchievements?.map((achievement, index) => (
                    <div key={index} className="achievement-item">
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-info">
                        <div className="achievement-title">{achievement.title}</div>
                        <div className="achievement-date">{achievement.date}</div>
                      </div>
                    </div>
                  )) || <div className="no-data">No achievements data available</div>}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="modal-button primary"
                onClick={handleCloseAnalytics}
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
