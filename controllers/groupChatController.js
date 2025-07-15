const Message = require('../models/Message');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Get chat messages
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ room: 'group-chat' })
      .populate('userId', 'name profilePic')
      .sort({ createdAt: 1 }) // Oldest first for proper chat order
      .limit(50);

    // Format messages to match frontend expectations
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      userId: msg.userId._id,
      name: msg.userId.name,
      profilePic: msg.userId.profilePic,
      message: msg.message,
      messageType: msg.messageType,
      fileData: msg.fileData,
      timestamp: msg.createdAt
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Send text message
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const newMessage = new Message({
      userId: req.user._id,
      userName: req.user.name,
      userProfilePic: req.user.profilePic,
      message: message.trim(),
      messageType: 'text',
      room: 'group-chat'
    });

    await newMessage.save();

    // Populate user data
    await newMessage.populate('userId', 'name profilePic');

    res.json({ 
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Upload file
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: 'chat_files',
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx']
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    // Create message with file data
    const newMessage = new Message({
      userId: req.user._id,
      userName: req.user.name,
      userProfilePic: req.user.profilePic,
      message: req.file.originalname,
      messageType: 'file',
      fileData: {
        fileName: req.file.originalname,
        fileUrl: result.secure_url,
        fileType: req.file.mimetype
      },
      room: 'group-chat'
    });

    await newMessage.save();
    await newMessage.populate('userId', 'name profilePic');

    res.json({ 
      message: 'File uploaded successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

// Get online users
const getOnlineUsers = async (req, res) => {
  try {
    // This would typically come from Socket.IO state
    // For now, return empty array - will be populated by socket handler
    res.json({ onlineUsers: [] });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ message: 'Failed to get online users' });
  }
};

// Delete message (only by message owner)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns the message
    if (message.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(messageId);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  uploadFile,
  getOnlineUsers,
  deleteMessage
}; 