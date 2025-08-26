import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Assessment from './pages/Assessment';
import DomainSelection from './components/Learning/DomainSelection';
import ResourceSelection from './components/Learning/ResourceSelection';
import SkillSelection from './components/Learning/SkillSelection';
import AIAnalysis from './components/Learning/AIAnalysis';
import ResourceView from './components/Learning/ResourceView';
import LearningPath from './components/Learning/LearningPath';
import CompletedCourses from './components/CompletedCourses';
import Feedback from './components/Feedback';
import ApiTest from './components/Debug/ApiTest';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/api-test" element={<ApiTest />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/assessment"
              element={
                <PrivateRoute>
                  <Assessment />
                </PrivateRoute>
              }
            />

            <Route
              path="/domain-selection"
              element={
                <PrivateRoute>
                  <DomainSelection />
                </PrivateRoute>
              }
            />
            <Route
              path="/resource-selection"
              element={
                <PrivateRoute>
                  <ResourceSelection />
                </PrivateRoute>
              }
            />
            <Route
              path="/skill-selection"
              element={
                <PrivateRoute>
                  <SkillSelection />
                </PrivateRoute>
              }
            />
            <Route
              path="/ai-analysis"
              element={
                <PrivateRoute>
                  <AIAnalysis />
                </PrivateRoute>
              }
            />
            <Route
              path="/learning-path"
              element={
                <PrivateRoute>
                  <LearningPath />
                </PrivateRoute>
              }
            />
            <Route
              path="/learning-path/:pathId"
              element={
                <PrivateRoute>
                  <LearningPath />
                </PrivateRoute>
              }
            />
            <Route
              path="/resources/:skillId"
              element={
                <PrivateRoute>
                  <ResourceView />
                </PrivateRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <PrivateRoute>
                  <Feedback />
                </PrivateRoute>
              }
            />
            <Route
              path="/completed-courses"
              element={
                <PrivateRoute>
                  <CompletedCourses />
                </PrivateRoute>
              }
            />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

