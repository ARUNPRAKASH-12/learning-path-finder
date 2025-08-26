import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const { name, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const result = await register(name, email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="registration-steps">
          <div className="step active"></div>
          <div className="step"></div>
          <div className="step"></div>
        </div>

        <div className="register-header">
          <h2 className="register-title">
            Join Our Community
          </h2>
          <p className="register-subtitle">
            Create your account and start your learning journey
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <input
              name="name"
              type="text"
              required
              className="form-input"
              placeholder="Full name"
              value={name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <input
              name="email"
              type="email"
              required
              className="form-input"
              placeholder="Email address"
              value={email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <input
              name="password"
              type="password"
              required
              className="form-input"
              placeholder="Password"
              value={password}
              onChange={handleChange}
            />
            <div className="password-strength">
              <div className={`strength-bar ${password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak'}`}></div>
              <div className={`strength-bar ${password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : ''}`}></div>
              <div className={`strength-bar ${password.length >= 8 ? 'strong' : ''}`}></div>
            </div>
            <div className={`strength-text ${password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak'}`}>
              {password.length >= 8 ? 'Strong password' : 
               password.length >= 6 ? 'Medium strength' : 
               password.length > 0 ? 'Weak password' : ''}
            </div>
          </div>

          <div className="form-group">
            <input
              name="confirmPassword"
              type="password"
              required
              className="form-input"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="agreement-section">
            <div className="agreement-checkbox">
              <input type="checkbox" id="terms" required />
              <div className="agreement-text">
                I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-button"
          >
            {loading && <span className="loading-spinner"></span>}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="login-footer">
            <Link
              to="/login"
              className="login-link"
            >
              Already have an account? Sign in
            </Link>
          </div>

          <div className="divider">
            <span className="divider-text">or sign up with</span>
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
            <div className="features-title">What you'll get</div>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">🎓</div>
                <div className="feature-text">Expert-Led Courses</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📈</div>
                <div className="feature-text">Track Progress</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
