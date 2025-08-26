import Certificate from '../models/Certificate.js';
import { generateCertificate, verifyCertificate, generateCertificateImageBuffer } from '../services/certificateService.js';

export const generateUserCertificate = async (req, res) => {
  try {
    const { domain, skills, level, completionRate = 100 } = req.body;
    const userId = req.user.id;
    const user = req.user;

    // Validate input
    if (!domain || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Domain and skills are required'
      });
    }

    // Check if user already has a certificate for this domain
    const existingCertificate = await Certificate.findOne({
      userId,
      'courseDetails.domain': domain,
      isRevoked: false
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this domain',
        certificateId: existingCertificate.certificateId
      });
    }

    // Generate certificate content using AI service
    const certificateData = await generateCertificate({
      userInfo: {
        name: user.name,
        email: user.email
      },
      courseDetails: {
        domain,
        skills,
        level: level || 'Intermediate',
        completionDate: new Date(),
        completionRate
      }
    });

    // Save certificate to database
    const certificate = new Certificate({
      certificateId: certificateData.certificateId,
      userId,
      userInfo: {
        name: user.name,
        email: user.email
      },
      courseDetails: {
        domain,
        skills,
        level: level || 'Intermediate',
        startDate: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 days ago
        completionDate: new Date(),
        duration: 30, // days
        tasksCompleted: Math.floor(skills.length * (completionRate / 100)),
        totalTasks: skills.length
      },
      content: certificateData.content,
      verification: certificateData.verification
    });

    await certificate.save();

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      certificate: {
        certificateId: certificate.certificateId,
        content: certificate.content,
        verification: certificate.verification,
        courseDetails: certificate.courseDetails
      }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: error.message
    });
  }
};

export const getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.id;

    const certificates = await Certificate.find({
      userId,
      isRevoked: false
    }).select('-content').sort({ createdAt: -1 });

    res.json({
      success: true,
      certificates: certificates
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
};

export const getCertificateById = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    console.log('🔍 getCertificateById called:');
    console.log('- Certificate ID:', certificateId);
    console.log('- User ID:', userId);

    // Check if certificate exists for this user first (without certificateId filter)
    const userCertificates = await Certificate.find({ userId, isRevoked: false }).select('certificateId');
    console.log('- User has certificates:', userCertificates.map(c => c.certificateId));

    // Now check with certificateId
    const certificate = await Certificate.findOne({
      certificateId,
      userId,
      isRevoked: false
    });

    console.log('📄 Certificate found:', !!certificate);
    
    if (!certificate) {
      // Let's check if certificate exists but for different user
      const anyUserCert = await Certificate.findOne({ certificateId, isRevoked: false });
      console.log('- Certificate exists for any user:', !!anyUserCert);
      if (anyUserCert) {
        console.log('- Certificate belongs to user:', anyUserCert.userId);
      }
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Update download count
    certificate.downloadCount += 1;
    certificate.lastDownloaded = new Date();
    await certificate.save();

    res.json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        content: certificate.content,
        verification: certificate.verification,
        courseDetails: certificate.courseDetails,
        createdAt: certificate.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate',
      error: error.message
    });
  }
};

export const verifyCertificateById = async (req, res) => {
  try {
    const { certificateId } = req.params;

    // First check in database
    const certificate = await Certificate.findOne({
      certificateId,
      isRevoked: false
    }).select('certificateId userInfo courseDetails verification createdAt');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or has been revoked'
      });
    }

    // Verify using service
    const verificationResult = verifyCertificate(certificateId, certificate.verification);

    res.json({
      success: true,
      verified: verificationResult.isValid,
      certificate: {
        certificateId: certificate.certificateId,
        userInfo: certificate.userInfo,
        courseDetails: certificate.courseDetails,
        verification: certificate.verification,
        issuedDate: certificate.createdAt
      },
      verificationDetails: verificationResult
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate',
      error: error.message
    });
  }
};

export const downloadCertificateImage = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    const certificate = await Certificate.findOne({
      certificateId,
      userId,
      isRevoked: false
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Generate image
    const imageBuffer = await generateCertificateImageBuffer({
      userInfo: certificate.userInfo,
      courseDetails: certificate.courseDetails,
      certificateId: certificate.certificateId,
      verification: certificate.verification,
      content: certificate.content  // Pass the actual certificate HTML content
    });

    // Update download count
    certificate.downloadCount += 1;
    certificate.lastDownloaded = new Date();
    await certificate.save();

    // Set headers for image download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateId}.png"`);
    res.setHeader('Content-Length', imageBuffer.length);

    res.send(imageBuffer);

  } catch (error) {
    console.error('Error downloading certificate image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate image',
      error: error.message
    });
  }
};
