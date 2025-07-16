const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import configurations
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const groupChatRoutes = require('./routes/groupChatRoutes');

// Import socket handler
const { handleSocketConnection } = require('./sockets/groupChat');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chat', groupChatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Create HTTP server and Socket.IO
const server = require('http').createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true
  }
});

// Initialize Socket.IO
handleSocketConnection(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 