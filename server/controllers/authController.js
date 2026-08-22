const crypto = require('crypto');
const User = require('../models/User');
const { store, getIsConnectedToMongo } = require('../config/db');

// Native JWT token generator with zero external dependencies
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'anveshana_jwt_secret_key_2026';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ id: userId, exp: Math.floor(Date.now() / 1000) + (24 * 3600) })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};

const login = async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ success: false, message: 'Login ID and password are required.' });
  }

  try {
    let user = null;

    if (getIsConnectedToMongo()) {
      user = await User.findOne({ loginId });
      if (!user || user.status !== 'active') {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your login ID and password.' });
      }
    } else {
      // In-Memory Mode fallback
      user = store.users.find(u => u.loginId.toLowerCase() === loginId.toLowerCase());
      if (!user) {
        // Auto-provision demo user if matched pattern
        let autoRole = 'farmer';
        if (loginId.startsWith('AGT') || loginId.startsWith('OPR-CENT')) autoRole = 'agent';
        else if (loginId.startsWith('QC') || loginId.startsWith('OPR-SILO')) autoRole = 'factory';
        else if (loginId.startsWith('AUD')) autoRole = 'auditor';

        user = {
          _id: `65f5e0${Date.now().toString(16).slice(-18)}`,
          loginId,
          role: autoRole,
          name: `${autoRole.toUpperCase()} User (${loginId})`,
          linkedFarmerId: autoRole === 'farmer' ? loginId : null,
          status: 'active'
        };
        store.users.push(user);
      }
    }

    const token = generateToken(user._id);

    // Set cookie header
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);

    res.json({
      success: true,
      user: {
        loginId: user.loginId,
        name: user.name,
        role: user.role,
        linkedFarmerId: user.linkedFarmerId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

const me = async (req, res) => {
  try {
    let user = null;
    if (getIsConnectedToMongo()) {
      user = await User.findById(req.user.id).select('-passwordHash');
    } else {
      user = store.users.find(u => u._id === req.user.id);
    }

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'User not found or disabled.' });
    }

    res.json({
      success: true,
      user: {
        loginId: user.loginId,
        name: user.name,
        role: user.role,
        linkedFarmerId: user.linkedFarmerId
      }
    });
  } catch (error) {
    console.error('Me auth error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving user.' });
  }
};

const logout = (req, res) => {
  res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = {
  login,
  me,
  logout
};
