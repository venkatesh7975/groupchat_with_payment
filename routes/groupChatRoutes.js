const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middlewares/auth');
const {
  getMessages,
  sendMessage,
  uploadFile,
  getOnlineUsers,
  deleteMessage
} = require('../controllers/groupChatController');

// Multer setup for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All routes require authentication and group membership
router.use(authenticateToken);

// Middleware to check if user is a group member
const checkGroupMembership = (req, res, next) => {
  if (!req.user.isGroupMember) {
    return res.status(403).json({ 
      message: 'You need to be a group member to access the chat' 
    });
  }
  next();
};

router.use(checkGroupMembership);

// Get chat messages
router.get('/messages', getMessages);

// Send text message
router.post('/messages', sendMessage);

// Upload file
router.post('/upload', upload.single('file'), uploadFile);

// Get online users
router.get('/online-users', getOnlineUsers);

// Delete message
router.delete('/messages/:messageId', deleteMessage);

module.exports = router; 