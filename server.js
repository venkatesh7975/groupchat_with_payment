const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const http = require('http');

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
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ✅ Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',                    // local frontend (Vite dev server)
  'http://localhost:3000',                    // alternative local frontend port
  'https://groupchat-frontend.vercel.app',    // production frontend (Vercel)
  'https://your-frontend-domain.com'          // add your actual frontend domain here
];

// ✅ CORS Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman) or allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow any origin for easier testing
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// ✅ Other middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Connect to MongoDB
connectDB();

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chat', groupChatRoutes);

// ✅ Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow any origin for easier testing
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  }
});

// ✅ Handle socket connections
handleSocketConnection(io);

// ✅ Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
