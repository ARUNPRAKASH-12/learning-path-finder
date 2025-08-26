import express from 'express';
import { 
  generateUserCertificate, 
  getUserCertificates, 
  getCertificateById, 
  verifyCertificateById,
  downloadCertificateImage 
} from '../controllers/certificateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate a new certificate (protected route)
router.post('/generate', protect, generateUserCertificate);

// Get all user certificates (protected route)
router.get('/', protect, getUserCertificates);

// Get specific certificate by ID (protected route)
router.get('/:certificateId', protect, getCertificateById);

// Download certificate as image (protected route)
router.get('/:certificateId/image', protect, downloadCertificateImage);

// Verify certificate (public route for verification purposes)
router.get('/verify/:certificateId', verifyCertificateById);

export default router;
