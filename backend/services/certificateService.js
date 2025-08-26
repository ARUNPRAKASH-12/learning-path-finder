import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateCertificatePDF } from './pdfService.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateCertificate = async ({ userInfo, courseDetails }) => {
  try {
    // Generate a unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Always use our professional template instead of AI-generated HTML
    const professionalCertificate = generateFallbackCertificate(userInfo, courseDetails, certificateId);
    
    return professionalCertificate;
    
  } catch (error) {
    console.error('Error generating certificate:', error);
    
    // Even on error, use our professional template
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const fallbackCertificate = generateFallbackCertificate(userInfo, courseDetails, certificateId);
    
    return fallbackCertificate;
  }
};

const generateFallbackCertificate = (userInfo, courseDetails, certificateId) => {
  const tasksCompleted = courseDetails.tasksCompleted || courseDetails.skills?.length || 0;
  const totalTasks = courseDetails.totalTasks || courseDetails.skills?.length || 1;
  const completionRate = Math.round((tasksCompleted / totalTasks) * 100);
  
  const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Achievement</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Montserrat', sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
            padding: 20px;
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            /* A4 size optimization */
            width: 210mm;
            height: 297mm;
        }

        .certificate-container {
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 15px;
            padding: 40px;
            box-shadow: 
                0 25px 50px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
            width: 190mm; /* A4 width with margins */
            height: 270mm; /* A4 height with margins */
            position: relative;
            overflow: hidden;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }

        .certificate-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, 
                #ffd700 0%, 
                #ffed4e 15%, 
                #fff 30%, 
                #fff 70%, 
                #ffed4e 85%, 
                #ffd700 100%);
            padding: 8px;
            border-radius: 25px;
            z-index: -1;
        }

        .certificate-container::after {
            content: '';
            position: absolute;
            top: 25px;
            left: 25px;
            right: 25px;
            bottom: 25px;
            border: 2px solid #e5b429;
            border-radius: 15px;
            pointer-events: none;
            z-index: 1;
        }

        .ornament {
            position: absolute;
            width: 80px;
            height: 80px;
            background: radial-gradient(circle, #ffd700 0%, #e5b429 70%, #b8860b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: white;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(229, 180, 41, 0.4);
        }

        .ornament.top-left {
            top: -20px;
            left: -20px;
        }

        .ornament.top-right {
            top: -20px;
            right: -20px;
        }

        .ornament.bottom-left {
            bottom: -20px;
            left: -20px;
        }

        .ornament.bottom-right {
            bottom: -20px;
            right: -20px;
        }

        .header {
            text-align: center;
            margin-bottom: 8px; /* Very compact margin */
            position: relative;
            z-index: 2;
            flex-shrink: 0;
        }

        .institution-seal {
            width: 45px; /* Much smaller size */
            height: 45px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 50%;
            margin: 0 auto 6px; /* Very compact margin */
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem; /* Smaller font */
            color: white;
            font-weight: bold;
            border: 2px solid #ffd700; /* Thinner border */
            box-shadow: 0 8px 25px rgba(30, 60, 114, 0.3);
            position: relative;
        }

        .institution-seal::before {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: 50%;
            background: linear-gradient(45deg, #ffd700, #ffed4e, #ffd700);
            z-index: -1;
        }

        .institution-name {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.1rem; /* Smaller font */
            font-weight: 700;
            color: #1e3c72;
            margin-bottom: 3px; /* Very compact margin */
            letter-spacing: 1px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }

        .institution-tagline {
            font-size: 0.7rem; /* Much smaller font */
            color: #64748b;
            font-weight: 400;
            margin-bottom: 10px; /* Compact margin */
            letter-spacing: 0.5px;
        }

        .certificate-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.8rem; /* Much smaller from 2.2rem */
            font-weight: 700;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 5px; /* Very compact margin */
            line-height: 1;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .certificate-subtitle {
            font-size: 0.75rem; /* Much smaller font */
            color: #64748b;
            font-weight: 400;
            margin-bottom: 12px; /* Compact margin */
            font-style: italic;
        }
            pointer-events: none;
        }

        .certificate-border {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #fbbf24 100%);
        }

        .header {
            text-align: center;
            margin-bottom: 50px;
            position: relative;
        }

        .institution-logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: white;
            font-weight: bold;
        }

        .institution-name {
            font-family: 'Playfair Display', serif;
            font-size: 1.6rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .institution-tagline {
            font-size: 0.9rem;
            color: #6b7280;
            font-weight: 400;
            margin-bottom: 30px;
        }

        .certificate-title {
            font-family: 'Playfair Display', serif;
            font-size: 3.2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            line-height: 1.1;
        }

        .certificate-subtitle {
            font-size: 1.1rem;
            color: #6b7280;
            font-weight: 400;
            margin-bottom: 40px;
        }

        .recipient-section {
            text-align: center;
            margin-bottom: 8px; /* Very compact margin */
            padding: 8px; /* Very compact padding */
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 8px; /* Smaller radius */
            border: 1px solid #e2e8f0; /* Thinner border */
            position: relative;
            box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
            flex-shrink: 0;
        }

        .recipient-section::before {
            content: '';
            position: absolute;
            top: -3px; /* Adjusted position */
            left: 50%;
            transform: translateX(-50%);
            width: 25px; /* Much smaller size */
            height: 6px;
            background: linear-gradient(90deg, #ffd700, #ffed4e, #ffd700);
            border-radius: 3px;
        }

        .presented-to {
            font-size: 0.8rem; /* Much smaller font */
            color: #64748b;
            margin-bottom: 6px; /* Very compact margin */
            font-weight: 500;
            font-style: italic;
        }

        .recipient-name {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.4rem; /* Much smaller from 1.8rem */
            font-weight: 700;
            color: #1e3c72;
            margin-bottom: 4px; /* Very compact margin */
            line-height: 1.1;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
        }

        .recipient-name::after {
            content: '';
            position: absolute;
            bottom: -2px; /* Adjusted position */
            left: 50%;
            transform: translateX(-50%);
            width: 50px; /* Much smaller width */
            height: 1px;
            background: linear-gradient(90deg, #ffd700, #ffed4e, #ffd700);
            border-radius: 1px;
        }

        .recipient-email {
            font-size: 0.7rem; /* Much smaller font */
            color: #64748b;
            font-weight: 400;
        }

        .achievement-section {
            text-align: center;
            margin-bottom: 8px; /* Very compact margin */
            padding: 6px; /* Very compact padding */
            position: relative;
            flex-shrink: 0;
        }

        .achievement-text {
            font-size: 0.9rem; /* Much smaller font */
            color: #334155;
            line-height: 1.3; /* Tighter line spacing */
            margin-bottom: 6px; /* Very compact margin */
            font-weight: 400;
        }

        .domain-highlight {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 700;
            color: #1e3c72;
            font-size: 1.1rem; /* Much smaller font */
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
            display: block;
            margin: 4px 0; /* Very compact margin */
        }

        .level-badge {
            display: inline-block;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 4px 10px; /* Much smaller padding */
            border-radius: 15px; /* Smaller radius */
            font-weight: 600;
            font-size: 0.7rem; /* Much smaller font */
            margin: 4px 3px; /* Very compact margin */
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .skills-section {
            margin-bottom: 8px; /* Very compact margin */
            text-align: center;
            padding: 8px; /* Very compact padding */
            background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
            border-radius: 8px; /* Smaller radius */
            border: 1px solid #e2e8f0; /* Thinner border */
            position: relative;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            flex-grow: 1;
            min-height: 0;
        }

        .skills-section::before {
            content: '⭐';
            position: absolute;
            top: -4px; /* Adjusted position */
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.8rem; /* Much smaller icon */
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            width: 18px; /* Much smaller size */
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid white;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .skills-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 0.9rem; /* Much smaller font */
            color: #1e3c72;
            font-weight: 700;
            margin-bottom: 6px; /* Very compact margin */
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }

        .skills-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 3px; /* Very small gap */
            margin-bottom: 6px; /* Very compact margin */
        }

        .skill-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3px 8px; /* Much smaller padding */
            border-radius: 6px; /* Much smaller radius */
            font-size: 0.6rem; /* Much smaller font */
            font-weight: 600;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        .skill-badge::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .skill-badge:hover::before {
            left: 100%;
        }

        .completion-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); /* Much smaller min width */
            gap: 4px; /* Very small gap */
            margin-bottom: 8px; /* Very compact margin */
            padding: 6px; /* Very compact padding */
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 8px; /* Smaller radius */
            border: 1px solid #0ea5e9; /* Thinner border */
            position: relative;
            box-shadow: 0 8px 25px rgba(14, 165, 233, 0.15);
            flex-shrink: 0;
        }

        .completion-stats::before {
            content: '📊';
            position: absolute;
            top: -4px; /* Adjusted position */
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.8rem; /* Much smaller icon */
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            width: 18px; /* Much smaller size */
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid white;
            box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
        }

        .stat-item {
            text-align: center;
            padding: 4px 3px; /* Much smaller padding */
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 6px; /* Smaller radius */
            border: 1px solid #0ea5e9; /* Thinner border */
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.15);
            position: relative;
        }

        .stat-label {
            font-size: 0.55rem; /* Much smaller font */
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 2px; /* Very compact margin */
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-value {
            font-size: 0.8rem; /* Much smaller font */
            font-weight: 700;
            color: #1f2937;
        }

        .completion-rate {
            color: #10b981;
        }

        .certificate-footer {
            text-align: center;
            padding: 6px; /* Very compact padding */
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 8px; /* Smaller radius */
            color: white;
            margin-top: 6px; /* Very compact margin */
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(30, 60, 114, 0.3);
            flex-shrink: 0;
        }

        .certificate-footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="stars" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23stars)"/></svg>');
            opacity: 0.3;
        }

        .certificate-id {
            font-size: 0.6rem; /* Much smaller font */
            color: #cbd5e0;
            margin-bottom: 4px; /* Very compact margin */
            font-family: 'Courier New', monospace;
            background: rgba(255, 255, 255, 0.1);
            padding: 2px 6px; /* Much smaller padding */
            border-radius: 3px; /* Smaller radius */
            display: inline-block;
            letter-spacing: 1px;
            position: relative;
            z-index: 1;
        }

        .issue-date {
            font-size: 0.65rem; /* Much smaller font */
            color: #e2e8f0;
            font-weight: 600;
            margin-bottom: 3px; /* Very compact margin */
            position: relative;
            z-index: 1;
        }

        .verification-link {
            font-size: 0.55rem; /* Much smaller font */
            color: #ffd700;
            text-decoration: none;
            border: 1px solid #ffd700;
            padding: 2px 5px; /* Much smaller padding */
            border-radius: 3px; /* Smaller radius */
            display: inline-block;
            font-weight: 500;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
        }

        .verification-link:hover {
            background: #ffd700;
            color: #1e3c72;
            text-decoration: none;
        }
            transition: all 0.3s ease;
        }

        .verification-link:hover {
            background: #667eea;
            color: white;
        }

        @media print {
            * {
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
            }
            
            body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                overflow: hidden !important;
            }
            
            .certificate-container {
                box-shadow: none !important;
                border: 1px solid #e2e8f0 !important;
                margin: 0 !important;
                max-width: 100% !important;
                width: 200mm !important; /* Maximum width for extreme compression */
                height: 287mm !important; /* Maximum height for extreme compression */
                padding: 10px 15px !important; /* Very compact padding */
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
            }
            
            /* Ensure all sections fit on single page */
            .header, .recipient-section, .achievement-section, 
            .skills-section, .completion-stats, .certificate-footer {
                page-break-inside: avoid !important;
            }
        }

        @page {
            size: A4;
            margin: 5mm; /* Minimal margins for maximum content area */
        }

        @media (max-width: 768px) {
            .certificate-container {
                padding: 40px 30px;
                margin: 20px;
            }
            
            .certificate-title {
                font-size: 2.5rem;
            }
            
            .recipient-name {
                font-size: 2.2rem;
            }
            
            .completion-stats {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate-border"></div>
        
        <div class="header">
            <div class="institution-logo">LPF</div>
            <div class="institution-name">Learning Path Finder Academy</div>
            <div class="institution-tagline">Excellence in Professional Development</div>
            <h1 class="certificate-title">Certificate of Completion</h1>
            <p class="certificate-subtitle">This certifies the successful completion of a comprehensive learning program</p>
        </div>

        <div class="recipient-section">
            <p class="presented-to">This certificate is proudly presented to</p>
            <h2 class="recipient-name">${userInfo.name}</h2>
            <p class="recipient-email">${userInfo.email}</p>
        </div>

        <div class="achievement-section">
            <p class="achievement-text">
                For successfully completing the comprehensive learning path in<br>
                <span class="domain-highlight">${courseDetails.domain}</span>
            </p>
            <div class="level-badge">${courseDetails.level} Level</div>
        </div>

        <div class="skills-section">
            <h3 class="skills-title">Skills Mastered</h3>
            <div class="skills-grid">
                ${courseDetails.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
            </div>
        </div>

        <div class="completion-stats">
            <div class="stat-item">
                <div class="stat-label">Completion Rate</div>
                <div class="stat-value completion-rate">${completionRate}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Duration</div>
                <div class="stat-value">${courseDetails.duration || '10'} Days</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Tasks Completed</div>
                <div class="stat-value">${tasksCompleted}/${totalTasks}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Achievement Level</div>
                <div class="stat-value">${courseDetails.level}</div>
            </div>
        </div>

        <div class="certificate-footer">
            <div class="certificate-id">Certificate ID: ${certificateId}</div>
            <div class="issue-date">Issued on: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</div>
            <a href="VERIFICATION-URL-PLACEHOLDER" class="verification-link" target="_blank">
                Verify Certificate Online
            </a>
        </div>
    </div>
</body>
</html>
  `.trim();

  return {
    certificateId,
    content,
    verification: {
      certificateId,
      issuedDate: new Date().toISOString(),
      verificationUrl: `${process.env.API_URL || 'http://localhost:5000'}/verify-certificate/${certificateId}`,
      skills: courseDetails.skills,
      domain: courseDetails.domain,
      completionRate: completionRate
    }
  };
};

export const verifyCertificate = (certificateId, verificationData) => {
  try {
    // Basic verification logic
    if (!certificateId || !verificationData) {
      return {
        isValid: false,
        message: 'Invalid certificate data'
      };
    }

    // Check if the certificate ID matches
    if (certificateId !== verificationData.certificateId) {
      return {
        isValid: false,
        message: 'Certificate ID mismatch'
      };
    }

    return {
      isValid: true,
      message: 'Certificate is valid and authentic',
      verifiedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Certificate verification failed',
      error: error.message
    };
  }
};

export const generateCertificatePDFBuffer = async ({ userInfo, courseDetails, certificateId, verification, content }) => {
  try {
    const certificateData = {
      userInfo,
      courseDetails,
      certificateId,
      verification,
      content
    };
    
    const pdfBuffer = await generateCertificatePDF(certificateData);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateCertificateImageBuffer = async ({ userInfo, courseDetails, certificateId, verification, content }) => {
  try {
    const { generateCertificateImage } = await import('./pdfService.js');
    
    const certificateData = {
      userInfo,
      courseDetails,
      certificateId,
      verification,
      content
    };
    
    const imageBuffer = await generateCertificateImage(certificateData);
    return imageBuffer;
  } catch (error) {
    console.error('Error generating certificate image:', error);
    throw error;
  }
};
