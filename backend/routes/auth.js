import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Handle OPTIONS requests for all auth routes
router.options('*', (req, res) => {
  console.log('OPTIONS request to auth route:', req.url);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '3600');
  res.status(204).send();
});

router.post('/register', (req, res, next) => {
  console.log('POST /register - Body received:', req.body);
  console.log('POST /register - Headers:', req.headers);
  next();
}, register);

router.post('/login', (req, res, next) => {
  console.log('POST /login - Body received:', req.body);
  next();
}, login);

router.get('/me', protect, getMe);

export default router;