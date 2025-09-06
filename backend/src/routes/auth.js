import express from 'express';
import { 
  authenticateGoogle, 
  authenticateGoogleCallback, 
  generateToken 
} from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', authenticateGoogle);

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback', authenticateGoogleCallback, (req, res) => {
  const token = generateToken(req.user);
  
  // Redirect to frontend with token
  res.redirect(`${process.env.CLIENT_URL}/login/success?token=${token}`);
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', (req, res) => {
  // This route will be protected by the authenticateJwt middleware in index.js
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
    }
  });
});

export default router;
