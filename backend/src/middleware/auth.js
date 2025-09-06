import passport from 'passport';
import jwt from 'jsonwebtoken';

export const authenticateJwt = passport.authenticate('jwt', { session: false });

export const authenticateGoogle = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

export const authenticateGoogleCallback = passport.authenticate('google', {
  session: false,
  failureRedirect: process.env.CLIENT_URL + '/login?error=google-auth-failed',
});

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};
