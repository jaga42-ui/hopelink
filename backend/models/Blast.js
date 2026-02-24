const mongoose = require('mongoose');

const blastSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  bloodGroup: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [lng, lat]
  },
  responses: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'on-the-way' },
    respondedAt: { type: Date, default: Date.now }
  }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Blast', blastSchema);