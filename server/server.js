require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');

// Route imports
const farmerRoutes = require('./routes/farmerRoutes');
const milkRoutes = require('./routes/milkRoutes');
const batchRoutes = require('./routes/batchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Attach socket.io instance to express app
app.set('socketio', io);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Anveshana Dairy Intelligence Engine',
    version: '2.0.0-PRODUCTION-SPEC',
    timestamp: new Date().toISOString()
  });
});

// WebSocket Connection Lifecycle
io.on('connection', (socket) => {
  console.log(`⚡ WebSocket Client Connected: ${socket.id}`);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`🔗 Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket Client Disconnected: ${socket.id}`);
  });
});

// Connect Database & Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 ANVESHANA (अन्वेषण) DAIRY INTELLIGENCE ENGINE ONLINE`);
    console.log(`📡 REST API Gateway: http://localhost:${PORT}`);
    console.log(`⚡ Socket.io Real-Time Pipeline Active on port ${PORT}`);
    console.log(`🛡️ Bharat Pashudhan / NDLM Mathematical Validation Ready`);
    console.log(`=======================================================`);
  });
});

module.exports = { app, server, io };
