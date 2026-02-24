const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String },
  activeRole: { type: String, enum: ['donor', 'receiver'], default: 'donor' },
  isAdmin: { type: Boolean, default: false },
  
  // Web Push Subscription
  pushSubscription: { type: Object, default: null },
  
  // Gamification & Trust
  points: { type: Number, default: 0 },
  donationsCount: { type: Number, default: 0 },
  requestsCount: { type: Number, default: 0 },
  rank: { type: String, default: 'Novice' },
  rating: { type: Number, default: 5.0 },
  totalRatings: { type: Number, default: 0 },
  
  // User Details
  phone: { type: String },
  bloodGroup: { type: String },
  addressText: { type: String },

  // 👉 NEW: Geospatial Location Tracking
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  }
}, { timestamps: true });

// 👉 NEW: This tells MongoDB to treat this field as a spherical Earth map
userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);