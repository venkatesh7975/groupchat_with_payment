const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  console.log('Auth middleware - cookies:', req.cookies);
  console.log('Auth middleware - headers:', req.headers);
  
  // Check for token in cookies first, then in Authorization header
  let token = req.cookies?.token;
  
  if (!token) {
    // Check Authorization header as fallback
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - auth header:', authHeader);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Auth middleware - token from header:', token.substring(0, 20) + '...');
    }
  }

  if (!token) {
    console.log('Auth middleware - no token found');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    console.log('Auth middleware - verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Auth middleware - token decoded, userId:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('Auth middleware - user not found for userId:', decoded.userId);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('Auth middleware - user found:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('Auth middleware - JWT verification error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken
}; 