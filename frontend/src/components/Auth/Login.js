
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">
            Welcome Back
          </h2>
          <p className="login-subtitle">
            Sign in to continue your learning journey
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              placeholder="Email address"
              value={email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              placeholder="Password"
              value={password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading && <span className="loading-spinner"></span>}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="login-footer">
            <Link
              to="/register"
              className="register-link"
            >
              Don't have an account? Sign up
            </Link>
            
            <div className="forgot-password">
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div className="divider">
            <span className="divider-text">or continue with</span>
          </div>

          <div className="social-buttons">
            <button type="button" className="social-button google-button">
              <span>🔗</span>
              Google
            </button>
            <button type="button" className="social-button github-button">
              <span>⚡</span>
              GitHub
            </button>
          </div>

          <div className="features">
            <div className="features-title">Why choose us?</div>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <div className="feature-text">Personalized Learning</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">Progress Tracking</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🚀</div>
                <div className="feature-text">Fast Results</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

   