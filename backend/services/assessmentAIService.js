// Assessment AI Service - Generates personalized quizzes and analyzes results
import { GoogleGenerativeAI } from '@google/generative-ai';

class AssessmentAIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateAssessment(userId, skillLevel, domain) {
    try {
      const prompt = `
        Generate a comprehensive skill assessment quiz for a ${skillLevel} level learner in ${domain}.
        
        Requirements:
        - Create 10 multiple-choice questions
        - Mix of Easy (4 questions), Medium (4 questions), and Hard (2 questions)
        - Each question should have 4 options with only one correct answer
        - Include detailed explanations for each correct answer
        - Assign points: Easy (10 pts), Medium (15 pts), Hard (20 pts)
        - Total time limit: 30 minutes
        - Passing score: 70%
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "assessment": {
            "id": "assessment-${Date.now()}",
            "title": "Skill Assessment Title",
            "description": "Brief description",
            "difficulty": "${skillLevel}",
            "totalQuestions": 10,
            "timeLimit": 30,
            "passingScore": 70
          },
          "questions": [
            {
              "id": 1,
              "question": "Question text?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Detailed explanation",
              "difficulty": "Easy",
              "points": 10
            }
          ],
          "timeLimit": 1800
        }
        
        Focus on practical, real-world ${domain} concepts that test understanding rather than memorization.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean and parse the JSON response
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const assessmentData = JSON.parse(cleanedText);
      
      return assessmentData;
    } catch (error) {
      console.error('Error generating assessment:', error);
      return this.getFallbackAssessment(domain, skillLevel);
    }
  }

  async analyzeAssessmentResults(userId, assessmentId, questions, answers, timeSpent) {
    try {
      // Calculate basic scores
      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;
      
      const detailedResults = questions.map((question, index) => {
        const userAnswer = parseInt(answers[index]);
        const isCorrect = userAnswer === question.correctAnswer;
        const points = isCorrect ? question.points : 0;
        
        if (isCorrect) correctCount++;
        totalPoints += question.points;
        earnedPoints += points;
        
        return {
          questionId: question.id,
          question: question.question,
          userAnswer: userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect: isCorrect,
          explanation: question.explanation,
          points: points,
          maxPoints: question.points,
          difficulty: question.difficulty
        };
      });

      const percentage = Math.round((earnedPoints / totalPoints) * 100);
      const grade = this.getGrade(percentage);

      // Generate AI analysis
      const prompt = `
        Analyze this assessment performance and provide personalized insights:
        
        Performance Data:
        - Score: ${earnedPoints}/${totalPoints} points (${percentage}%)
        - Correct Answers: ${correctCount}/${questions.length}
        - Time Spent: ${timeSpent} minutes
        - Grade: ${grade}
        
        Question Analysis:
        ${detailedResults.map(r => `
        - ${r.difficulty} Question: ${r.isCorrect ? 'Correct' : 'Incorrect'} (${r.points}/${r.maxPoints} pts)
        `).join('')}
        
        Provide a comprehensive analysis in this JSON format:
        {
          "aiAnalysis": {
            "overallPerformance": "Excellent|Good|Fair|Needs Improvement",
            "keyInsights": [
              "2-3 personalized insights about performance",
              "Specific observations about strengths and weaknesses"
            ],
            "strengths": [
              "List 2-3 key strengths demonstrated"
            ],
            "weaknesses": [
              "List 2-3 areas needing improvement"
            ],
            "learningPattern": "Description of learning pattern observed",
            "timeManagement": "Assessment of time usage efficiency"
          },
          "recommendations": [
            "3-5 specific, actionable recommendations for improvement",
            "Tailored study suggestions based on weak areas",
            "Next steps for continued learning"
          ],
          "nextLevelReadiness": {
            "ready": true/false,
            "reasoning": "Explanation of readiness for next level",
            "prerequisiteAreas": ["Areas to master before advancing"]
          }
        }
        
        Be encouraging but honest. Focus on growth and improvement opportunities.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const aiAnalysisData = JSON.parse(cleanedText);
      
      return {
        score: earnedPoints,
        totalScore: totalPoints,
        percentage: percentage,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        grade: grade,
        timeSpent: Math.round(timeSpent),
        passed: percentage >= 70,
        detailedResults: detailedResults,
        ...aiAnalysisData
      };
    } catch (error) {
      console.error('Error analyzing assessment:', error);
      return this.getFallbackAnalysis(correctCount, questions.length, earnedPoints, totalPoints, timeSpent);
    }
  }

  getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D+';
    if (percentage >= 55) return 'D';
    return 'F';
  }

  getFallbackAssessment(domain, skillLevel) {
    return {
      assessment: {
        id: 'assessment-' + Date.now(),
        title: `${domain} Fundamentals Assessment`,
        description: `Test your knowledge of ${domain} basics and core concepts.`,
        difficulty: skillLevel,
        totalQuestions: 10,
        timeLimit: 30,
        passingScore: 70
      },
      questions: [
        {
          id: 1,
          question: "What is the fundamental concept that defines modern software development?",
          options: [
            "Writing code quickly",
            "Problem-solving and logical thinking",
            "Using the latest frameworks",
            "Memorizing syntax"
          ],
          correctAnswer: 1,
          explanation: "Software development is fundamentally about problem-solving and breaking down complex problems into manageable solutions.",
          difficulty: "Easy",
          points: 10
        },
        {
          id: 2,
          question: "Which practice is most important for maintaining code quality?",
          options: [
            "Writing comments for every line",
            "Using the shortest variable names",
            "Following consistent coding standards",
            "Avoiding functions and modules"
          ],
          correctAnswer: 2,
          explanation: "Consistent coding standards make code readable, maintainable, and easier for teams to collaborate on.",
          difficulty: "Easy",
          points: 10
        },
        {
          id: 3,
          question: "What is the purpose of version control systems?",
          options: [
            "To make code run faster",
            "To track changes and collaborate on code",
            "To automatically fix bugs",
            "To compress file sizes"
          ],
          correctAnswer: 1,
          explanation: "Version control systems like Git help track changes, maintain history, and enable collaboration among developers.",
          difficulty: "Easy",
          points: 10
        },
        {
          id: 4,
          question: "Which approach leads to better software design?",
          options: [
            "Writing all code in one large function",
            "Breaking problems into smaller, manageable pieces",
            "Avoiding planning and documentation",
            "Using only global variables"
          ],
          correctAnswer: 1,
          explanation: "Modular design and breaking problems into smaller pieces leads to more maintainable and scalable software.",
          difficulty: "Medium",
          points: 15
        },
        {
          id: 5,
          question: "What is the most effective way to debug code?",
          options: [
            "Random trial and error",
            "Systematic investigation and testing",
            "Rewriting everything from scratch",
            "Ignoring the problem"
          ],
          correctAnswer: 1,
          explanation: "Systematic debugging involves understanding the problem, forming hypotheses, and testing them methodically.",
          difficulty: "Medium",
          points: 15
        },
        {
          id: 6,
          question: "Why is testing important in software development?",
          options: [
            "It slows down development",
            "It ensures code works as expected and prevents regressions",
            "It's only needed for large applications",
            "It replaces the need for documentation"
          ],
          correctAnswer: 1,
          explanation: "Testing helps ensure code reliability, catches bugs early, and provides confidence when making changes.",
          difficulty: "Medium",
          points: 15
        },
        {
          id: 7,
          question: "What characterizes clean, professional code?",
          options: [
            "As few lines as possible",
            "Readable, well-organized, and self-documenting",
            "Uses advanced features exclusively",
            "Has no comments or documentation"
          ],
          correctAnswer: 1,
          explanation: "Clean code is readable, well-organized, follows conventions, and can be easily understood by other developers.",
          difficulty: "Medium",
          points: 15
        },
        {
          id: 8,
          question: "How should you approach learning new technologies?",
          options: [
            "Learn everything at once",
            "Focus on fundamentals first, then build complexity",
            "Only read documentation without practice",
            "Copy code without understanding"
          ],
          correctAnswer: 1,
          explanation: "Building a strong foundation in fundamentals provides the framework for understanding more complex concepts.",
          difficulty: "Hard",
          points: 20
        },
        {
          id: 9,
          question: "What is the key to becoming a proficient developer?",
          options: [
            "Memorizing all possible syntax",
            "Consistent practice and continuous learning",
            "Using only the newest technologies",
            "Working in isolation"
          ],
          correctAnswer: 1,
          explanation: "Regular practice, continuous learning, and staying curious about new developments are essential for growth.",
          difficulty: "Hard",
          points: 20
        },
        {
          id: 10,
          question: "How do successful developers approach complex problems?",
          options: [
            "Try to solve everything immediately",
            "Break down problems, research, and iterate on solutions",
            "Avoid challenging problems",
            "Use only familiar approaches"
          ],
          correctAnswer: 1,
          explanation: "Successful problem-solving involves analysis, research, breaking down complexity, and iterative improvement.",
          difficulty: "Hard",
          points: 20
        }
      ],
      timeLimit: 1800
    };
  }

  getFallbackAnalysis(correctCount, totalQuestions, earnedPoints, totalPoints, timeSpent) {
    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const grade = this.getGrade(percentage);
    
    return {
      score: earnedPoints,
      totalScore: totalPoints,
      percentage: percentage,
      correctAnswers: correctCount,
      totalQuestions: totalQuestions,
      grade: grade,
      timeSpent: Math.round(timeSpent),
      passed: percentage >= 70,
      aiAnalysis: {
        overallPerformance: percentage >= 80 ? 'Excellent' : percentage >= 70 ? 'Good' : percentage >= 60 ? 'Fair' : 'Needs Improvement',
        keyInsights: [
          `You answered ${correctCount} out of ${totalQuestions} questions correctly (${percentage}%).`,
          percentage >= 70 ? 'You demonstrated solid understanding of the core concepts.' : 'Focus on strengthening fundamental concepts before advancing.',
          `Time management: ${timeSpent < 20 ? 'Efficient' : timeSpent < 25 ? 'Good' : 'Could be improved'} - completed in ${timeSpent} minutes.`
        ],
        strengths: percentage >= 70 ? ['Good grasp of fundamental concepts', 'Solid problem-solving approach'] : ['Willingness to learn', 'Taking assessment shows commitment'],
        weaknesses: percentage < 70 ? ['Core concepts need reinforcement', 'More practice needed'] : ['Minor gaps in advanced topics'],
        learningPattern: 'Shows consistent effort in learning and assessment completion',
        timeManagement: timeSpent < 25 ? 'Efficient time usage' : 'Could benefit from improved time management'
      },
      recommendations: percentage >= 80 ? 
        ['Advance to more complex topics', 'Consider practical projects', 'Share knowledge with others'] :
        percentage >= 70 ?
        ['Review missed concepts', 'Practice with similar problems', 'Focus on weak areas'] :
        ['Start with fundamental concepts', 'Take more practice quizzes', 'Seek additional learning resources'],
      nextLevelReadiness: {
        ready: percentage >= 80,
        reasoning: percentage >= 80 ? 'Strong performance indicates readiness for advanced topics' : 'Focus on mastering current level before advancing',
        prerequisiteAreas: percentage < 80 ? ['Core fundamentals', 'Problem-solving skills'] : []
      }
    };
  }

  async generateDailyAssessment(userId, previousResults = []) {
    try {
      const prompt = `
        Generate a quick daily assessment (5 questions) based on learning progress.
        
        Previous Results Analysis:
        ${previousResults.map(r => `Date: ${r.date}, Score: ${r.percentage}%, Weak Areas: ${r.weakAreas?.join(', ') || 'N/A'}`).join('\n')}
        
        Create questions that:
        1. Reinforce weak areas from previous assessments
        2. Introduce new concepts gradually
        3. Mix of review and new material
        4. 10-minute time limit
        5. Focus on practical application
        
        Return JSON format with 5 questions, similar structure as full assessment.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error generating daily assessment:', error);
      return this.getDailyFallbackAssessment();
    }
  }

  getDailyFallbackAssessment() {
    return {
      assessment: {
        id: 'daily-assessment-' + Date.now(),
        title: 'Daily Knowledge Check',
        description: 'Quick review of key concepts',
        difficulty: 'Mixed',
        totalQuestions: 5,
        timeLimit: 10,
        passingScore: 60
      },
      questions: [
        {
          id: 1,
          question: "What is the most important principle in software development?",
          options: ["Speed", "Clarity and maintainability", "Using latest tech", "Minimal code"],
          correctAnswer: 1,
          explanation: "Clear, maintainable code is essential for long-term success.",
          difficulty: "Easy",
          points: 10
        },
        {
          id: 2,
          question: "How do you approach a new programming problem?",
          options: ["Start coding immediately", "Understand the problem first", "Copy existing solutions", "Use trial and error"],
          correctAnswer: 1,
          explanation: "Understanding the problem thoroughly is the first step to an effective solution.",
          difficulty: "Easy",
          points: 10
        },
        {
          id: 3,
          question: "What makes code 'clean'?",
          options: ["Short variable names", "No comments", "Self-explanatory and well-organized", "Complex algorithms"],
          correctAnswer: 2,
          explanation: "Clean code is readable, well-organized, and self-explanatory.",
          difficulty: "Medium",
          points: 15
        },
        {
          id: 4,
          question: "Why is continuous learning important for developers?",
          options: ["Technology constantly evolves", "It's a requirement", "To show off knowledge", "To avoid work"],
          correctAnswer: 0,
          explanation: "Technology evolves rapidly, making continuous learning essential for staying relevant.",
          difficulty: "Medium",
          points: 15
        },
        {
          id: 5,
          question: "What's the best way to handle complex problems?",
          options: ["Solve everything at once", "Break into smaller parts", "Avoid them", "Use random approaches"],
          correctAnswer: 1,
          explanation: "Breaking complex problems into smaller, manageable parts is a fundamental problem-solving strategy.",
          difficulty: "Hard",
          points: 20
        }
      ],
      timeLimit: 600
    };
  }
}

export default AssessmentAIService;
