const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');
const path = require('path');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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
