const crypto = require('crypto');
const { store, getIsConnectedToMongo } = require('../config/db');

const verifyToken = (token) => {
  if (!token || typeof token !== 'string') throw new Error('Invalid token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token structure');
  const [header, payload, signature] = parts;
  const secret = process.env.JWT_SECRET || 'anveshana_jwt_secret_key_2026';
  const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  if (signature !== expectedSignature) throw new Error('Invalid signature');
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return decoded;
};

const authenticate = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized. No session token provided.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid or expired token.' });
  }
};

const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      let user = null;
      if (getIsConnectedToMongo()) {
        const User = require('../models/User');
        user = await User.findById(req.user.id);
      } else {
        user = store.users.find(u => u._id === req.user.id);
      }
      
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
