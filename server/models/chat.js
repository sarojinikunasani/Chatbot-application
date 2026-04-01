const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // "user" or "bot"
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  chatSessionId: { type: String }, // Optional: to group messages by session
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
