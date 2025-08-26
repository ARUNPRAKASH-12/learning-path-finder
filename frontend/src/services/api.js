import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Token management for requests
let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

export const clearAuthToken = () => {
    authToken = null;
};

axiosInstance.interceptors.request.use(
    (config) => {
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAuthToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const api = {
    // Auth endpoints
    login: (credentials) => axiosInstance.post('/api/auth/login', credentials),
    register: (userData) => axiosInstance.post('/api/auth/register', userData),
    
    // Domain analysis
    analyzeDomain: (domain) => axiosInstance.post('/api/ai/analyze-domain', { domain }),
    analyzeDomainWithLevel: (domain, level) => axiosInstance.post('/api/ai/analyze-domain', { domain, level }),
    
    // Skills and resources
    getSkillResources: (skill, level) => axiosInstance.post('/api/ai/skill-resources', { skill, level }),
    
    // Daily tasks generation
    generateDailyTasks: (domain, skills, level, duration) => axiosInstance.post('/api/ai/generate-daily-tasks', { domain, skills, level, duration }),
    
    // Feedback
    submitFeedback: (feedbackData) => axiosInstance.post('/api/ai/feedback', feedbackData),
    
    // Progress tracking
    updateProgress: (data) => axiosInstance.post('/api/progress/update', data),
    getProgress: () => axiosInstance.get('/api/progress'),
    completeTask: (taskData) => axiosInstance.post('/api/progress/complete-task', taskData),
    
    // Learning paths
    getUserLearningPaths: () => axiosInstance.get('/api/paths'),
    getCompletedLearningPaths: () => axiosInstance.get('/api/paths/completed'),
    getLearningPath: (pathId) => axiosInstance.get(`/api/paths/${pathId}`),
    createLearningPath: (pathData) => axiosInstance.post('/api/paths', pathData),
    updateLearningPath: (pathId, pathData) => axiosInstance.put(`/api/paths/${pathId}`, pathData),
    deleteLearningPath: (pathId) => axiosInstance.delete(`/api/paths/${pathId}`),
    
    // User profile
    updateUserProfile: (profileData) => axiosInstance.put('/api/users/profile', profileData),
    getUserAnalytics: () => axiosInstance.get('/api/users/progress-analytics'),
    deleteUserAccount: () => axiosInstance.delete('/api/users/delete-account')
};

export default api;
