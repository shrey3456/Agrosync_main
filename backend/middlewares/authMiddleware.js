import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// Middleware to authenticate JWT tokens
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    // Log for debugging
    console.log('Auth Header:', authHeader);

    // Check for Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Please provide a valid authentication token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      console.log
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log('Token decoded:', decoded);

      // Find user by id
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User not found or deleted' });
      }

      // Add user to request object
      req.user = {
        id: user.id, // Use _id to match MongoDB's ID field
        id: user.id,  // Keep this for backward compatibility
        email: user.email,
        role: user.role,
        name: user.name
      };

      console.log("User authenticated:", user.name || user.email, "- Role:", user.role);
      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

// Middleware to restrict routes based on user role
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};