const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const webpush = require('web-push');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Web Push
if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// 👉 THE BULLETPROOF CORS CONFIGURATION
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:5173", 
  "http://localhost:4173",
  process.env.FRONTEND_URL 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.includes('vercel.app'))) {
      callback(null, true);
    } else {
      // 👉 Fails gracefully instead of throwing a hard error!
      callback(null, false); 
    }
  },
  // 👉 'OPTIONS' added here
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], 
  // 👉 Explicitly allows your API headers to pass through
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true
};

// Apply CORS to Socket.io
const io = new Server(server, { cors: corsOptions });
app.set('io', io);

// Google Login Popup Fix
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Apply CORS to Express
app.use(cors(corsOptions));

// 👉 THE MAGIC BULLET: Explicitly handles the preflight 'OPTIONS' requests for all routes
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Socket.io Real-time Logic
io.on('connection', (socket) => {
  console.log('User Connected via Socket:', socket.id);

  socket.on('setup', (userId) => {
    socket.join(userId);
  });

  socket.on('join_chat', ({ userId, donationId }) => {
    socket.join(donationId);
  });

  socket.on('send_message', (data) => {
    socket.to(data.donationId).emit('receive_message', data);
    socket.to(data.receiver).emit('new_message_notification', data);
  });
  
  socket.on('mark_as_read', ({ donationId, readerId }) => {
    socket.to(donationId).emit('messages_read', { readerId });
  });

  socket.on('edit_message', (data) => {
    socket.to(data.donationId).emit('message_edited', data);
  });

  socket.on('delete_message', (data) => {
    socket.to(data.donationId).emit('message_deleted', data.id);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🔥 MongoDB Connected Securely');
    server.listen(PORT, () => console.log(`🚀 Master Server running on port ${PORT}`));
  })
  .catch((err) => console.log(err));