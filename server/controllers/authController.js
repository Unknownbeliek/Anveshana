const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '24h',
  });
};

const login = async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ success: false, message: 'Login ID and password are required.' });
  }

  try {
    const user = await User.findOne({ loginId });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your login ID and password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your login ID and password.' });
    }

    const token = generateToken(user._id);

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

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
    const user = await User.findById(req.user.id).select('-passwordHash');
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
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = {
  login,
  me,
  logout
};
