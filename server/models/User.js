const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  loginId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['farmer', 'agent', 'factory', 'auditor']
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  linkedFarmerId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
