const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const onlineUsers = new Map(); // userId -> socket

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('Socket auth attempt - token:', token ? 'present' : 'missing');
    
    if (!token) {
      console.log('Socket auth failed: No token provided');
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Socket auth - decoded userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    console.log('Socket auth - user found:', !!user, 'isGroupMember:', user?.isGroupMember);
    
    if (!user || !user.isGroupMember) {
      console.log('Socket auth failed: User not found or not a group member');
      return next(new Error('Access denied'));
    }
    
    socket.user = user;
    console.log('Socket auth successful for user:', user.name);
    next();
  } catch (error) {
    console.log('Socket auth error:', error.message);
    next(new Error('Authentication error'));
  }
};

const handleSocketConnection = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const user = socket.user;
    onlineUsers.set(user._id.toString(), socket);
    
    // Join group chat room
    socket.join('group-chat');
    
    // Broadcast user joined
    socket.to('group-chat').emit('userJoined', {
      userId: user._id,
      name: user.name,
      profilePic: user.profilePic
    });
    
    // Send current online users to new user
    const onlineUsersList = Array.from(onlineUsers.keys()).map(userId => {
      const userSocket = onlineUsers.get(userId);
      return {
        userId: userSocket.user._id,
        name: userSocket.user.name,
        profilePic: userSocket.user.profilePic
      };
    });
    socket.emit('onlineUsers', onlineUsersList);
    
    // Handle text messages
    socket.on('sendMessage', async (messageData) => {
      try {
        const { message } = messageData;
        
        if (!message || message.trim().length === 0) {
          socket.emit('messageError', { message: 'Message cannot be empty' });
          return;
        }

        // Save message to database
        const newMessage = new Message({
          userId: user._id,
          userName: user.name,
          userProfilePic: user.profilePic,
          message: message.trim(),
          messageType: 'text',
          room: 'group-chat'
        });

        await newMessage.save();
        await newMessage.populate('userId', 'name profilePic');

        // Broadcast to all users
        io.to('group-chat').emit('newMessage', {
          _id: newMessage._id,
          userId: user._id,
          name: user.name,
          profilePic: user.profilePic,
          message: newMessage.message,
          messageType: 'text',
          timestamp: newMessage.createdAt
        });
        
      } catch (error) {
        console.error('Message save error:', error);
        socket.emit('messageError', { message: 'Failed to send message' });
      }
    });
    
    // Handle file uploads
    socket.on('uploadFile', async (fileData) => {
      try {
        const { file, fileName, fileType } = fileData;
        
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
        
        const result = await streamUpload(Buffer.from(file, 'base64'));
        
        // Save message to database
        const newMessage = new Message({
          userId: user._id,
          userName: user.name,
          userProfilePic: user.profilePic,
          message: fileName,
          messageType: 'file',
          fileData: {
            fileName: fileName,
            fileUrl: result.secure_url,
            fileType: fileType
          },
          room: 'group-chat'
        });

        await newMessage.save();
        await newMessage.populate('userId', 'name profilePic');
        
        // Broadcast file to all users
        io.to('group-chat').emit('newMessage', {
          _id: newMessage._id,
          userId: user._id,
          name: user.name,
          profilePic: user.profilePic,
          message: {
            fileName: fileName,
            fileUrl: result.secure_url,
            fileType: fileType
          },
          messageType: 'file',
          timestamp: newMessage.createdAt
        });
        
      } catch (error) {
        console.error('File upload error:', error);
        socket.emit('uploadError', { message: 'File upload failed' });
      }
    });

    // Handle message deletion
    socket.on('deleteMessage', async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('deleteError', { message: 'Message not found' });
          return;
        }

        // Check if user owns the message
        if (message.userId.toString() !== user._id.toString()) {
          socket.emit('deleteError', { message: 'You can only delete your own messages' });
          return;
        }

        await Message.findByIdAndDelete(messageId);
        
        // Broadcast deletion to all users
        io.to('group-chat').emit('messageDeleted', { messageId });
        
      } catch (error) {
        console.error('Message deletion error:', error);
        socket.emit('deleteError', { message: 'Failed to delete message' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      onlineUsers.delete(user._id.toString());
      socket.to('group-chat').emit('userLeft', {
        userId: user._id,
        name: user.name
      });
    });
  });
};

module.exports = {
  handleSocketConnection
}; 