const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userProfilePic: {
    type: String,
    default: null
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file'],
    default: 'text'
  },
  fileData: {
    fileName: String,
    fileUrl: String,
    fileType: String
  },
  room: {
    type: String,
    default: 'group-chat'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema); 