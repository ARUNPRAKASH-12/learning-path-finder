import axios from 'axios';

// Use environment variable for API URL, fallback to production backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://learning-path-finder-backend.onrender.com';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 30000,
    validateStatus: function (status) {
        return status < 500;
    },
    // Important for mobile compatibility
    withCredentials: false
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
    // Test endpoint
    test: async () => {
        try {
            console.log('API: Testing connection to:', API_BASE_URL);
            const response = await axiosInstance.get('/');
            console.log('API: Test response:', response.data);
            return response;
        } catch (error) {
            console.error('API: Test error:', error);
            throw error;
        }
    },
    
    // Auth endpoints
    login: async (credentials) => {
        try {
            console.log('API: Attempting login with baseURL:', API_BASE_URL);
            const response = await axiosInstance.post('/api/auth/login', credentials);
            console.log('API: Login response status:', response.status);
            console.log('API: Login response data:', response.data);
            return response;
        } catch (error) {
            console.error('API: Login error:', error);
            console.error('API: Login error response:', error.response?.data);
            console.error('API: Login error status:', error.response?.status);
            throw error;
        }
    },
    register: async (userData) => {
        try {
            console.log('API: Attempting registration with baseURL:', API_BASE_URL);
            console.log('API: Registration data:', userData);
            const response = await axiosInstance.post('/api/auth/register', userData);
            console.log('API: Registration response status:', response.status);
            console.log('API: Registration response data:', response.data);
            return response;
        } catch (error) {
            console.error('API: Registration error:', error);
            console.error('API: Registration error response:', error.response?.data);
            console.error('API: Registration error status:', error.response?.status);
            console.error('API: Full error object:', {
                message: error.message,
                code: error.code,
                config: error.config
            });
            throw error;
        }
    },
    
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
