import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResourceSelection.css';

const ResourceSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { domain, level, analysis } = location.state || {};
    
    const [selectedResources, setSelectedResources] = useState({
        courses: [],
        documentation: [],
        videos: [],
        practice: [],
        repositories: []
    });
    const [loading, setLoading] = useState(false);
    const [resources, setResources] = useState(null);

    useEffect(() => {
        if (!domain || !level) {
            navigate('/domain-selection');
            return;
        }
        generateResources();
    }, [domain, level, navigate]);

    const generateResources = () => {
        setLoading(true);
        
        // Generate comprehensive resources based on domain and level
        const resourceData = getResourcesForDomain(domain.id || domain, level.id || level);
        setResources(resourceData);
        
        setTimeout(() => {
            setLoading(false);
        }, 1500);
    };

    const getResourcesForDomain = (domainId, levelId) => {
        const resourceMap = {
            frontend: {
                beginner: {
                    courses: [
                        {
                            title: "Complete Web Development Bootcamp",
                            provider: "Udemy",
                            url: "https://www.udemy.com/course/the-complete-web-development-bootcamp/",
                            rating: 4.7,
                            duration: "65 hours",
                            price: "$89.99",
                            description: "Comprehensive course covering HTML, CSS, JavaScript, Node.js, React, and more"
                        },
                        {
                            title: "Web Development Fundamentals",
                            provider: "Coursera",
                            url: "https://www.coursera.org/specializations/web-development",
                            rating: 4.6,
                            duration: "6 months",
                            price: "$49/month",
                            description: "University-level web development course"
                        },
                        {
                            title: "Frontend Developer Career Path",
                            provider: "Scrimba",
                            url: "https://scrimba.com/learn/frontend",
                            rating: 4.8,
                            duration: "70 hours",
                            price: "$20/month",
                            description: "Interactive coding course with real-world projects"
                        }
                    ],
                    documentation: [
                        {
                            title: "MDN Web Docs - HTML",
                            url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
                            description: "Complete HTML reference and tutorials"
                        },
                        {
                            title: "MDN Web Docs - CSS",
                            url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
                            description: "Comprehensive CSS documentation and guides"
                        },
                        {
                            title: "MDN Web Docs - JavaScript",
                            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
                            description: "Official JavaScript documentation and tutorials"
                        },
                        {
                            title: "W3Schools Web Development",
                            url: "https://www.w3schools.com/",
                            description: "Beginner-friendly web development tutorials"
                        }
                    ],
                    videos: [
                        {
                            title: "HTML Full Course - Build a Website Tutorial",
                            channel: "freeCodeCamp.org",
                            url: "https://www.youtube.com/watch?v=pQN-pnXPaVg",
                            duration: "2 hours",
                            views: "3.2M"
                        },
                        {
                            title: "CSS Tutorial - Zero to Hero",
                            channel: "freeCodeCamp.org",
                            url: "https://www.youtube.com/watch?v=1Rs2ND1ryYc",
                            duration: "6 hours",
                            views: "1.8M"
                        },
                        {
                            title: "JavaScript Tutorial for Beginners",
                            channel: "Programming with Mosh",
                            url: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
                            duration: "1 hour",
                            views: "2.4M"
                        }
                    ],
                    practice: [
                        {
                            title: "freeCodeCamp",
                            url: "https://www.freecodecamp.org/learn/responsive-web-design/",
                            description: "Interactive coding challenges and projects",
                            type: "Interactive Platform"
                        },
                        {
                            title: "Codecademy Web Development",
                            url: "https://www.codecademy.com/learn/paths/web-development",
                            description: "Hands-on coding exercises and projects",
                            type: "Interactive Platform"
                        },
                        {
                            title: "Frontend Mentor",
                            url: "https://www.frontendmentor.io/",
                            description: "Real-world frontend challenges",
                            type: "Challenge Platform"
                        },
                        {
                            title: "Codepen",
                            url: "https://codepen.io/",
                            description: "Online code editor and community",
                            type: "Code Editor"
                        }
                    ],
                    repositories: [
                        {
                            title: "30 Days of JavaScript",
                            url: "https://github.com/Asabeneh/30-Days-Of-JavaScript",
                            stars: "42.3k",
                            description: "30 days of JavaScript programming challenge"
                        },
                        {
                            title: "Frontend Checklist",
                            url: "https://github.com/thedaviddias/Front-End-Checklist",
                            stars: "66.9k",
                            description: "Perfect frontend checklist for modern websites"
                        },
                        {
                            title: "You Don't Know JS",
                            url: "https://github.com/getify/You-Dont-Know-JS",
                            stars: "178k",
                            description: "A book series on JavaScript"
                        },
                        {
                            title: "Awesome Web Development",
                            url: "https://github.com/sindresorhus/awesome#front-end-development",
                            stars: "300k+",
                            description: "Curated list of awesome web development resources"
                        }
                    ]
                },
                intermediate: {
                    courses: [
                        {
                            title: "Modern React with Redux",
                            provider: "Udemy",
                            url: "https://www.udemy.com/course/react-redux/",
                            rating: 4.6,
                            duration: "52 hours",
                            price: "$94.99",
                            description: "Master React and Redux with real-world projects"
                        },
                        {
                            title: "Advanced CSS and Sass",
                            provider: "Udemy",
                            url: "https://www.udemy.com/course/advanced-css-and-sass/",
                            rating: 4.8,
                            duration: "28 hours",
                            price: "$89.99",
                            description: "Modern CSS including Flexbox, CSS Grid, Sass and more"
                        },
                        {
                            title: "JavaScript: The Advanced Concepts",
                            provider: "Udemy",
                            url: "https://www.udemy.com/course/advanced-javascript-concepts/",
                            rating: 4.7,
                            duration: "25 hours",
                            price: "$89.99",
                            description: "Advanced JavaScript concepts for senior developers"
                        }
                    ],
                    documentation: [
                        {
                            title: "React Official Documentation",
                            url: "https://react.dev/learn",
                            description: "Official React documentation and learning resources"
                        },
                        {
                            title: "TypeScript Documentation",
                            url: "https://www.typescriptlang.org/docs/",
                            description: "Complete TypeScript handbook and reference"
                        },
                        {
                            title: "Webpack Documentation",
                            url: "https://webpack.js.org/concepts/",
                            description: "Module bundler documentation and guides"
                        }
                    ],
                    videos: [
                        {
                            title: "React Course - Beginner's Tutorial for React JavaScript Library",
                            channel: "freeCodeCamp.org",
                            url: "https://www.youtube.com/watch?v=bMknfKXIFA8",
                            duration: "12 hours",
                            views: "3.8M"
                        },
                        {
                            title: "TypeScript Tutorial for Beginners",
                            channel: "Programming with Mosh",
                            url: "https://www.youtube.com/watch?v=d56mG7DezGs",
                            duration: "1 hour",
                            views: "1.2M"
                        }
                    ],
                    practice: [
                        {
                            title: "React Challenges",
                            url: "https://github.com/alexgurr/react-coding-challenges",
                            description: "Collection of React coding challenges",
                            type: "GitHub Repository"
                        },
                        {
                            title: "JavaScript30",
                            url: "https://javascript30.com/",
                            description: "30 Day Vanilla JS Challenge",
                            type: "Challenge Course"
                        }
                    ],
                    repositories: [
                        {
                            title: "React Patterns",
                            url: "https://github.com/chantastic/reactpatterns.com",
                            stars: "13.1k",
                            description: "React patterns, techniques, tips and tricks"
                        },
                        {
                            title: "Awesome React",
                            url: "https://github.com/enaqx/awesome-react",
                            stars: "63.3k",
                            description: "Collection of awesome things regarding React ecosystem"
                        }
                    ]
                },
                professional: {
                    courses: [
                        {
                            title: "Microfrontends with React",
                            provider: "Udemy",
                            url: "https://www.udemy.com/course/microfrontend-course/",
                            rating: 4.6,
                            duration: "19 hours",
                            price: "$89.99",
                            description: "Build scalable microfrontend applications"
                        },
                        {
                            title: "Advanced React and GraphQL",
                            provider: "Advanced React",
                            url: "https://advancedreact.com/",
                            rating: 4.9,
                            duration: "68 hours",
                            price: "$199",
                            description: "Build fullstack applications with React and GraphQL"
                        }
                    ],
                    documentation: [
                        {
                            title: "React Advanced Guides",
                            url: "https://react.dev/learn/thinking-in-react",
                            description: "Advanced React concepts and patterns"
                        },
                        {
                            title: "Performance Best Practices",
                            url: "https://web.dev/fast/",
                            description: "Web performance optimization techniques"
                        }
                    ],
                    videos: [
                        {
                            title: "Advanced React Patterns",
                            channel: "React Conf",
                            url: "https://www.youtube.com/watch?v=PlmsweSNhTw",
                            duration: "30 mins",
                            views: "125k"
                        }
                    ],
                    practice: [
                        {
                            title: "React Performance Challenges",
                            url: "https://github.com/alexgurr/react-performance-challenges",
                            description: "Advanced React performance optimization challenges",
                            type: "GitHub Repository"
                        }
                    ],
                    repositories: [
                        {
                            title: "React Performance",
                            url: "https://github.com/kentcdodds/react-performance",
                            stars: "2.8k",
                            description: "React performance workshop"
                        }
                    ]
                }
            },
            backend: {
                beginner: {
                    courses: [
                        {
                            title: "The Complete Node.js Developer Course",
                            provider: "Udemy",
                            url: "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",
                            rating: 4.6,
                            duration: "35 hours",
                            price: "$89.99",
                            description: "Learn Node.js by building real-world applications"
                        },
                        {
                            title: "Node.js, Express, MongoDB & More",
                            provider: "Udemy",
                            url: "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/",
                            rating: 4.8,
                            duration: "42 hours",
                            price: "$89.99",
                            description: "Complete backend development with Node.js"
                        }
                    ],
                    documentation: [
                        {
                            title: "Node.js Official Documentation",
                            url: "https://nodejs.org/en/docs/",
                            description: "Official Node.js documentation and guides"
                        },
                        {
                            title: "Express.js Documentation",
                            url: "https://expressjs.com/",
                            description: "Express.js framework documentation"
                        },
                        {
                            title: "MongoDB Documentation",
                            url: "https://docs.mongodb.com/",
                            description: "MongoDB database documentation"
                        }
                    ],
                    videos: [
                        {
                            title: "Node.js Tutorial for Beginners",
                            channel: "Programming with Mosh",
                            url: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
                            duration: "1 hour",
                            views: "2.1M"
                        },
                        {
                            title: "Learn Node.js - Full Tutorial for Beginners",
                            channel: "freeCodeCamp.org",
                            url: "https://www.youtube.com/watch?v=RLtyhwFtXQA",
                            duration: "8 hours",
                            views: "1.2M"
                        }
                    ],
                    practice: [
                        {
                            title: "NodeSchool",
                            url: "https://nodeschool.io/",
                            description: "Interactive Node.js tutorials",
                            type: "Interactive Platform"
                        },
                        {
                            title: "Express Tutorial",
                            url: "https://expressjs.com/en/starter/installing.html",
                            description: "Official Express.js tutorial and examples",
                            type: "Tutorial"
                        }
                    ],
                    repositories: [
                        {
                            title: "Node.js Best Practices",
                            url: "https://github.com/goldbergyoni/nodebestpractices",
                            stars: "98.8k",
                            description: "The Node.js best practices list"
                        },
                        {
                            title: "Awesome Node.js",
                            url: "https://github.com/sindresorhus/awesome-nodejs",
                            stars: "57.7k",
                            description: "Delightful Node.js packages and resources"
                        }
                    ]
                }
            },
            security: {
                beginner: {
                    courses: [
                        {
                            title: "The Complete Ethical Hacking Course",
                            provider: "Udemy",
                            url: "https://www.udemy.com/course/learn-ethical-hacking-from-scratch/",
                            rating: 4.5,
                            duration: "25 hours",
                            price: "$89.99",
                            description: "Learn ethical hacking from scratch"
                        },
                        {
                            title: "Cybersecurity Fundamentals",
                            provider: "Coursera",
                            url: "https://www.coursera.org/specializations/cyber-security",
                            rating: 4.6,
                            duration: "4 months",
                            price: "$49/month",
                            description: "University-level cybersecurity course"
                        }
                    ],
                    documentation: [
                        {
                            title: "OWASP Top 10",
                            url: "https://owasp.org/www-project-top-ten/",
                            description: "Top 10 web application security risks"
                        },
                        {
                            title: "NIST Cybersecurity Framework",
                            url: "https://www.nist.gov/cyberframework",
                            description: "Framework for improving cybersecurity"
                        }
                    ],
                    videos: [
                        {
                            title: "Ethical Hacking Full Course",
                            channel: "Edureka",
                            url: "https://www.youtube.com/watch?v=fDeLtKUxTmM",
                            duration: "10 hours",
                            views: "1.5M"
                        }
                    ],
                    practice: [
                        {
                            title: "TryHackMe",
                            url: "https://tryhackme.com/",
                            description: "Hands-on cybersecurity training",
                            type: "Practice Platform"
                        },
                        {
                            title: "HackTheBox",
                            url: "https://www.hackthebox.com/",
                            description: "Penetration testing labs",
                            type: "Practice Platform"
                        }
                    ],
                    repositories: [
                        {
                            title: "Awesome Hacking",
                            url: "https://github.com/carpedm20/awesome-hacking",
                            stars: "12.1k",
                            description: "Collection of hacking tools and resources"
                        }
                    ]
                }
            }
        };

        // Get resources for the specific domain and level, with fallbacks
        const domainResources = resourceMap[domainId] || resourceMap.frontend;
        return domainResources[levelId] || domainResources.beginner;
    };

    const handleResourceToggle = (category, resource) => {
        setSelectedResources(prev => {
            const categoryResources = prev[category] || [];
            const isSelected = categoryResources.some(r => r.title === resource.title);
            
            if (isSelected) {
                return {
                    ...prev,
                    [category]: categoryResources.filter(r => r.title !== resource.title)
                };
            } else {
                return {
                    ...prev,
                    [category]: [...categoryResources, resource]
                };
            }
        });
    };

    const handleStartLearning = () => {
        // Ensure we have proper skills data from the analysis
        const skillsArray = analysis?.skills || [];
        
        // If skills is empty, create fallback skills based on domain and level
        let finalSkills = skillsArray;
        if (skillsArray.length === 0) {
            const domainId = domain?.id || domain?.name || 'frontend';
            const levelId = level?.id || level?.name || 'beginner';
            
            // Create basic skills based on domain
            const fallbackSkills = {
                frontend: [
                    { name: 'HTML Fundamentals', description: 'Basic HTML structure', estimatedLearningTime: '2 weeks' },
                    { name: 'CSS Basics', description: 'Styling and layout', estimatedLearningTime: '3 weeks' },
                    { name: 'JavaScript Fundamentals', description: 'Core programming concepts', estimatedLearningTime: '4 weeks' }
                ],
                backend: [
                    { name: 'Server Fundamentals', description: 'Understanding web servers', estimatedLearningTime: '2 weeks' },
                    { name: 'Database Basics', description: 'Working with databases', estimatedLearningTime: '3 weeks' },
                    { name: 'API Development', description: 'Building REST APIs', estimatedLearningTime: '4 weeks' }
                ],
                security: [
                    { name: 'Security Fundamentals', description: 'Basic cybersecurity concepts', estimatedLearningTime: '3 weeks' },
                    { name: 'Network Security', description: 'Understanding network protocols', estimatedLearningTime: '3 weeks' },
                    { name: 'Penetration Testing', description: 'Ethical hacking techniques', estimatedLearningTime: '4 weeks' }
                ],
                ml: [
                    { name: 'Python Programming', description: 'Programming with Python', estimatedLearningTime: '4 weeks' },
                    { name: 'Data Analysis', description: 'Working with data', estimatedLearningTime: '3 weeks' },
                    { name: 'Machine Learning Basics', description: 'Core ML concepts', estimatedLearningTime: '5 weeks' }
                ],
                fullstack: [
                    { name: 'Frontend Development', description: 'User interface development', estimatedLearningTime: '4 weeks' },
                    { name: 'Backend Development', description: 'Server-side programming', estimatedLearningTime: '4 weeks' },
                    { name: 'Database Management', description: 'Working with databases', estimatedLearningTime: '3 weeks' }
                ]
            };
            
            finalSkills = fallbackSkills[domainId] || fallbackSkills.frontend;
        }
        
        console.log('ResourceSelection - Navigating with skills:', finalSkills);
        console.log('ResourceSelection - Domain:', domain);
        console.log('ResourceSelection - Level:', level);
        
        // Navigate to learning path with selected resources and proper skills data
        navigate('/learning-path', {
            state: {
                domain,
                level,
                analysis: {
                    ...analysis,
                    skills: finalSkills
                },
                selectedSkills: finalSkills,
                selectedResources,
                isFromResourceSelection: true,
                learningPathId: `path-${Date.now()}`
            }
        });
    };

    const isResourceSelected = (category, resource) => {
        return selectedResources[category]?.some(r => r.title === resource.title) || false;
    };

    const getTotalSelectedResources = () => {
        return Object.values(selectedResources).reduce((total, resources) => total + resources.length, 0);
    };

    if (loading) {
        return (
            <div className="resource-selection-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>AI is searching for the best learning resources...</h2>
                    <p>Finding courses, documentation, videos, and practice platforms for {domain?.title} at {level?.name} level</p>
                </div>
            </div>
        );
    }

    if (!resources) {
        return (
            <div className="resource-selection-container">
                <div className="error-container">
                    <h2>Unable to load resources</h2>
                    <button onClick={() => navigate('/domain-selection')}>
                        Back to Domain Selection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="resource-selection-container">
            <div className="resource-header">
                <button 
                    onClick={() => navigate('/domain-selection')}
                    className="back-button"
                >
                    ← Back to Domain Selection
                </button>
                
                <div className="selection-summary">
                    <h1>Select Your Learning Resources</h1>
                    <p className="selection-info">
                        <span className="domain-info">
                            <strong>{domain?.title}</strong> • {level?.name} Level
                        </span>
                    </p>
                    <p className="instruction">
                        Choose the resources that match your learning style. AI has curated the best options for your path.
                    </p>
                </div>
            </div>

            <div className="resources-grid">
                {/* Online Courses */}
                <div className="resource-category">
                    <div className="category-header">
                        <h3>🎓 Online Courses</h3>
                        <span className="category-description">Structured learning paths</span>
                    </div>
                    <div className="resource-list">
                        {resources.courses?.map((course, index) => (
                            <div 
                                key={index}
                                className={`resource-item ${isResourceSelected('courses', course) ? 'selected' : ''}`}
                                onClick={() => handleResourceToggle('courses', course)}
                            >
                                <div className="resource-content">
                                    <div className="resource-title">{course.title}</div>
                                    <div className="resource-provider">{course.provider}</div>
                                    <div className="resource-description">{course.description}</div>
                                    <div className="resource-meta">
                                        <span className="duration">⏱ {course.duration}</span>
                                        <span className="price">💰 {course.price}</span>
                                        <span className="rating">⭐ {course.rating}</span>
                                    </div>
                                </div>
                                <div className="resource-actions">
                                    <a href={course.url} target="_blank" rel="noopener noreferrer" className="view-link">
                                        View Course
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Documentation */}
                <div className="resource-category">
                    <div className="category-header">
                        <h3>📚 Official Documentation</h3>
                        <span className="category-description">Authoritative references and guides</span>
                    </div>
                    <div className="resource-list">
                        {resources.documentation?.map((doc, index) => (
                            <div 
                                key={index}
                                className={`resource-item ${isResourceSelected('documentation', doc) ? 'selected' : ''}`}
                                onClick={() => handleResourceToggle('documentation', doc)}
                            >
                                <div className="resource-content">
                                    <div className="resource-title">{doc.title}</div>
                                    <div className="resource-description">{doc.description}</div>
                                </div>
                                <div className="resource-actions">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="view-link">
                                        View Docs
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video Tutorials */}
                <div className="resource-category">
                    <div className="category-header">
                        <h3>🎥 Video Tutorials</h3>
                        <span className="category-description">Learn by watching and doing</span>
                    </div>
                    <div className="resource-list">
                        {resources.videos?.map((video, index) => (
                            <div 
                                key={index}
                                className={`resource-item ${isResourceSelected('videos', video) ? 'selected' : ''}`}
                                onClick={() => handleResourceToggle('videos', video)}
                            >
                                <div className="resource-content">
                                    <div className="resource-title">{video.title}</div>
                                    <div className="resource-provider">{video.channel}</div>
                                    <div className="resource-meta">
                                        <span className="duration">⏱ {video.duration}</span>
                                        <span className="views">👁 {video.views} views</span>
                                    </div>
                                </div>
                                <div className="resource-actions">
                                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="view-link">
                                        Watch Video
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Practice Platforms */}
                <div className="resource-category">
                    <div className="category-header">
                        <h3>💻 Practice Platforms</h3>
                        <span className="category-description">Hands-on coding and exercises</span>
                    </div>
                    <div className="resource-list">
                        {resources.practice?.map((platform, index) => (
                            <div 
                                key={index}
                                className={`resource-item ${isResourceSelected('practice', platform) ? 'selected' : ''}`}
                                onClick={() => handleResourceToggle('practice', platform)}
                            >
                                <div className="resource-content">
                                    <div className="resource-title">{platform.title}</div>
                                    <div className="resource-type">{platform.type}</div>
                                    <div className="resource-description">{platform.description}</div>
                                </div>
                                <div className="resource-actions">
                                    <a href={platform.url} target="_blank" rel="noopener noreferrer" className="view-link">
                                        Visit Platform
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GitHub Repositories */}
                <div className="resource-category">
                    <div className="category-header">
                        <h3>🌟 GitHub Repositories</h3>
                        <span className="category-description">Open source projects and examples</span>
                    </div>
                    <div className="resource-list">
                        {resources.repositories?.map((repo, index) => (
                            <div 
                                key={index}
                                className={`resource-item ${isResourceSelected('repositories', repo) ? 'selected' : ''}`}
                                onClick={() => handleResourceToggle('repositories', repo)}
                            >
                                <div className="resource-content">
                                    <div className="resource-title">{repo.title}</div>
                                    <div className="resource-description">{repo.description}</div>
                                    <div className="resource-meta">
                                        <span className="stars">⭐ {repo.stars} stars</span>
                                    </div>
                                </div>
                                <div className="resource-actions">
                                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="view-link">
                                        View Repository
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Start Learning Button */}
            <div className="start-learning-section">
                <div className="selection-summary-footer">
                    <p>Selected Resources: <strong>{getTotalSelectedResources()}</strong></p>
                    <p className="recommendation">
                        💡 Tip: Select 2-3 courses, documentation, and practice platforms for best results
                    </p>
                </div>
                <button 
                    onClick={handleStartLearning}
                    className="start-learning-button"
                    disabled={getTotalSelectedResources() === 0}
                >
                    Start Learning with Selected Resources
                </button>
            </div>
        </div>
    );
};

export default ResourceSelection;
