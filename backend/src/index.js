import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import messageRoutes from './routes/messages.js';

// Import middlewares
import { errorHandler } from './middleware/errorHandler.js';

// Import passport config
import './config/passport.js';

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO namespaces
const projectNamespace = io.of('/project');
const messageNamespace = io.of('/message');

// Socket.IO connection handling
projectNamespace.on('connection', (socket) => {
  console.log('[BACKEND] Client connected to project namespace, socket ID:', socket.id);
  
  // Join a project room
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`Client joined project room: ${projectId}`);
  });
  
  // Leave a project room
  socket.on('leave-project', (projectId) => {
    socket.leave(projectId);
    console.log(`Client left project room: ${projectId}`);
  });
  
  // Task updates
  socket.on('task-update', (data) => {
    socket.to(data.projectId).emit('task-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from project namespace');
  });
});

messageNamespace.on('connection', (socket) => {
  console.log('[BACKEND] Client connected to message namespace, socket ID:', socket.id);
  
  // Join a chat room
  socket.on('join-chat', (projectId) => {
    socket.join(projectId);
    console.log(`Client joined chat room: ${projectId}`);
  });
  
  // Leave a chat room
  socket.on('leave-chat', (projectId) => {
    socket.leave(projectId);
    console.log(`Client left chat room: ${projectId}`);
  });
  
  // New message
  socket.on('send-message', (data) => {
    socket.to(data.projectId).emit('new-message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from message namespace');
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motion-gpt')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
