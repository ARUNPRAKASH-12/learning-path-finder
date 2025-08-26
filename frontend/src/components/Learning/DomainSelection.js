import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './DomainSelection.css';

// Helper function to get user-specific localStorage key
const getUserStorageKey = (userId) => {
    return userId ? `userLearningPaths_${userId}` : 'userLearningPaths_guest';
};

// Comprehensive skills data for each domain and level
const domainSkillsData = {
    frontend: {
        beginner: [
            { name: 'HTML Fundamentals', description: 'Learn semantic HTML structure and elements', level: 'beginner', priority: 'high', estimatedLearningTime: '1-2 weeks' },
            { name: 'CSS Basics', description: 'Styling web pages with CSS', level: 'beginner', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'JavaScript Fundamentals', description: 'Core JavaScript concepts and DOM manipulation', level: 'beginner', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Responsive Design', description: 'Creating mobile-first responsive layouts', level: 'beginner', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'Version Control (Git)', description: 'Managing code with Git and GitHub', level: 'beginner', priority: 'medium', estimatedLearningTime: '1-2 weeks' },
            { name: 'Browser DevTools', description: 'Debugging and inspecting web applications', level: 'beginner', priority: 'medium', estimatedLearningTime: '1 week' }
        ],
        intermediate: [
            { name: 'React.js', description: 'Building dynamic UIs with React components', level: 'intermediate', priority: 'high', estimatedLearningTime: '4-6 weeks' },
            { name: 'JavaScript ES6+', description: 'Modern JavaScript features and syntax', level: 'intermediate', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'CSS Frameworks', description: 'Using Bootstrap, Tailwind CSS for rapid development', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'API Integration', description: 'Fetching and handling data from REST APIs', level: 'intermediate', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'State Management', description: 'Managing application state with Redux or Context', level: 'intermediate', priority: 'medium', estimatedLearningTime: '3-4 weeks' },
            { name: 'Build Tools', description: 'Using Webpack, Vite, and npm/yarn', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2 weeks' }
        ],
        professional: [
            { name: 'Advanced React Patterns', description: 'Higher-order components, render props, hooks patterns', level: 'professional', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'TypeScript', description: 'Adding type safety to JavaScript applications', level: 'professional', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'Performance Optimization', description: 'Code splitting, lazy loading, and performance monitoring', level: 'professional', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Testing', description: 'Unit testing with Jest, React Testing Library, E2E testing', level: 'professional', priority: 'medium', estimatedLearningTime: '3-4 weeks' },
            { name: 'Micro-frontends', description: 'Building scalable frontend architectures', level: 'professional', priority: 'low', estimatedLearningTime: '4-5 weeks' },
            { name: 'Progressive Web Apps', description: 'Creating app-like web experiences', level: 'professional', priority: 'medium', estimatedLearningTime: '2-3 weeks' }
        ]
    },
    backend: {
        beginner: [
            { name: 'Server Fundamentals', description: 'Understanding how web servers work', level: 'beginner', priority: 'high', estimatedLearningTime: '2 weeks' },
            { name: 'Node.js Basics', description: 'JavaScript runtime environment for servers', level: 'beginner', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Express.js', description: 'Building REST APIs with Express framework', level: 'beginner', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Database Basics', description: 'SQL and NoSQL database fundamentals', level: 'beginner', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'HTTP/HTTPS', description: 'Understanding web protocols and status codes', level: 'beginner', priority: 'medium', estimatedLearningTime: '1-2 weeks' },
            { name: 'Environment Variables', description: 'Managing configuration and secrets', level: 'beginner', priority: 'medium', estimatedLearningTime: '1 week' }
        ],
        intermediate: [
            { name: 'Database Design', description: 'Designing efficient database schemas', level: 'intermediate', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Authentication & Authorization', description: 'Implementing secure user systems', level: 'intermediate', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'API Security', description: 'Securing APIs with validation and rate limiting', level: 'intermediate', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'Caching Strategies', description: 'Implementing Redis and memory caching', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'Message Queues', description: 'Asynchronous processing with queues', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'Testing APIs', description: 'Unit and integration testing for backend services', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2 weeks' }
        ],
        professional: [
            { name: 'Microservices Architecture', description: 'Designing distributed systems', level: 'professional', priority: 'high', estimatedLearningTime: '5-6 weeks' },
            { name: 'Docker & Containerization', description: 'Containerizing applications for deployment', level: 'professional', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Cloud Deployment', description: 'Deploying to AWS, Azure, or Google Cloud', level: 'professional', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'Performance Monitoring', description: 'Application monitoring and logging', level: 'professional', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'Load Balancing', description: 'Scaling applications with load balancers', level: 'professional', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'DevOps Integration', description: 'CI/CD pipelines and automation', level: 'professional', priority: 'medium', estimatedLearningTime: '3-4 weeks' }
        ]
    },
    security: {
        beginner: [
            { name: 'Security Fundamentals', description: 'Basic cybersecurity concepts and principles', level: 'beginner', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'Network Basics', description: 'Understanding TCP/IP, DNS, and network protocols', level: 'beginner', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Linux Command Line', description: 'Essential Linux commands for security professionals', level: 'beginner', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'Information Gathering', description: 'Reconnaissance and OSINT techniques', level: 'beginner', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'Basic Cryptography', description: 'Understanding encryption and hashing', level: 'beginner', priority: 'medium', estimatedLearningTime: '2 weeks' },
            { name: 'Security Tools Introduction', description: 'Getting familiar with Nmap, Wireshark, Metasploit', level: 'beginner', priority: 'medium', estimatedLearningTime: '3-4 weeks' }
        ],
        intermediate: [
            { name: 'Web Application Security', description: 'OWASP Top 10 and web vulnerabilities', level: 'intermediate', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'Network Penetration Testing', description: 'Network vulnerability assessment and exploitation', level: 'intermediate', priority: 'high', estimatedLearningTime: '5-6 weeks' },
            { name: 'Vulnerability Assessment', description: 'Identifying and prioritizing security weaknesses', level: 'intermediate', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Social Engineering', description: 'Understanding human-based attack vectors', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'Incident Response', description: 'Responding to and analyzing security incidents', level: 'intermediate', priority: 'medium', estimatedLearningTime: '3-4 weeks' },
            { name: 'Forensics Basics', description: 'Digital forensics and evidence collection', level: 'intermediate', priority: 'medium', estimatedLearningTime: '3-4 weeks' }
        ],
        professional: [
            { name: 'Advanced Penetration Testing', description: 'Complex infrastructure and application testing', level: 'professional', priority: 'high', estimatedLearningTime: '6-8 weeks' },
            { name: 'Red Team Operations', description: 'Simulating advanced persistent threats', level: 'professional', priority: 'high', estimatedLearningTime: '6-8 weeks' },
            { name: 'Malware Analysis', description: 'Reverse engineering and analyzing malicious software', level: 'professional', priority: 'high', estimatedLearningTime: '5-6 weeks' },
            { name: 'Cloud Security', description: 'Securing AWS, Azure, and cloud infrastructures', level: 'professional', priority: 'medium', estimatedLearningTime: '4-5 weeks' },
            { name: 'Mobile Security', description: 'iOS and Android application security testing', level: 'professional', priority: 'medium', estimatedLearningTime: '4-5 weeks' },
            { name: 'Zero-Day Research', description: 'Finding and exploiting unknown vulnerabilities', level: 'professional', priority: 'low', estimatedLearningTime: '8-12 weeks' }
        ]
    },
    ml: {
        beginner: [
            { name: 'Python Fundamentals', description: 'Core Python programming for data science', level: 'beginner', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Statistics & Mathematics', description: 'Essential math concepts for machine learning', level: 'beginner', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'Data Manipulation', description: 'Working with pandas and numpy for data analysis', level: 'beginner', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'Data Visualization', description: 'Creating charts and graphs with matplotlib and seaborn', level: 'beginner', priority: 'medium', estimatedLearningTime: '2 weeks' },
            { name: 'Introduction to ML', description: 'Basic machine learning concepts and terminology', level: 'beginner', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'Jupyter Notebooks', description: 'Interactive development environment for data science', level: 'beginner', priority: 'medium', estimatedLearningTime: '1 week' }
        ],
        intermediate: [
            { name: 'Supervised Learning', description: 'Classification and regression algorithms', level: 'intermediate', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'Unsupervised Learning', description: 'Clustering and dimensionality reduction', level: 'intermediate', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Feature Engineering', description: 'Creating and selecting relevant features', level: 'intermediate', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Model Evaluation', description: 'Cross-validation and performance metrics', level: 'intermediate', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'Scikit-learn', description: 'Using the popular ML library for model building', level: 'intermediate', priority: 'medium', estimatedLearningTime: '3-4 weeks' },
            { name: 'Data Preprocessing', description: 'Cleaning and preparing data for modeling', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2-3 weeks' }
        ],
        professional: [
            { name: 'Deep Learning', description: 'Neural networks with TensorFlow and PyTorch', level: 'professional', priority: 'high', estimatedLearningTime: '6-8 weeks' },
            { name: 'Natural Language Processing', description: 'Working with text data and language models', level: 'professional', priority: 'high', estimatedLearningTime: '5-6 weeks' },
            { name: 'Computer Vision', description: 'Image processing and convolutional neural networks', level: 'professional', priority: 'high', estimatedLearningTime: '5-6 weeks' },
            { name: 'MLOps', description: 'Deploying and monitoring ML models in production', level: 'professional', priority: 'medium', estimatedLearningTime: '4-5 weeks' },
            { name: 'AutoML', description: 'Automated machine learning and hyperparameter tuning', level: 'professional', priority: 'medium', estimatedLearningTime: '3-4 weeks' },
            { name: 'Reinforcement Learning', description: 'Training agents to make decisions in environments', level: 'professional', priority: 'low', estimatedLearningTime: '6-8 weeks' }
        ]
    },
    fullstack: {
        beginner: [
            { name: 'HTML/CSS Basics', description: 'Foundation of web development', level: 'beginner', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'JavaScript Fundamentals', description: 'Core programming concepts for web development', level: 'beginner', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Backend Basics', description: 'Understanding server-side development', level: 'beginner', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Database Introduction', description: 'Working with databases and SQL', level: 'beginner', priority: 'high', estimatedLearningTime: '2-3 weeks' },
            { name: 'Version Control', description: 'Git and GitHub for code management', level: 'beginner', priority: 'medium', estimatedLearningTime: '1-2 weeks' },
            { name: 'Development Environment', description: 'Setting up tools and workflows', level: 'beginner', priority: 'medium', estimatedLearningTime: '1 week' }
        ],
        intermediate: [
            { name: 'React Development', description: 'Building dynamic frontend applications', level: 'intermediate', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'Node.js & Express', description: 'Building robust backend APIs', level: 'intermediate', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'Database Design', description: 'Designing efficient data models', level: 'intermediate', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'Authentication Systems', description: 'Implementing secure user management', level: 'intermediate', priority: 'high', estimatedLearningTime: '3-4 weeks' },
            { name: 'API Development', description: 'Creating and consuming RESTful APIs', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2-3 weeks' },
            { name: 'State Management', description: 'Managing application state across frontend and backend', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2-3 weeks' }
        ],
        professional: [
            { name: 'Microservices Architecture', description: 'Building scalable distributed systems', level: 'professional', priority: 'high', estimatedLearningTime: '5-6 weeks' },
            { name: 'Cloud Deployment', description: 'Deploying fullstack applications to cloud platforms', level: 'professional', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'Performance Optimization', description: 'Optimizing both frontend and backend performance', level: 'professional', priority: 'high', estimatedLearningTime: '4-5 weeks' },
            { name: 'DevOps Integration', description: 'CI/CD pipelines and automated deployment', level: 'professional', priority: 'medium', estimatedLearningTime: '3-4 weeks' },
            { name: 'Testing Strategies', description: 'Comprehensive testing across the full stack', level: 'professional', priority: 'medium', estimatedLearningTime: '3-4 weeks' },
            { name: 'Security Implementation', description: 'End-to-end security for fullstack applications', level: 'professional', priority: 'medium', estimatedLearningTime: '4-5 weeks' }
        ]
    }
};

// Local function to generate analysis data
const generateLocalAnalysis = (domainId, levelId) => {
    console.log('Generating analysis for:', domainId, 'at level:', levelId);
    console.log('Available domains in skillsData:', Object.keys(domainSkillsData));
    
    const skills = domainSkillsData[domainId]?.[levelId] || [];
    
    // If no skills found, provide fallback skills based on domain
    if (skills.length === 0) {
        console.warn(`No skills found for domain: ${domainId}, level: ${levelId}. Using fallbacks.`);
        const fallbackSkills = getFallbackSkills(domainId, levelId);
        
        return {
            domain: domainId,
            level: levelId,
            skills: fallbackSkills,
            roadmap: generateRoadmap(domainId, levelId),
            estimatedDuration: calculateEstimatedDuration(fallbackSkills),
            difficulty: levelId,
            prerequisites: getPrerequisites(domainId, levelId),
            careerOpportunities: getCareerOpportunities(domainId, levelId)
        };
    }
    
    return {
        domain: domainId,
        level: levelId,
        skills: skills,
        roadmap: generateRoadmap(domainId, levelId),
        estimatedDuration: calculateEstimatedDuration(skills),
        difficulty: levelId,
        prerequisites: getPrerequisites(domainId, levelId),
        careerOpportunities: getCareerOpportunities(domainId, levelId)
    };
};

// Fallback skills for when domain data is missing
const getFallbackSkills = (domainId, levelId) => {
    const fallbacks = {
        frontend: {
            beginner: [
                { name: 'HTML Fundamentals', description: 'Basic HTML structure and elements', level: 'beginner', priority: 'high', estimatedLearningTime: '2 weeks' },
                { name: 'CSS Basics', description: 'Styling and layout fundamentals', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'JavaScript Basics', description: 'Programming fundamentals with JavaScript', level: 'beginner', priority: 'high', estimatedLearningTime: '4 weeks' }
            ],
            intermediate: [
                { name: 'React Framework', description: 'Building components with React', level: 'intermediate', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'State Management', description: 'Managing application state', level: 'intermediate', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'API Integration', description: 'Connecting to backend services', level: 'intermediate', priority: 'medium', estimatedLearningTime: '2 weeks' }
            ],
            professional: [
                { name: 'Advanced React Patterns', description: 'Complex React architecture', level: 'professional', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Performance Optimization', description: 'Optimizing app performance', level: 'professional', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'Testing Strategies', description: 'Unit and integration testing', level: 'professional', priority: 'medium', estimatedLearningTime: '3 weeks' }
            ]
        },
        backend: {
            beginner: [
                { name: 'Server Fundamentals', description: 'Understanding web servers', level: 'beginner', priority: 'high', estimatedLearningTime: '2 weeks' },
                { name: 'Node.js Basics', description: 'JavaScript on the server', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'Database Basics', description: 'Working with databases', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' }
            ],
            intermediate: [
                { name: 'API Development', description: 'Building REST APIs', level: 'intermediate', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Authentication', description: 'User authentication systems', level: 'intermediate', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'Database Design', description: 'Designing efficient schemas', level: 'intermediate', priority: 'medium', estimatedLearningTime: '3 weeks' }
            ],
            professional: [
                { name: 'Microservices', description: 'Distributed system architecture', level: 'professional', priority: 'high', estimatedLearningTime: '5 weeks' },
                { name: 'Cloud Deployment', description: 'Deploying to cloud platforms', level: 'professional', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Performance Monitoring', description: 'System monitoring and optimization', level: 'professional', priority: 'medium', estimatedLearningTime: '3 weeks' }
            ]
        },
        security: {
            beginner: [
                { name: 'Security Fundamentals', description: 'Basic cybersecurity concepts', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'Network Basics', description: 'Understanding network protocols', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'Linux Command Line', description: 'Essential Linux commands', level: 'beginner', priority: 'high', estimatedLearningTime: '2 weeks' }
            ],
            intermediate: [
                { name: 'Penetration Testing', description: 'Ethical hacking techniques', level: 'intermediate', priority: 'high', estimatedLearningTime: '5 weeks' },
                { name: 'Web Security', description: 'Web application vulnerabilities', level: 'intermediate', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Security Tools', description: 'Using security testing tools', level: 'intermediate', priority: 'medium', estimatedLearningTime: '3 weeks' }
            ],
            professional: [
                { name: 'Advanced Exploitation', description: 'Complex attack techniques', level: 'professional', priority: 'high', estimatedLearningTime: '6 weeks' },
                { name: 'Incident Response', description: 'Security incident handling', level: 'professional', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Security Architecture', description: 'Designing secure systems', level: 'professional', priority: 'medium', estimatedLearningTime: '5 weeks' }
            ]
        },
        ml: {
            beginner: [
                { name: 'Python Programming', description: 'Programming fundamentals with Python', level: 'beginner', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Data Analysis', description: 'Working with data using pandas', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'Statistics Basics', description: 'Statistical concepts for ML', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' }
            ],
            intermediate: [
                { name: 'Machine Learning Algorithms', description: 'Core ML algorithms and concepts', level: 'intermediate', priority: 'high', estimatedLearningTime: '5 weeks' },
                { name: 'Model Training', description: 'Training and evaluating models', level: 'intermediate', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Feature Engineering', description: 'Preparing data for ML models', level: 'intermediate', priority: 'medium', estimatedLearningTime: '3 weeks' }
            ],
            professional: [
                { name: 'Deep Learning', description: 'Neural networks and deep learning', level: 'professional', priority: 'high', estimatedLearningTime: '6 weeks' },
                { name: 'MLOps', description: 'ML model deployment and monitoring', level: 'professional', priority: 'high', estimatedLearningTime: '5 weeks' },
                { name: 'Advanced Architectures', description: 'Complex ML system design', level: 'professional', priority: 'medium', estimatedLearningTime: '4 weeks' }
            ]
        },
        fullstack: {
            beginner: [
                { name: 'Web Fundamentals', description: 'HTML, CSS, and JavaScript basics', level: 'beginner', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Backend Basics', description: 'Server-side programming introduction', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'Database Fundamentals', description: 'Working with databases', level: 'beginner', priority: 'high', estimatedLearningTime: '3 weeks' }
            ],
            intermediate: [
                { name: 'Full-stack Framework', description: 'Using modern full-stack frameworks', level: 'intermediate', priority: 'high', estimatedLearningTime: '5 weeks' },
                { name: 'API Integration', description: 'Connecting frontend and backend', level: 'intermediate', priority: 'high', estimatedLearningTime: '3 weeks' },
                { name: 'User Authentication', description: 'Implementing secure user systems', level: 'intermediate', priority: 'medium', estimatedLearningTime: '3 weeks' }
            ],
            professional: [
                { name: 'System Architecture', description: 'Designing scalable full-stack systems', level: 'professional', priority: 'high', estimatedLearningTime: '6 weeks' },
                { name: 'DevOps Integration', description: 'CI/CD and deployment strategies', level: 'professional', priority: 'high', estimatedLearningTime: '4 weeks' },
                { name: 'Performance Optimization', description: 'Full-stack performance tuning', level: 'professional', priority: 'medium', estimatedLearningTime: '4 weeks' }
            ]
        }
    };
    
    return fallbacks[domainId]?.[levelId] || fallbacks.frontend.beginner;
};

const generateRoadmap = (domainId, levelId) => {
    const phases = {
        beginner: ['Foundation', 'Practice', 'Build Projects'],
        intermediate: ['Advanced Concepts', 'Real-world Projects', 'Best Practices'],
        professional: ['Expert Techniques', 'Architecture', 'Leadership']
    };
    return phases[levelId] || phases.beginner;
};

const calculateEstimatedDuration = (skills) => {
    // Return consistent 10 days duration
    return '10 days';
};

const getPrerequisites = (domainId, levelId) => {
    const prerequisites = {
        frontend: {
            beginner: ['Basic computer skills', 'Willingness to learn'],
            intermediate: ['HTML/CSS knowledge', 'Basic JavaScript'],
            professional: ['Strong JavaScript skills', 'Framework experience']
        },
        backend: {
            beginner: ['Programming fundamentals', 'Basic computer skills'],
            intermediate: ['JavaScript or Python knowledge', 'Database basics'],
            professional: ['Strong backend experience', 'System design knowledge']
        },
        security: {
            beginner: ['Basic computer knowledge', 'Interest in cybersecurity'],
            intermediate: ['Networking fundamentals', 'Linux basics'],
            professional: ['Penetration testing experience', 'Security certifications']
        },
        ml: {
            beginner: ['Basic programming', 'Mathematics background'],
            intermediate: ['Python proficiency', 'Statistics knowledge'],
            professional: ['ML algorithm understanding', 'Deep learning basics']
        },
        fullstack: {
            beginner: ['Basic programming concepts', 'Problem-solving skills'],
            intermediate: ['Frontend and backend basics', 'Database knowledge'],
            professional: ['Full development experience', 'System architecture knowledge']
        }
    };
    return prerequisites[domainId]?.[levelId] || [];
};

const getCareerOpportunities = (domainId, levelId) => {
    const opportunities = {
        frontend: {
            beginner: ['Junior Frontend Developer', 'Web Developer Intern'],
            intermediate: ['Frontend Developer', 'React Developer', 'UI Developer'],
            professional: ['Senior Frontend Developer', 'Frontend Architect', 'Technical Lead']
        },
        backend: {
            beginner: ['Junior Backend Developer', 'API Developer Intern'],
            intermediate: ['Backend Developer', 'Node.js Developer', 'Database Developer'],
            professional: ['Senior Backend Developer', 'Backend Architect', 'DevOps Engineer']
        },
        security: {
            beginner: ['Security Analyst Intern', 'IT Security Assistant'],
            intermediate: ['Penetration Tester', 'Security Analyst', 'Cybersecurity Specialist'],
            professional: ['Senior Security Consultant', 'Red Team Lead', 'Security Architect']
        },
        ml: {
            beginner: ['Data Analyst Intern', 'ML Engineering Intern'],
            intermediate: ['Data Scientist', 'ML Engineer', 'AI Developer'],
            professional: ['Senior Data Scientist', 'ML Architect', 'AI Research Scientist']
        },
        fullstack: {
            beginner: ['Junior Fullstack Developer', 'Web Developer'],
            intermediate: ['Fullstack Developer', 'Full-stack Engineer'],
            professional: ['Senior Fullstack Developer', 'Solution Architect', 'Technical Lead']
        }
    };
    return opportunities[domainId]?.[levelId] || [];
};

const domains = [
    {
        id: 'frontend',
        title: 'Frontend Developer',
        icon: '💻',
        description: 'Create user interfaces and web applications'
    },
    {
        id: 'backend',
        title: 'Backend Developer',
        icon: '⚙️',
        description: 'Build server-side logic and databases'
    },
    {
        id: 'fullstack',
        title: 'Fullstack Developer',
        icon: '🔄',
        description: 'Develop both frontend and backend'
    },
    {
        id: 'security',
        title: 'Ethical Hacker',
        icon: '🔒',
        description: 'Protect systems and find vulnerabilities'
    },
    {
        id: 'ml',
        title: 'Machine Learning Engineer',
        icon: '🧠',
        description: 'Build AI and machine learning systems'
    }
];

const levels = [
    {
        id: 'beginner',
        name: 'Beginner',
        icon: '🌱',
        description: 'New to this field, starting from basics'
    },
    {
        id: 'intermediate',
        name: 'Intermediate',
        icon: '🚀',
        description: 'Some experience, ready for deeper concepts'
    },
    {
        id: 'professional',
        name: 'Professional',
        icon: '⭐',
        description: 'Experienced, looking to master advanced skills'
    }
];

const DomainSelection = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [completedCourses, setCompletedCourses] = useState([]);
    const [loadingCompletedCourses, setLoadingCompletedCourses] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Function to check if a domain+level combination is already completed
    const isCompletedCombination = (domainId, levelId) => {
        return completedCourses.some(course => {
            const courseDomainId = course.domain?.toLowerCase().replace(/\s+/g, '-') || 
                                   course.domain?.toLowerCase().replace(/\s+/g, '') || '';
            const courseLevelId = course.level?.toLowerCase() || '';
            
            return courseDomainId.includes(domainId) || domainId.includes(courseDomainId) || 
                   (courseDomainId === domainId && courseLevelId === levelId);
        });
    };

    // Load completed courses on component mount
    useEffect(() => {
        const loadCompletedCourses = async () => {
            try {
                setLoadingCompletedCourses(true);
                
                // Fetch completed courses from backend
                const response = await api.getCompletedLearningPaths();
                const completedPaths = response.data.data || [];
                
                // Also fetch progress data to find 100% completed courses
                const progressResponse = await api.getProgress();
                const progressData = progressResponse.data.data || [];
                
                const completedProgress = progressData.filter(p => 
                    p.userId === (user?.id || user?._id) && p.overallProgress >= 100
                );
                
                // Combine completed courses from both sources
                const allCompletedCourses = [];
                
                // Add from completed paths
                completedPaths.forEach(path => {
                    allCompletedCourses.push({
                        domain: path.domain,
                        level: path.level,
                        completedAt: path.completedAt || path.updatedAt,
                        source: 'backend-status'
                    });
                });
                
                // Add from progress data (100% completed)
                completedProgress.forEach(progress => {
                    // Check if not already added from completed paths
                    const alreadyExists = allCompletedCourses.some(course => 
                        course.domain === progress.domain
                    );
                    
                    if (!alreadyExists) {
                        allCompletedCourses.push({
                            domain: progress.domain,
                            level: 'Unknown',
                            completedAt: progress.completedAt || progress.updatedAt,
                            source: 'progress-data'
                        });
                    }
                });
                
                setCompletedCourses(allCompletedCourses);
                console.log('Loaded completed courses:', allCompletedCourses);
                
            } catch (error) {
                console.warn('Failed to load completed courses:', error);
                // Continue without completed course data
                setCompletedCourses([]);
            } finally {
                setLoadingCompletedCourses(false);
            }
        };

        if (user) {
            loadCompletedCourses();
        } else {
            setLoadingCompletedCourses(false);
        }
    }, [user]);

    const handleDomainSelect = (domain) => {
        setSelectedDomain(domain);
        setError(null);
    };

    const handleLevelSelect = (level) => {
        setSelectedLevel(level);
        setError(null);
    };

    const handleStartAnalysis = async () => {
        if (!selectedDomain || !selectedLevel) {
            setError('Please select both a domain and level');
            return;
        }

        // Check if this domain+level combination is already completed
        if (isCompletedCombination(selectedDomain.id, selectedLevel.id)) {
            setError(`You have already completed a ${selectedLevel.name} level course in ${selectedDomain.title}. Please choose a different domain or level to continue your learning journey.`);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('Analyzing domain:', selectedDomain.id, 'at level:', selectedLevel.id);
            
            // Generate analysis result text
            const analysisText = `🎯 Perfect match! We've identified ${domainSkillsData[selectedDomain.id]?.[selectedLevel.id]?.length || 6} essential skills for your ${selectedLevel.name} ${selectedDomain.title} journey. This comprehensive path will build your expertise systematically, starting with fundamentals and progressing to advanced concepts. Your estimated completion time is ${calculateEstimatedDuration(domainSkillsData[selectedDomain.id]?.[selectedLevel.id] || [])}.`;
            
            setAnalysisResult(analysisText);
            
            // Simulate some processing time for better UX
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate local analysis data
            const analysis = generateLocalAnalysis(selectedDomain.id, selectedLevel.id);
            console.log('Generated analysis:', analysis);

            if (analysis && analysis.skills && analysis.skills.length > 0) {
                console.log(`Found ${analysis.skills.length} skills for ${selectedDomain.title}`);
                
                // Create the learning path data for dashboard
                const newLearningPath = {
                    _id: `path-${Date.now()}`,
                    domain: selectedDomain.title,
                    level: selectedLevel.name,
                    skills: analysis.skills,
                    estimatedDuration: calculateEstimatedDuration(analysis.skills),
                    modules: analysis.skills.map((skill, index) => `Module ${index + 1}: ${skill.name || skill}`),
                    completedModules: 0,
                    progress: 0,
                    createdAt: new Date().toISOString(),
                    isAIGenerated: true,
                    userId: user?.id // IMPORTANT: Add userId for proper filtering
                };

                // Clear existing paths and save only the new selected path
                const userStorageKey = getUserStorageKey(user?.id);
                localStorage.setItem(userStorageKey, JSON.stringify([newLearningPath]));
                
                // Manually trigger storage change event for same-window updates
                window.dispatchEvent(new StorageEvent('storage', {
                    key: userStorageKey,
                    newValue: JSON.stringify([newLearningPath]),
                    url: window.location.href
                }));
                
                // Show analysis result for a moment before navigating
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Navigate to resource selection page with the analysis data
                navigate('/resource-selection', { 
                    state: { 
                        domain: selectedDomain,
                        level: selectedLevel,
                        analysis: analysis
                    }
                });
            } else {
                throw new Error('No skills found for this domain and level combination');
            }
        } catch (err) {
            console.error('Domain analysis error:', err);
            setError(`Failed to start learning journey: ${err.message || 'Unknown error occurred'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="domain-selection-container">
            <div className="domain-selection-content">
                {/* Back to Dashboard Button */}
                <div className="back-button-container">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="back-to-dashboard-button"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <div className="domain-header">
                    <h1 className="domain-title">
                        Start Your Learning Journey
                    </h1>
                    <p className="domain-subtitle">
                        Choose your learning path and skill level
                    </p>
                    <p className="domain-description">
                        Personalized learning paths designed for your success
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {/* Loading State for Completed Courses */}
                {loadingCompletedCourses && (
                    <div className="loading-completed-courses">
                        <div className="loading-spinner"></div>
                        <p>Loading your completed courses...</p>
                    </div>
                )}

                {/* Step 1: Domain Selection */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                        1. Choose Your Learning Path
                    </h2>
                    <div className="domain-grid">
                        {domains.map((domain, index) => {
                            // Count completed levels for this domain
                            const completedLevels = levels.filter(level => 
                                isCompletedCombination(domain.id, level.id)
                            ).length;
                            
                            return (
                                <button
                                    key={domain.id}
                                    onClick={() => handleDomainSelect(domain)}
                                    disabled={loading}
                                    className={`domain-card ${
                                        selectedDomain?.id === domain.id ? 'selected' : ''
                                    }`}
                                    style={{animationDelay: `${index * 0.1}s`}}
                                >
                                    <span className="domain-icon">{domain.icon}</span>
                                    <h3 className="domain-card-title">
                                        {domain.title}
                                    </h3>
                                    <p className="domain-card-description">{domain.description}</p>
                                    
                                    {/* Completion Status */}
                                    {completedLevels > 0 && (
                                        <div className="domain-completion-status">
                                            <span className="completion-indicator">
                                                ✅ {completedLevels} level{completedLevels !== 1 ? 's' : ''} completed
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Skills Preview */}
                                    <div className="domain-skills-preview">
                                        <h4 className="skills-preview-title">Sample Skills:</h4>
                                        <div className="skills-preview-list">
                                            {domainSkillsData[domain.id]?.beginner?.slice(0, 3).map((skill, skillIndex) => (
                                                <span key={skillIndex} className="skill-preview-tag">
                                                    {skill.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {selectedDomain?.id === domain.id && (
                                        <div className="mt-3 text-indigo-600 font-medium">
                                            ✓ Selected
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Step 2: Level Selection */}
                {selectedDomain && (
                    <div className="level-selection">
                        <h2 className="level-selection-title">
                            2. Choose Your Level
                        </h2>
                        <div className="level-grid">
                            {levels.map((level, index) => {
                                const isCompleted = isCompletedCombination(selectedDomain.id, level.id);
                                
                                return (
                                    <button
                                        key={level.id}
                                        onClick={() => !isCompleted && handleLevelSelect(level)}
                                        disabled={loading || isCompleted}
                                        className={`level-card ${
                                            selectedLevel?.id === level.id ? 'selected' : ''
                                        } ${isCompleted ? 'completed-disabled' : ''}`}
                                        style={{animationDelay: `${index * 0.1}s`}}
                                        title={isCompleted ? `You have already completed a ${level.name} level course in ${selectedDomain.title}` : ''}
                                    >
                                        <div className="text-4xl mb-4">{level.icon}</div>
                                        <h3 className="level-name">
                                            {level.name}
                                        </h3>
                                        <p className="level-description">{level.description}</p>
                                        
                                        {isCompleted && (
                                            <div className="completion-badge">
                                                <span className="completed-text">✅ Already Completed</span>
                                                <span className="completed-subtext">Choose a different level</span>
                                            </div>
                                        )}
                                        
                                        {!isCompleted && selectedLevel?.id === level.id && (
                                            <div className="mt-3 text-green-600 font-medium">
                                                ✓ Selected
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* AI Analysis Result */}
                {analysisResult && (
                    <div className="analysis-section">
                        <h3 className="analysis-title">
                            🤖 AI Analysis Result
                        </h3>
                        <div className="analysis-content">
                            {analysisResult}
                        </div>
                    </div>
                )}

                {/* Step 3: Start Analysis Button */}
                {selectedDomain && selectedLevel && (
                    <div className="text-center mt-8">
                        <button
                            onClick={handleStartAnalysis}
                            disabled={loading}
                            className="continue-button"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Analyzing...
                                </div>
                            ) : (
                                `Start ${selectedLevel.name} ${selectedDomain.title} Journey`
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DomainSelection;
