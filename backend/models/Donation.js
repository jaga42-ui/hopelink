const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // The person who posted the item
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 👉 NEW: A list of everyone who clicked "I want this"
  requestedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // 👉 The ONE person who actually gets approved to receive it
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  listingType: { type: String, enum: ['donation', 'request'], default: 'donation', required: true },
  category: { type: String, enum: ['food', 'clothes', 'book', 'blood', 'other'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: String }, 
  
  condition: { type: String }, 
  foodType: { type: String }, 
  expiryDate: { type: Date }, 
  pickupTime: { type: String }, 
  bookAuthor: { type: String }, 
  
  pickupPIN: { type: String, required: true },
  image: { type: String }, 
  isEmergency: { type: Boolean, default: false },
  bloodGroup: { type: String },
  
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    addressText: { type: String }
  },
  
  // 👉 UPDATED: Matches your new flow (active -> pending -> fulfilled)
  status: { 
    type: String, 
    enum: ['active', 'pending', 'fulfilled'], 
    default: 'active' 
  }
}, { timestamps: true });

donationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Donation', donationSchema);