import React, { useState } from "react";
import axios from "axios";

export default function LearningPathTimeline({ path }) {
  const [completedModules, setCompletedModules] = useState(new Set());
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  if (!path) return null;

  const handleMarkComplete = async (moduleId) => {
    try {
      setLoading(true);
      await axios.post(
        "/api/progress/complete",
        { resourceId: moduleId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setCompletedModules(prev => new Set([...prev, moduleId]));
    } catch (error) {
      console.error("Error marking module complete:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (moduleId) => {
    try {
      setLoading(true);
      await axios.post(
        "/api/ai/feedback",
        { 
          feedback,
          moduleId,
          interactionId: path._id 
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setFeedback("");
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Your Learning Path</h2>
      <div className="space-y-8">
        {path.map((mod, idx) => (
          <div 
            key={mod._id || idx}
            className={`p-6 bg-white rounded-lg shadow-md ${
              completedModules.has(mod._id) ? 'border-l-4 border-green-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {mod.title}
                </h3>
                <p className="text-gray-600 mb-4">{mod.description}</p>
                <div className="space-x-4">
                  <a
                    href={mod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    Visit Resource
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
              <button
                onClick={() => handleMarkComplete(mod._id)}
                disabled={loading || completedModules.has(mod._id)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  completedModules.has(mod._id)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-50`}
              >
                {completedModules.has(mod._id) ? 'Completed' : 'Mark Complete'}
              </button>
            </div>
            
            {completedModules.has(mod._id) && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Provide Feedback
                </h4>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-2 border rounded-md mb-2"
                  placeholder="How was this resource? Was it helpful?"
                  rows={3}
                />
                <button
                  onClick={() => handleFeedback(mod._id)}
                  disabled={loading || !feedback}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Submit Feedback
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
