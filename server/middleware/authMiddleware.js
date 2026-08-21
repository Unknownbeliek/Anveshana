const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized. No session token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid or expired token.' });
  }
};

const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const User = require('../models/User'); // lazy loaded to avoid circular deps if any
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found.' });
      }
      
      if (user.role !== requiredRole) {
        return res.status(403).json({ success: false, message: `Forbidden. Requires ${requiredRole} access.` });
      }

      // Keep full user context attached for downstream controllers
      req.userContext = user;
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error verifying role.' });
    }
  };
};

module.exports = {
  authenticate,
  requireRole
};
