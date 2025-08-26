import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateCertificateImage = async (certificateData) => {
  let browser;
  
  try {
    // Launch puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Use the certificate content directly (which is now HTML)
    const htmlContent = certificateData.content || createCertificateHTML(certificateData);

    // Set viewport for better image quality
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Set the content and wait for it to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate screenshot as PNG
    const image = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: false
    });

    return image;

  } catch (error) {
    console.error('Error generating certificate image:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const generateCertificatePDF = async (certificateData) => {
  let browser;
  
  try {
    // Launch puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Use the certificate content directly (which is now HTML)
    const htmlContent = certificateData.content || createCertificateHTML(certificateData);

    // Set the content and wait for it to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Set viewport for A4 size - much larger for full content capture
    await page.setViewport({ 
      width: 1200,  // Increased for better content capture
      height: 1600, // Increased for full height capture
      deviceScaleFactor: 1 
    });

    // Generate PDF with aggressive compression for full content visibility
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '5mm',    // Minimal margins for maximum space
        right: '5mm',
        bottom: '5mm',
        left: '5mm'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      pageRanges: '1', // Ensure only first page is generated
      scale: 0.6,      // Aggressive compression to fit everything
      width: '210mm',
      height: '297mm'
    });

    return pdf;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const createCertificateHTML = (certificateData) => {
  const {
    userInfo,
    courseDetails,
    certificateId,
    verification
  } = certificateData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 0;
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            /* A4 size optimization */
            width: 210mm;
            height: 297mm;
            overflow: hidden;
        }

        .certificate-container {
            background: white;
            border-radius: 10px;
            padding: 15px 20px; /* Reduced padding */
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            width: 194mm; /* Maximized for A4 with minimal margins */
            height: 281mm; /* Maximized for A4 with minimal margins */
            position: relative;
            overflow: hidden;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .certificate-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #fbbf24 100%);
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            flex-shrink: 0;
        }

        .certificate-title {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 6px;
            letter-spacing: 1.2px;
        }

        .institution {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            color: #667eea;
            font-weight: 600;
            margin-bottom: 15px;
        }

        .certification-text {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 12px;
            line-height: 1.3;
        }

        .recipient-name {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            font-weight: 700;
            color: #1f2937;
            margin: 15px 0;
            text-decoration: underline;
            text-decoration-color: #fbbf24;
            text-underline-offset: 4px;
            text-decoration-thickness: 2px;
        }

        .completion-text {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 15px;
            line-height: 1.3;
        }

        .domain-name {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 700;
            color: #667eea;
            margin: 12px 0;
        }

        .details-section {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
            flex-grow: 1;
            min-height: 0;
        }

        .details-title {
            font-family: 'Playfair Display', serif;
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .detail-item {
            display: flex;
            align-items: center;
            margin-bottom: 6px;
        }

        .detail-label {
            font-weight: 600;
            color: #374151;
            min-width: 90px;
            font-size: 12px;
        }

        .detail-value {
            color: #6b7280;
            font-weight: 500;
            font-size: 12px;
        }

        .skills-section {
            margin: 15px 0;
        }

        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }

        .skill-tag {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
        }

        .achievement-text {
            font-size: 12px;
            color: #4b5563;
            line-height: 1.4;
            margin: 15px 0;
            text-align: center;
            font-style: italic;
        }

        .verification-section {
            background: #f0f9ff;
            border-radius: 8px;
            padding: 12px;
            margin-top: 15px;
            border: 2px solid #0ea5e9;
            flex-shrink: 0;
        }

        .verification-title {
            font-weight: 700;
            color: #0369a1;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .verification-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .verification-item {
            display: flex;
            flex-direction: column;
        }

        .verification-label {
            font-weight: 600;
            color: #0369a1;
            font-size: 10px;
            margin-bottom: 3px;
        }

        .verification-value {
            color: #1e40af;
            font-family: 'Courier New', monospace;
            font-size: 9px;
            background: white;
            padding: 4px;
            border-radius: 3px;
            word-break: break-all;
        }

        .signature-section {
            margin-top: 15px;
            text-align: center;
            flex-shrink: 0;
        }

        .signature-line {
            width: 200px;
            height: 1px;
            background: #d1d5db;
            margin: 12px auto;
        }

        .signature-text {
            color: #6b7280;
            font-size: 10px;
            margin-top: 6px;
        }

        .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            flex-shrink: 0;
        }

        .footer-text {
            color: #9ca3af;
            font-size: 10px;
            font-weight: 500;
        }

        .completion-rate {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 11px;
            margin: 6px 0;
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
                border-radius: 0 !important;
                margin: 0 !important;
                padding: 25px 30px !important;
                page-break-inside: avoid !important;
                height: 267mm !important;
                width: 180mm !important;
            }
            
            * {
                page-break-inside: avoid !important;
            }
        }

        @page {
            size: A4;
            margin: 8mm; /* Reduced to match PDF settings */
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="header">
            <h1 class="certificate-title">CERTIFICATE OF COMPLETION</h1>
            <h2 class="institution">Learning Path Finder Academy</h2>
        </div>

        <div class="certification-text">
            This is to certify that
        </div>

        <div class="recipient-name">${userInfo.name}</div>

        <div class="completion-text">
            has successfully completed the comprehensive learning path in
        </div>

        <div class="domain-name">${courseDetails.domain}</div>

        <div class="details-section">
            <h3 class="details-title">Course Details</h3>
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Difficulty Level:</span>
                    <span class="detail-value">${courseDetails.level}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${courseDetails.duration || '30'} days</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Start Date:</span>
                    <span class="detail-value">${courseDetails.startDate ? new Date(courseDetails.startDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Completion Date:</span>
                    <span class="detail-value">${new Date(courseDetails.completionDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Tasks Completed:</span>
                    <span class="detail-value">${courseDetails.tasksCompleted || courseDetails.skills.length} out of ${courseDetails.totalTasks || courseDetails.skills.length}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Completion Rate:</span>
                    <span class="completion-rate">${Math.round(((courseDetails.tasksCompleted || courseDetails.skills.length) / (courseDetails.totalTasks || courseDetails.skills.length)) * 100)}%</span>
                </div>
            </div>

            <div class="skills-section">
                <div class="detail-label">Skills Mastered:</div>
                <div class="skills-list">
                    ${courseDetails.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        </div>

        <div class="achievement-text">
            This certificate acknowledges the dedication, commitment, and successful completion of all required coursework and assessments in the specified learning path.
        </div>

        <div class="verification-section">
            <div class="verification-title">🔒 Certificate Verification</div>
            <div class="verification-details">
                <div class="verification-item">
                    <span class="verification-label">Certificate ID:</span>
                    <span class="verification-value">${certificateId}</span>
                </div>
                <div class="verification-item">
                    <span class="verification-label">Issue Date:</span>
                    <span class="verification-value">${new Date().toLocaleDateString()}</span>
                </div>
                <div class="verification-item" style="grid-column: 1 / -1;">
                    <span class="verification-label">Verification URL:</span>
                    <span class="verification-value">${verification.verificationUrl}</span>
                </div>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-line"></div>
            <div class="signature-text">Learning Path Finder Academy</div>
            <div class="signature-text">Digital Learning Platform</div>
        </div>

        <div class="footer">
            <div class="footer-text">
                This certificate is digitally issued and verified. 
                Visit the verification URL above to confirm authenticity.
            </div>
        </div>
    </div>
</body>
</html>
  `;
};
