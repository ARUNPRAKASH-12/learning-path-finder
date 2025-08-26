import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Certificates.css';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Safe render function to prevent object rendering errors
  const safeRender = (value) => {
    try {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        // For any other object, convert to string safely
        return JSON.stringify(value);
      }
      return String(value);
    } catch (err) {
      console.error('Error in safeRender:', err, 'Value:', value);
      return 'Error rendering value';
    }
  };

  // Safe certificate card component to isolate rendering errors
  const SafeCertificateCard = ({ certificate }) => {
    try {
      const courseDetails = certificate?.courseDetails || {};
      const certificateId = String(certificate?.certificateId || 'unknown');
      
      return (
        <div key={certificateId} className="certificate-card">
          <div className="certificate-header">
            <div className="certificate-icon">🎓</div>
            <div className="certificate-title">
              <h3>{safeRender(courseDetails.domain) || 'Unknown Domain'}</h3>
              <p className="certificate-level">{safeRender(courseDetails.level) || 'Beginner'}</p>
            </div>
          </div>

          <div className="certificate-details">
            <div className="detail-row">
              <span className="detail-label">Completion Date:</span>
              <span className="detail-value">
                {courseDetails.completionDate 
                  ? new Date(courseDetails.completionDate).toLocaleDateString()
                  : 'Not completed'
                }
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">
                {safeRender(courseDetails.duration)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Tasks Completed:</span>
              <span className="detail-value">
                {safeRender(courseDetails.tasksCompleted) || '0'}/{safeRender(courseDetails.totalTasks) || '0'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Completion Rate:</span>
              <span className="completion-badge">
                {Math.round(((Number(courseDetails.tasksCompleted) || 0) / (Number(courseDetails.totalTasks) || 1)) * 100)}%
              </span>
            </div>
          </div>

          <div className="skills-section">
            <div className="skills-label">Skills Mastered:</div>
            <div className="skills-list">
              {Array.isArray(courseDetails.skills) ? 
                courseDetails.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">
                    {safeRender(skill)}
                  </span>
                )) :
                <span className="skill-badge">No skills listed</span>
              }
            </div>
          </div>

          <div className="certificate-id-section">
            <div className="certificate-id">
              <span className="id-label">Certificate ID:</span>
              <span className="id-value">{certificateId}</span>
              <button 
                onClick={() => copyCertificateId(certificateId)}
                className="copy-id-button"
                title="Copy Certificate ID"
              >
                📋
              </button>
            </div>
          </div>

          <div className="certificate-actions">
            <button
              onClick={() => {
                console.log('🔍 View button clicked for certificate:', certificateId);
                console.log('🔍 Full certificate object:', certificate);
                viewCertificate(certificateId);
              }}
              className="action-button view-button"
            >
              👁️ View
            </button>
            <button
              onClick={() => downloadCertificateImage(certificateId)}
              className="action-button download-image-button"
            >
              🖼️ Download Image
            </button>
          </div>

          <div className="certificate-stats">
            <div className="stat">
              <span className="stat-label">Downloads:</span>
              <span className="stat-value">{safeRender(certificate.downloadCount) || '0'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Issued:</span>
              <span className="stat-value">
                {certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering certificate card:', error, certificate);
      return (
        <div className="certificate-card">
          <div className="error-message">
            <h3>Error displaying certificate</h3>
            <p>Certificate ID: {String(certificate?.certificateId || 'Unknown')}</p>
          </div>
        </div>
      );
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch certificates...');
      
      const response = await api.getUserCertificates();
      console.log('Certificate API response:', response);
      console.log('Response data:', response.data);
      
      const certificates = response.data.certificates || [];
      console.log('Parsed certificates:', certificates);
      console.log('Number of certificates:', certificates.length);
      
      setCertificates(certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificateImage = async (certificateId) => {
    try {
      const response = await api.downloadCertificateImage(certificateId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image certificate. Please try again.');
    }
  };

  const viewCertificate = async (certificateId) => {
    try {
      console.log('Viewing certificate:', certificateId);
      const response = await api.getCertificate(certificateId);
      console.log('Certificate response:', response);
      console.log('Response data:', response.data);
      
      const certificate = response.data.certificate;
      console.log('Parsed certificate:', certificate);
      
      if (!certificate) {
        throw new Error('Certificate data not found in response');
      }
      
      // Open certificate content in a new window
      const newWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
      newWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${certificate.certificateId}</title>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                line-height: 1.6; 
                background: #f5f5f5;
              }
              .certificate-viewer { 
                max-width: 900px; 
                margin: 0 auto; 
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              .header { 
                text-align: center; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                margin-bottom: 0;
              }
              .header h1 { margin: 0; font-size: 2em; }
              .header p { margin: 10px 0 0 0; opacity: 0.9; }
              .certificate-content { 
                padding: 30px;
              }
              .certificate-html {
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                background: #fff;
                min-height: 400px;
              }
              .verification { 
                background: #f0f9ff; 
                padding: 20px; 
                border-radius: 8px; 
                margin-top: 20px;
                border-left: 4px solid #3b82f6;
              }
              .verification h3 { 
                margin-top: 0; 
                color: #1e40af;
              }
              .verification-item {
                margin: 10px 0;
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 8px;
              }
              .verification-item:last-child {
                border-bottom: none;
              }
              .verification-label {
                font-weight: bold;
                color: #374151;
              }
              .verification-value {
                color: #6b7280;
              }
              .action-buttons {
                text-align: center;
                margin-top: 20px;
                padding: 20px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
              }
              .btn {
                display: inline-block;
                padding: 10px 20px;
                margin: 0 10px;
                background: #3b82f6;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 14px;
              }
              .btn:hover {
                background: #2563eb;
              }
              .btn-secondary {
                background: #6b7280;
              }
              .btn-secondary:hover {
                background: #4b5563;
              }
            </style>
          </head>
          <body>
            <div class="certificate-viewer">
              <div class="header">
                <h1>🎓 Certificate Viewer</h1>
                <p>Certificate ID: ${certificate.certificateId}</p>
              </div>
              
              <div class="certificate-content">
                <div class="certificate-html">
                  ${certificate.content}
                </div>
                
                <div class="verification">
                  <h3>📋 Verification Details</h3>
                  <div class="verification-item">
                    <span class="verification-label">Verification URL:</span>
                    <span class="verification-value">
                      <a href="${certificate.verification.verificationUrl}" target="_blank" style="color: #3b82f6;">
                        ${certificate.verification.verificationUrl}
                      </a>
                    </span>
                  </div>
                  <div class="verification-item">
                    <span class="verification-label">Issue Date:</span>
                    <span class="verification-value">
                      ${new Date(certificate.verification.issuedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div class="verification-item">
                    <span class="verification-label">Skills:</span>
                    <span class="verification-value">${certificate.verification.skills.join(', ')}</span>
                  </div>
                  <div class="verification-item">
                    <span class="verification-label">Domain:</span>
                    <span class="verification-value">${certificate.verification.domain}</span>
                  </div>
                  <div class="verification-item">
                    <span class="verification-label">Completion Rate:</span>
                    <span class="verification-value">${certificate.verification.completionRate}%</span>
                  </div>
                </div>
              </div>
              
              <div class="action-buttons">
                <button class="btn" onclick="window.print()">🖨️ Print Certificate</button>
                <button class="btn btn-secondary" onclick="window.close()">❌ Close Window</button>
              </div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      console.error('Error viewing certificate:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to load certificate. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'Certificate not found.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  const copyCertificateId = (certificateId) => {
    navigator.clipboard.writeText(certificateId);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="certificates-container">
        <div className="certificates-header">
          <h1>My Certificates</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="certificates-container">
        <div className="certificates-header">
          <h1>My Certificates</h1>
        </div>
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">❌</div>
            <h2>Error Loading Certificates</h2>
            <p>{error}</p>
            <button onClick={fetchCertificates} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificates-container">
      <div className="certificates-header">
        <h1>🎓 My Certificates</h1>
        <p>Your completed learning path certificates</p>
      </div>

      {certificates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h2>No Certificates Yet</h2>
          <p>Complete a learning path to earn your first certificate!</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="start-learning-button"
          >
            Start Learning Journey
          </button>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map((certificate, index) => (
            <SafeCertificateCard key={certificate?.certificateId || index} certificate={certificate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
