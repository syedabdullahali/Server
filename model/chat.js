const mongoose = require('mongoose');

// Define a schema for messages within a chat
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the user or admin model
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the user or admin model
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'], // Specify types of messages
    default: 'text',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Define a schema for a chat session
const chatSchema = new mongoose.Schema({
  participants: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to user or admin
    required: true,
  },
  participantsArray: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to user or admin
      required: true,
    },
  ],
  messages: [messageSchema], // Embed messages
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
