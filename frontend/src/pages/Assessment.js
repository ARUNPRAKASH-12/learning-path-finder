import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Assessment.css';

const Assessment = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    generateAssessment();
    fetchAssessmentHistory();
  }, []);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmitAssessment();
    }
  }, [timeRemaining]);

  const generateAssessment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/assessment/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user?.id || 'demo-user',
          skillLevel: 'intermediate', // This could be dynamic based on user's current progress
          domain: 'javascript' // This could be dynamic based on user's current learning path
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentAssessment(data.assessment);
        setQuestions(data.questions);
        setTimeRemaining(data.timeLimit || 1800); // 30 minutes default
      } else {
        // Fallback assessment data
        console.log('Using fallback assessment data');
        setCurrentAssessment(getFallbackAssessment());
        setQuestions(getFallbackQuestions());
        setTimeRemaining(1800);
      }
    } catch (error) {
      console.error('Error generating assessment:', error);
      console.log('Using fallback assessment data due to error');
      setCurrentAssessment(getFallbackAssessment());
      setQuestions(getFallbackQuestions());
      setTimeRemaining(1800);
    }
    setIsLoading(false);
  };

  const getFallbackAssessment = () => ({
    id: 'assessment-' + Date.now(),
    title: 'JavaScript Fundamentals Assessment',
    description: 'Test your knowledge of JavaScript basics including variables, functions, arrays, and objects.',
    difficulty: 'Intermediate',
    totalQuestions: 10,
    timeLimit: 30,
    passingScore: 70
  });

  const getFallbackQuestions = () => [
    {
      id: 1,
      question: "What is the correct way to declare a variable in JavaScript?",
      options: [
        "var myVariable = 'value';",
        "variable myVariable = 'value';",
        "v myVariable = 'value';",
        "declare myVariable = 'value';"
      ],
      correctAnswer: 0,
      explanation: "The 'var' keyword is used to declare variables in JavaScript. You can also use 'let' or 'const' in modern JavaScript.",
      difficulty: "Easy",
      points: 10
    },
    {
      id: 2,
      question: "Which method is used to add an element to the end of an array?",
      options: [
        "array.add()",
        "array.push()",
        "array.append()",
        "array.insert()"
      ],
      correctAnswer: 1,
      explanation: "The push() method adds one or more elements to the end of an array and returns the new length of the array.",
      difficulty: "Easy",
      points: 10
    },
    {
      id: 3,
      question: "What will be the output of: console.log(typeof null)?",
      options: [
        "'null'",
        "'undefined'",
        "'object'",
        "'boolean'"
      ],
      correctAnswer: 2,
      explanation: "This is a well-known quirk in JavaScript. The typeof operator returns 'object' for null, which is considered a bug but remains for backward compatibility.",
      difficulty: "Medium",
      points: 15
    },
    {
      id: 4,
      question: "Which of the following is NOT a JavaScript data type?",
      options: [
        "string",
        "number",
        "float",
        "boolean"
      ],
      correctAnswer: 2,
      explanation: "JavaScript doesn't have a separate 'float' data type. All numbers in JavaScript are represented as floating-point numbers internally.",
      difficulty: "Medium",
      points: 15
    },
    {
      id: 5,
      question: "What is the purpose of the 'this' keyword in JavaScript?",
      options: [
        "It refers to the current function",
        "It refers to the current object",
        "It refers to the parent object",
        "It refers to the global object"
      ],
      correctAnswer: 1,
      explanation: "The 'this' keyword refers to the object that the function is a property of, or the object that is calling the function.",
      difficulty: "Medium",
      points: 15
    },
    {
      id: 6,
      question: "How do you create a function in JavaScript?",
      options: [
        "function = myFunction() {}",
        "create myFunction() {}",
        "function myFunction() {}",
        "def myFunction() {}"
      ],
      correctAnswer: 2,
      explanation: "Functions in JavaScript are declared using the 'function' keyword followed by the function name and parentheses.",
      difficulty: "Easy",
      points: 10
    },
    {
      id: 7,
      question: "What is the difference between '==' and '===' in JavaScript?",
      options: [
        "No difference",
        "'==' compares values, '===' compares types",
        "'==' compares values with type coercion, '===' compares values and types",
        "'==' is faster than '==='"
      ],
      correctAnswer: 2,
      explanation: "'==' performs type coercion and then compares values, while '===' compares both value and type without coercion.",
      difficulty: "Medium",
      points: 15
    },
    {
      id: 8,
      question: "Which method is used to remove the last element from an array?",
      options: [
        "array.remove()",
        "array.pop()",
        "array.delete()",
        "array.removeLast()"
      ],
      correctAnswer: 1,
      explanation: "The pop() method removes the last element from an array and returns that element.",
      difficulty: "Easy",
      points: 10
    },
    {
      id: 9,
      question: "What is a closure in JavaScript?",
      options: [
        "A way to close a program",
        "A function that has access to variables in its outer scope",
        "A method to end a loop",
        "A way to hide code"
      ],
      correctAnswer: 1,
      explanation: "A closure is a function that has access to variables in its outer (enclosing) lexical scope even after the outer function has returned.",
      difficulty: "Hard",
      points: 20
    },
    {
      id: 10,
      question: "Which of the following is the correct way to handle asynchronous operations in modern JavaScript?",
      options: [
        "Callbacks only",
        "Promises and async/await",
        "setTimeout only",
        "Synchronous code only"
      ],
      correctAnswer: 1,
      explanation: "Modern JavaScript uses Promises and async/await syntax to handle asynchronous operations in a more readable and maintainable way.",
      difficulty: "Hard",
      points: 20
    }
  ];

  const fetchAssessmentHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/assessment/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssessmentHistory(data.history || []);
      } else {
        // Fallback history data
        console.log('Using fallback history data');
        setAssessmentHistory(getFallbackHistory());
      }
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      console.log('Using fallback history data due to error');
      setAssessmentHistory(getFallbackHistory());
    }
  };

  const getFallbackHistory = () => [
    {
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: 85,
      percentage: 85,
      totalQuestions: 10,
      correctAnswers: 8.5,
      timeSpent: 25,
      difficulty: 'Intermediate',
      subject: 'JavaScript Basics'
    },
    {
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: 72,
      percentage: 72,
      totalQuestions: 10,
      correctAnswers: 7.2,
      timeSpent: 28,
      difficulty: 'Intermediate',
      subject: 'JavaScript Functions'
    },
    {
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: 68,
      percentage: 68,
      totalQuestions: 10,
      correctAnswers: 6.8,
      timeSpent: 30,
      difficulty: 'Beginner',
      subject: 'HTML & CSS'
    }
  ];

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      setAnswers({
        ...answers,
        [currentQuestionIndex]: selectedAnswer
      });
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      } else {
        handleSubmitAssessment();
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] !== undefined ? answers[currentQuestionIndex - 1] : null);
    }
  };

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    
    // Include current answer if not already saved
    const finalAnswers = selectedAnswer !== null ? {
      ...answers,
      [currentQuestionIndex]: selectedAnswer
    } : answers;

    try {
      const response = await fetch('http://localhost:5000/api/assessment/analyze-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user?.id || 'demo-user',
          assessmentId: currentAssessment?.id,
          questions: questions,
          answers: finalAnswers,
          timeSpent: (1800 - timeRemaining) / 60 // time in minutes
        })
      });

      if (response.ok) {
        const results = await response.json();
        setAssessmentResults(results);
      } else {
        // Generate fallback results
        const results = generateFallbackResults(finalAnswers);
        setAssessmentResults(results);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      const results = generateFallbackResults(finalAnswers);
      setAssessmentResults(results);
    }
    
    setIsSubmitting(false);
    setShowResults(true);
  };

  const generateFallbackResults = (userAnswers) => {
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    
    const detailedResults = questions.map((question, index) => {
      const userAnswer = parseInt(userAnswers[index]);
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
        maxPoints: question.points
      };
    });

    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const grade = getGrade(percentage);
    
    return {
      score: earnedPoints,
      totalScore: totalPoints,
      percentage: percentage,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      grade: grade,
      timeSpent: Math.round((1800 - timeRemaining) / 60),
      passed: percentage >= (currentAssessment?.passingScore || 70),
      detailedResults: detailedResults,
      aiAnalysis: generateAIAnalysis(percentage, correctCount, questions.length),
      recommendations: generateRecommendations(percentage, detailedResults)
    };
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D+';
    if (percentage >= 55) return 'D';
    return 'F';
  };

  const generateAIAnalysis = (percentage, correct, total) => {
    const insights = [];
    
    if (percentage >= 90) {
      insights.push("🎉 Outstanding performance! You have mastered the fundamentals exceptionally well.");
      insights.push("💡 Consider advancing to more complex topics and challenging yourself with advanced concepts.");
    } else if (percentage >= 80) {
      insights.push("✅ Excellent work! You have a solid understanding of the core concepts.");
      insights.push("🎯 Focus on refining your knowledge in areas where you made mistakes to achieve mastery.");
    } else if (percentage >= 70) {
      insights.push("👍 Good job! You're on the right track with a decent grasp of the basics.");
      insights.push("📚 Review the concepts you struggled with and practice more exercises in those areas.");
    } else if (percentage >= 60) {
      insights.push("⚠️ You're making progress, but there's room for improvement in foundational concepts.");
      insights.push("🔄 Consider reviewing the basic materials and practicing more before advancing.");
    } else {
      insights.push("🎯 This assessment shows areas that need focused attention and practice.");
      insights.push("📖 I recommend starting with fundamental concepts and building your knowledge step by step.");
    }

    return {
      overallPerformance: percentage >= 80 ? 'Excellent' : percentage >= 70 ? 'Good' : percentage >= 60 ? 'Fair' : 'Needs Improvement',
      keyInsights: insights,
      strengths: generateStrengths(percentage),
      weaknesses: generateWeaknesses(percentage)
    };
  };

  const generateStrengths = (percentage) => {
    if (percentage >= 80) {
      return ["Strong conceptual understanding", "Good problem-solving skills", "Attention to detail"];
    } else if (percentage >= 60) {
      return ["Basic concept recognition", "Willingness to learn", "Making steady progress"];
    } else {
      return ["Starting the learning journey", "Identifying areas for growth"];
    }
  };

  const generateWeaknesses = (percentage) => {
    if (percentage >= 80) {
      return ["Minor gaps in advanced concepts", "Could benefit from more practice"];
    } else if (percentage >= 60) {
      return ["Some fundamental concepts need reinforcement", "Practice with complex scenarios"];
    } else {
      return ["Core concepts need significant review", "More practice with basic principles required"];
    }
  };

  const generateRecommendations = (percentage, detailedResults) => {
    const recommendations = [];
    
    if (percentage >= 90) {
      recommendations.push("🚀 Ready for advanced topics! Consider exploring frameworks and advanced patterns.");
      recommendations.push("🎓 Look into certification programs or advanced courses in your field.");
    } else if (percentage >= 80) {
      recommendations.push("📈 Focus on the 1-2 topics you missed to achieve mastery level.");
      recommendations.push("🛠️ Start working on practical projects to apply your knowledge.");
    } else if (percentage >= 70) {
      recommendations.push("📚 Review fundamental concepts, especially in areas with incorrect answers.");
      recommendations.push("💻 Practice coding exercises daily to strengthen your skills.");
    } else {
      recommendations.push("🎯 Start with basic tutorials and interactive learning resources.");
      recommendations.push("👥 Consider joining study groups or finding a mentor for guidance.");
      recommendations.push("⏰ Dedicate consistent daily time to studying and practicing.");
    }

    return recommendations;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const restartAssessment = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setAssessmentResults(null);
    setShowResults(false);
    generateAssessment();
  };

  if (isLoading) {
    return (
      <div className="assessment-loading">
        <div className="loading-spinner"></div>
        <h2>🤖 AI is generating your personalized assessment...</h2>
        <p>Analyzing your learning progress and creating tailored questions</p>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="assessment-container">
        <div className="assessment-content">
          <div className="results-header">
            <button className="back-button" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <h1>📊 Assessment Results</h1>
          </div>

          <div className="results-summary">
            <div className="score-card">
              <div className="score-circle">
                <div className="score-percentage">{assessmentResults?.percentage}%</div>
                <div className="score-grade">{assessmentResults?.grade}</div>
              </div>
              <div className="score-details">
                <h3>{assessmentResults?.passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}</h3>
                <p>
                  {assessmentResults?.correctAnswers} out of {assessmentResults?.totalQuestions} correct
                </p>
                <p>Time spent: {assessmentResults?.timeSpent} minutes</p>
                <p>Points earned: {assessmentResults?.score}/{assessmentResults?.totalScore}</p>
              </div>
            </div>

            <div className="ai-analysis">
              <h3>🤖 AI Analysis</h3>
              <div className="analysis-content">
                <div className="performance-badge">
                  Overall Performance: <span>{assessmentResults?.aiAnalysis?.overallPerformance}</span>
                </div>
                
                <div className="insights">
                  {assessmentResults?.aiAnalysis?.keyInsights?.map((insight, index) => (
                    <div key={index} className="insight-item">{insight}</div>
                  ))}
                </div>

                <div className="strengths-weaknesses">
                  <div className="strengths">
                    <h4>💪 Strengths</h4>
                    <ul>
                      {assessmentResults?.aiAnalysis?.strengths?.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="weaknesses">
                    <h4>🎯 Areas for Improvement</h4>
                    <ul>
                      {assessmentResults?.aiAnalysis?.weaknesses?.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="recommendations">
            <h3>📈 Personalized Recommendations</h3>
            <div className="recommendation-list">
              {assessmentResults?.recommendations?.map((recommendation, index) => (
                <div key={index} className="recommendation-item">{recommendation}</div>
              ))}
            </div>
          </div>

          <div className="detailed-results">
            <h3>📝 Question Review</h3>
            <div className="questions-review">
              {assessmentResults?.detailedResults?.map((result, index) => (
                <div key={index} className={`question-result ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="question-header">
                    <span className="question-number">Q{index + 1}</span>
                    <span className={`result-icon ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                      {result.isCorrect ? '✅' : '❌'}
                    </span>
                    <span className="points">{result.points}/{result.maxPoints} pts</span>
                  </div>
                  <div className="question-text">{result.question}</div>
                  <div className="answer-explanation">
                    <p><strong>Your answer:</strong> {questions[index]?.options[result.userAnswer] || 'No answer'}</p>
                    <p><strong>Correct answer:</strong> {questions[index]?.options[result.correctAnswer]}</p>
                    <p><strong>Explanation:</strong> {result.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="history-section">
            <h3>📈 Assessment History</h3>
            <div className="history-grid">
              {assessmentHistory.map((assessment, index) => (
                <div key={index} className="history-card">
                  <div className="history-date">{assessment.date}</div>
                  <div className="history-score">{assessment.percentage}%</div>
                  <div className="history-details">
                    <p>{assessment.subject}</p>
                    <p>{assessment.correctAnswers}/{assessment.totalQuestions} correct</p>
                    <p>{assessment.timeSpent} minutes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button className="restart-button" onClick={restartAssessment}>
              🔄 Take New Assessment
            </button>
            <button className="dashboard-button" onClick={() => navigate('/dashboard')}>
              📊 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-container">
      <div className="assessment-content">
        <div className="assessment-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <div className="assessment-info">
            <h1>🎯 {currentAssessment?.title}</h1>
            <p>{currentAssessment?.description}</p>
            <div className="assessment-meta">
              <span className="difficulty">Difficulty: {currentAssessment?.difficulty}</span>
              <span className="time-remaining">⏰ Time: {formatTime(timeRemaining)}</span>
              <span className="progress">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {questions.length > 0 && (
          <div className="question-container">
            <div className="question-card">
              <div className="question-header">
                <span className="question-number">Question {currentQuestionIndex + 1}</span>
                <span className="question-points">{questions[currentQuestionIndex]?.points} points</span>
                <span className="question-difficulty">{questions[currentQuestionIndex]?.difficulty}</span>
              </div>
              
              <h2 className="question-text">{questions[currentQuestionIndex]?.question}</h2>
              
              <div className="options-container">
                {questions[currentQuestionIndex]?.options?.map((option, index) => (
                  <div
                    key={index}
                    className={`option ${selectedAnswer === index ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(index)}
                  >
                    <div className="option-indicator">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="option-text">{option}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="navigation-buttons">
              <button 
                className="nav-button prev" 
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                ← Previous
              </button>
              
              <button 
                className={`nav-button next ${selectedAnswer !== null ? 'active' : 'disabled'}`}
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Submit Assessment' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {isSubmitting && (
          <div className="submitting-overlay">
            <div className="submitting-content">
              <div className="loading-spinner"></div>
              <h3>🤖 AI is analyzing your responses...</h3>
              <p>Calculating scores and generating personalized feedback</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessment;
