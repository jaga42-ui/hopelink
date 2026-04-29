const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// 👉 THE SCALE FIX: Compound Index for the new MongoDB Chat Aggregation Pipeline
messageSchema.index({ donationId: 1, createdAt: -1 });

// 👉 Query optimizers for fetching inbox messages directly based on User IDs
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);