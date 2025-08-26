import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', (req, res, next) => {
  console.log('POST /register reached - Body:', req.body);
  console.log('POST /register - Content-Type:', req.get('content-type'));
  next();
}, register);

router.post('/login', (req, res, next) => {
  console.log('POST /login reached - Body:', req.body);
  next();
}, login);

router.get('/me', protect, getMe);

export default router;