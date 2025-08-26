import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Initialize the AI model with the new SDK
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

class AIService {
    constructor() {
        // Using the latest gemini-2.5-flash model
        this.model = "gemini-2.5-flash";
        this.config = {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            thinkingConfig: {
                thinkingBudget: 0 // Disables thinking to reduce token usage
            }
        };
    }

    async analyzeDomain(domain) {
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
            try {
                // Add retry logic with exponential backoff
                if (retryCount > 0) {
                    const delay = retryCount * 2000; // 2s, 4s delay
                    console.log(`Retry attempt ${retryCount} for ${domain} after ${delay}ms delay`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                const promptText = `As a career and learning path advisor, thoroughly research and analyze the ${domain} development path using the most current information available online. 

Search extensively for information about ${domain} career paths, required skills, industry trends, and learning resources. Conduct comprehensive research to provide specific, accurate, and useful information from actual resources.

Respond ONLY with a JSON object in this exact format:
{
    "overview": "A comprehensive overview of what ${domain} development involves, its importance, and career prospects",
    "skills": [
                    {
                        "name": "specific skill name",
                        "description": "2-3 sentence detailed description of this skill and why it matters",
                        "priority": "high/medium/low",
                        "level": "beginner/intermediate/advanced",
                        "estimatedLearningTime": "x weeks/months",
                        "resources": [
                            {
                                "name": "Platform or course name",
                                "url": "Direct URL to the specific course/resource",
                                "type": "platform/course/documentation/practice",
                                "difficulty": "beginner/intermediate/advanced",
                                "isFree": true/false,
                                "description": "Detailed description of what you'll learn",
                                "duration": "estimated completion time"
                            }
                        ]
                    }
                ],
                "progression": {
                    "entry": {
                        "roles": ["Detailed entry level position titles"],
                        "salaryRange": "Realistic salary range for beginners",
                        "yearsExperience": "Required years of experience",
                        "certifications": ["Specific beginner certification names with links"],
                        "projects": ["Concrete project ideas with descriptions"]
                    },
                    "intermediate": {
                        "roles": ["Specific mid-level position titles"],
                        "salaryRange": "Realistic salary range for intermediate roles",
                        "yearsExperience": "Required years of experience",
                        "certifications": ["Specific intermediate certification names with links"],
                        "projects": ["Concrete mid-level project ideas with descriptions"]
                    },
                    "advanced": {
                        "roles": ["Specific senior position titles"],
                        "salaryRange": "Realistic salary range for advanced roles",
                        "yearsExperience": "Required years of experience",
                        "certifications": ["Specific advanced certification names with links"],
                        "projects": ["Concrete advanced project ideas with descriptions"]
                    }
                },
                "industryDemand": {
                    "level": "high/medium/low",
                    "growthRate": "Annual growth rate percentage",
                    "averageSalary": "Detailed salary range by experience level in USD",
                    "jobMarketSize": "Number of available positions globally/regionally",
                    "trends": ["Specific current technology trends with examples"],
                    "requiredSkills": ["Most in-demand technical skills for this domain"],
                    "softSkills": ["Important soft skills for this domain"],
                    "topEmployers": ["Specific major companies hiring in this domain"],
                    "communities": [
                        {
                            "name": "Actual community name",
                            "url": "Direct community URL",
                            "type": "forum/discord/slack/subreddit",
                            "memberCount": "Approximate member count",
                            "focus": "What this community specializes in"
                        }
                    ]
                }
            }
            
IMPORTANT REQUIREMENTS:
1. Include at least 8 specific skills, with at least 2 each for beginner, intermediate, and advanced levels
2. For each skill, include at least 2-3 high-quality, specific resources with working URLs (no placeholder URLs)
3. Ensure skills are properly categorized by level (beginner/intermediate/advanced)
4. Provide specific, named certifications relevant to the domain with provider information
5. Include actual, current salary information and specific job titles
6. Give specific, realistic project ideas for each level with implementation details
7. List real communities with actual URLs where people discuss this domain
8. Ensure all URLs are valid, working links to real resources (e.g., Coursera, Udemy, edX, official documentation)
9. Research and provide up-to-date information about the current job market for this domain
10. For example, if the domain is "security", include platforms like TryHackMe, HackTheBox, certification paths like CompTIA Security+, CEH, CISSP, etc.
11. DO NOT include any text outside the JSON structure`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: promptText,
                config: this.config
            });

            if (!response || !response.text) {
                throw new Error('No response from AI service');
            }

            const text = response.text;
            if (!text) {
                throw new Error('Empty response from AI service');
            }

            // Clean the response - remove any non-JSON content
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error('No JSON object found in response');
            }
            
            let cleanJson = text.slice(jsonStart, jsonEnd);
            
            // Additional JSON cleaning for common issues
            try {
                // Try to fix trailing commas in arrays which cause JSON parse errors
                cleanJson = cleanJson.replace(/,\s*]/g, ']');
                cleanJson = cleanJson.replace(/,\s*}/g, '}');
                
                const parsed = JSON.parse(cleanJson);
                
                // Validate required fields
                if (!parsed.overview || !parsed.skills || !parsed.progression || !parsed.industryDemand) {
                    console.log('Missing required fields in response, using fallback structure');
                    if (!parsed.overview) parsed.overview = `Overview of ${domain} development and its importance in the industry`;
                    if (!parsed.progression) parsed.progression = { entry: {}, intermediate: {}, advanced: {} };
                    if (!parsed.industryDemand) parsed.industryDemand = { level: "medium" };
                }
                
                // Ensure skills array is not empty
                if (!Array.isArray(parsed.skills) || parsed.skills.length === 0) {
                    // Generate fallback skills based on the domain
                    parsed.skills = this.getDomainFallbackSkills(domain);
                    console.log(`Using fallback skills for ${domain}`);
                }
                
                // Sort skills by level for better display order
                if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
                    const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                    parsed.skills.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
                }

                // Return the modified JSON as a string
                return JSON.stringify(parsed);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                throw new Error('Failed to parse AI response: ' + parseError.message);
            }
        } catch (error) {
            retryCount++;
            console.error(`Error in analyzeDomain (attempt ${retryCount}):`, error.message);
            
            if (retryCount > maxRetries) {
                throw new Error(`Failed to analyze domain after ${maxRetries} retries: ${error.message}`);
            }
            // Continue to next iteration of while loop for retry
        }
    }
        
        // This should never execute due to the return statements in the loop
        throw new Error(`Failed to analyze domain after ${maxRetries} retries`);
    }
    
    async getSkillResources(skill, level) {
        try {
            const promptText = `Find specific learning resources for ${skill} at ${level} level. Include:
            1. Online courses with direct URLs (Coursera, Udemy, etc.)
            2. Official documentation links
            3. Video tutorials
            4. Practice platforms
            5. GitHub repositories for practice
            Return the response as JSON with URLs and descriptions.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: promptText,
                config: this.config
            });
            
            return response.text;
        } catch (error) {
            throw new Error(`Failed to get resources: ${error.message}`);
        }
    }

    async processUserFeedback(feedback, interaction) {
        try {
            const promptText = `Analyze this user feedback: ${feedback}
            Previous interaction: ${interaction}
            Suggest improvements and alternative approaches.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: promptText,
                config: this.config
            });
            
            return response.text;
        } catch (error) {
            throw new Error(`Failed to process feedback: ${error.message}`);
        }
    }
    
    // Fallback skills if AI doesn't return any
    getDomainFallbackSkills(domain) {
        const normalizedDomain = domain.toLowerCase();
        // Base structure for resources
        const baseResource = {
            "name": "Online Tutorial",
            "url": "https://www.coursera.org/",
            "type": "course",
            "difficulty": "beginner",
            "isFree": false,
            "description": "Introduction to the fundamentals"
        };
        
        // Default fallback skills
        const defaultSkills = [
            {
                "name": "Fundamentals of " + domain,
                "description": "Basic principles and concepts of " + domain,
                "priority": "high",
                "level": "beginner",
                "estimatedLearningTime": "3-4 weeks",
                "resources": [{ ...baseResource }]
            },
            {
                "name": domain + " Best Practices",
                "description": "Standard methodologies and practices in " + domain,
                "priority": "high",
                "level": "beginner",
                "estimatedLearningTime": "2-3 weeks",
                "resources": [{ ...baseResource, difficulty: "beginner" }]
            },
            {
                "name": "Intermediate " + domain + " Concepts",
                "description": "More advanced techniques and knowledge in " + domain,
                "priority": "medium",
                "level": "intermediate",
                "estimatedLearningTime": "4-6 weeks",
                "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://www.udemy.com/" }]
            },
            {
                "name": "Advanced " + domain + " Applications",
                "description": "Expert-level applications and implementation in " + domain,
                "priority": "medium",
                "level": "advanced",
                "estimatedLearningTime": "6-8 weeks",
                "resources": [{ ...baseResource, difficulty: "advanced", url: "https://www.edx.org/" }]
            }
        ];
        
        // Domain-specific skills could be added here
        switch(normalizedDomain) {
            case "frontend":
            case "frontend developer":
            case "web":
            case "web development":
                return [
                    {
                        "name": "HTML/CSS",
                        "description": "Foundational web technologies for structure and styling",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "2-3 weeks",
                        "resources": [{ ...baseResource, url: "https://www.w3schools.com/html/" }]
                    },
                    {
                        "name": "JavaScript",
                        "description": "Programming language for interactive web applications",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "4-6 weeks",
                        "resources": [{ ...baseResource, url: "https://javascript.info/" }]
                    },
                    {
                        "name": "React/Vue/Angular",
                        "description": "Modern frontend frameworks for building user interfaces",
                        "priority": "medium",
                        "level": "intermediate",
                        "estimatedLearningTime": "6-8 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://reactjs.org/" }]
                    },
                    {
                        "name": "Responsive Design",
                        "description": "Creating websites that work on all devices",
                        "priority": "medium",
                        "level": "intermediate",
                        "estimatedLearningTime": "3-4 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design" }]
                    }
                ];
            case "backend":
            case "backend developer":
                return [
                    {
                        "name": "Node.js",
                        "description": "JavaScript runtime for server-side development",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "4-6 weeks",
                        "resources": [{ ...baseResource, url: "https://nodejs.org/en/learn/" }]
                    },
                    {
                        "name": "Database Management",
                        "description": "Working with SQL and NoSQL databases",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "5-7 weeks",
                        "resources": [{ ...baseResource, url: "https://www.mongodb.com/developer/" }]
                    },
                    {
                        "name": "API Development",
                        "description": "Creating RESTful APIs and web services",
                        "priority": "medium",
                        "level": "intermediate",
                        "estimatedLearningTime": "4-5 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://expressjs.com/" }]
                    },
                    {
                        "name": "Authentication & Security",
                        "description": "Implementing secure user authentication systems",
                        "priority": "medium",
                        "level": "intermediate",
                        "estimatedLearningTime": "3-4 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://auth0.com/docs" }]
                    }
                ];
            case "fullstack":
            case "fullstack developer":
                return [
                    {
                        "name": "Frontend Technologies",
                        "description": "HTML, CSS, JavaScript, and modern frameworks",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "8-10 weeks",
                        "resources": [{ ...baseResource, url: "https://www.freecodecamp.org/learn/front-end-development-libraries/" }]
                    },
                    {
                        "name": "Backend Development",
                        "description": "Server-side programming and database management",
                        "priority": "high",
                        "level": "intermediate",
                        "estimatedLearningTime": "8-10 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://nodejs.org/" }]
                    },
                    {
                        "name": "DevOps & Deployment",
                        "description": "Cloud deployment and CI/CD practices",
                        "priority": "medium",
                        "level": "advanced",
                        "estimatedLearningTime": "6-8 weeks",
                        "resources": [{ ...baseResource, difficulty: "advanced", url: "https://aws.amazon.com/getting-started/" }]
                    }
                ];
            case "security":
            case "ethical hacker":
            case "cybersecurity":
                return [
                    {
                        "name": "Network Security Fundamentals",
                        "description": "Understanding network protocols and security principles",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "4-6 weeks",
                        "resources": [{ ...baseResource, url: "https://www.cybrary.it/course/comptia-network-plus/" }]
                    },
                    {
                        "name": "Penetration Testing",
                        "description": "Ethical hacking techniques and vulnerability assessment",
                        "priority": "high",
                        "level": "intermediate",
                        "estimatedLearningTime": "8-12 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://tryhackme.com/" }]
                    },
                    {
                        "name": "Security Tools & Frameworks",
                        "description": "Using tools like Metasploit, Burp Suite, and Nmap",
                        "priority": "medium",
                        "level": "intermediate",
                        "estimatedLearningTime": "6-8 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://www.hackthebox.com/" }]
                    },
                    {
                        "name": "Incident Response",
                        "description": "Handling security breaches and forensic analysis",
                        "priority": "medium",
                        "level": "advanced",
                        "estimatedLearningTime": "8-10 weeks",
                        "resources": [{ ...baseResource, difficulty: "advanced", url: "https://www.sans.org/courses/" }]
                    }
                ];
            case "ml":
            case "machine learning":
            case "machine learning engineer":
                return [
                    {
                        "name": "Python Programming",
                        "description": "Foundational programming for data analysis and ML",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "4-6 weeks",
                        "resources": [{ ...baseResource, url: "https://www.python.org/about/gettingstarted/" }]
                    },
                    {
                        "name": "Data Analysis Libraries",
                        "description": "Pandas, NumPy, and Matplotlib for data manipulation",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "3-4 weeks",
                        "resources": [{ ...baseResource, url: "https://pandas.pydata.org/docs/getting_started/index.html" }]
                    },
                    {
                        "name": "Machine Learning Algorithms",
                        "description": "Understanding and implementing ML algorithms",
                        "priority": "medium",
                        "level": "intermediate",
                        "estimatedLearningTime": "8-10 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://scikit-learn.org/stable/getting_started.html" }]
                    },
                    {
                        "name": "Deep Learning",
                        "description": "Neural networks with TensorFlow and PyTorch",
                        "priority": "low",
                        "level": "advanced",
                        "estimatedLearningTime": "10-12 weeks",
                        "resources": [{ ...baseResource, difficulty: "advanced", url: "https://www.tensorflow.org/learn" }]
                    }
                ];
            case "data science":
                return [
                    {
                        "name": "Python Programming",
                        "description": "Foundational programming for data analysis",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "4-6 weeks",
                        "resources": [{ ...baseResource, url: "https://www.python.org/about/gettingstarted/" }]
                    },
                    {
                        "name": "Data Analysis Libraries",
                        "description": "Pandas, NumPy for data manipulation",
                        "priority": "high",
                        "level": "beginner",
                        "estimatedLearningTime": "3-4 weeks",
                        "resources": [{ ...baseResource, url: "https://pandas.pydata.org/docs/getting_started/index.html" }]
                    },
                    {
                        "name": "Data Visualization",
                        "description": "Creating visual representations with Matplotlib, Seaborn",
                        "priority": "medium",
                        "level": "intermediate",
                        "estimatedLearningTime": "2-3 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://matplotlib.org/stable/tutorials/index.html" }]
                    },
                    {
                        "name": "Machine Learning Fundamentals",
                        "description": "Basic ML algorithms and principles",
                        "priority": "medium",
                        "level": "intermediate",
                        "estimatedLearningTime": "6-8 weeks",
                        "resources": [{ ...baseResource, difficulty: "intermediate", url: "https://scikit-learn.org/stable/getting_started.html" }]
                    },
                    {
                        "name": "Deep Learning",
                        "description": "Neural networks and advanced ML techniques",
                        "priority": "low",
                        "level": "advanced",
                        "estimatedLearningTime": "8-10 weeks",
                        "resources": [{ ...baseResource, difficulty: "advanced", url: "https://www.tensorflow.org/learn" }]
                    }
                ];
            // Add more domains as needed
            default:
                return defaultSkills;
        }
    }

    async generateDailyLearningPlan({ domain, skills, level, duration, userId }) {
        try {
            const prompt = `
Create a detailed ${duration}-day learning plan for ${domain} development at ${level} level.

Selected Skills: ${skills.join(', ')}

Requirements:
1. Create exactly ${duration} days of structured learning
2. Each day should have 2-4 specific, actionable tasks
3. Tasks should build progressively toward mastery
4. Include practical projects and hands-on activities
5. Provide estimated time for each task
6. Include relevant learning resources with actual URLs when possible

Return a JSON object with this exact structure:
{
    "totalDuration": ${duration},
    "level": "${level}",
    "domain": "${domain}",
    "skills": ${JSON.stringify(skills)},
    "dailyTasks": [
        {
            "day": 1,
            "focus": "Day focus/theme",
            "description": "What the learner will achieve this day",
            "tasks": [
                {
                    "title": "Specific task title",
                    "description": "Detailed task description with clear objectives",
                    "estimatedTime": "1-2 hours",
                    "resources": [
                        {
                            "title": "Resource name",
                            "url": "https://actual-working-url.com",
                            "type": "tutorial/documentation/video/course"
                        }
                    ],
                    "deliverable": "What the learner should produce/complete"
                }
            ]
        }
    ]
}

Make the plan practical, realistic, and focused on ${level}-level learning.
Include real, working URLs for popular learning resources.
Ensure tasks are specific and measurable.
`;

            const result = await ai.models.generateContent({
                model: this.model,
                contents: prompt,
                config: this.config
            });
            const response = await result.response;
            let text = response.text;

            // Clean up the response to ensure it's valid JSON
            text = text.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();

            // Validate JSON structure
            const parsed = JSON.parse(text);
            if (!parsed.dailyTasks || !Array.isArray(parsed.dailyTasks)) {
                throw new Error('Invalid response format: missing dailyTasks array');
            }

            return text;
        } catch (error) {
            console.error('Error generating daily learning plan:', error);
            
            // Fallback to a basic plan structure
            const fallbackPlan = {
                totalDuration: duration,
                level: level,
                domain: domain,
                skills: skills,
                dailyTasks: this.generateFallbackDailyTasks(domain, skills, level, duration)
            };

            return JSON.stringify(fallbackPlan);
        }
    }

    generateFallbackDailyTasks(domain, skills, level, duration) {
        const basicTasks = [];
        const tasksPerWeek = 7;
        const weeksNeeded = Math.ceil(duration / tasksPerWeek);

        for (let day = 1; day <= duration; day++) {
            const weekNumber = Math.ceil(day / tasksPerWeek);
            const dayInWeek = ((day - 1) % tasksPerWeek) + 1;
            
            const skill = skills[Math.floor((day - 1) / (duration / skills.length))] || skills[0];
            
            basicTasks.push({
                day: day,
                focus: `${skill} - Week ${weekNumber}`,
                description: `Focus on ${skill} fundamentals and practical application`,
                tasks: [
                    {
                        title: `Learn ${skill} Basics`,
                        description: `Study the fundamental concepts of ${skill} for ${level} level`,
                        estimatedTime: "2-3 hours",
                        resources: [
                            {
                                title: `${skill} Documentation`,
                                url: `https://developer.mozilla.org/en-US/`,
                                type: "documentation"
                            }
                        ],
                        deliverable: `Complete ${skill} exercises`
                    },
                    {
                        title: `Practice ${skill} Implementation`,
                        description: `Build a small project using ${skill}`,
                        estimatedTime: "1-2 hours",
                        resources: [
                            {
                                title: "Practice Platform",
                                url: "https://codepen.io/",
                                type: "practice"
                            }
                        ],
                        deliverable: `Working ${skill} example`
                    }
                ]
            });
        }

        return basicTasks;
    }

    // Add this method for generating general content
    async generateContent(prompt) {
        try {
            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt,
                config: this.config
            });

            if (!response || !response.text) {
                throw new Error('No response from AI service');
            }

            return response.text;
        } catch (error) {
            console.error('Error generating content:', error);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }
}

export default new AIService();
