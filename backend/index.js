const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');
const postRoutes = require('./routes/post');
const commentRoutes = require('./routes/comment');
const userRoutes = require('./routes/user');
const notificationRoutes = require('./routes/notification');
const path = require('path');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://mern-socialmedia-app-frontend.onrender.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://mern-socialmedia-app-frontend.onrender.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.locals.io = io;

// Only handle non-API routes with the SPA fallback
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB connected');
    
    // Create test users if they don't exist
    const testUsers = [
      { name: 'John Doe', email: 'john@example.com', password: '12345678' },
      { name: 'Jane Smith', email: 'jane@example.com', password: '12345678' },
      { name: 'Bob Wilson', email: 'bob@example.com', password: '12345678' },
      { name: 'Alice Johnson', email: 'alice@example.com', password: '12345678' },
      { name: 'Charlie Brown', email: 'charlie@example.com', password: '12345678' }
    ];
    
    for (const userData of testUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({ 
          name: userData.name, 
          email: userData.email, 
          password: hashedPassword 
        });
        console.log('Test user created:', userData.email);
      }
    }
    
    console.log('Database initialization complete');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('FlashChat Backend Running');
});

// TODO: Add routes for auth, chat, message

// Enhanced Socket.IO setup
io.on('connection', (socket) => {
  // Authenticate user and join their room for notifications
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    console.log('Socket connection attempt with token:', token ? 'present' : 'missing');
    if (token) {
      const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
      if (decoded && decoded.id) {
        socket.join(decoded.id);
        console.log('User authenticated and joined room:', decoded.id);
      } else {
        console.log('Invalid token for socket connection');
      }
    } else {
      console.log('No token provided for socket connection');
    }
  } catch (e) { 
    console.log('Socket authentication error:', e.message);
  }
  console.log('A user connected:', socket.id);

  // Join a chat room (private or group)
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Send a message to a chat (private or group)
  socket.on('sendMessage', ({ chatId, message }) => {
    // Broadcast to all users in the chat, including sender
    io.to(chatId).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
