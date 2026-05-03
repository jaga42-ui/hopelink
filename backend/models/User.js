const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String },
    activeRole: { type: String, enum: ["donor", "receiver", "ngo"], default: "donor" },
    isAdmin: { type: Boolean, default: false },

    // NGO Specific Fields
    organizationName: { type: String },
    isVerified: { type: Boolean, default: false }, // Crucial: NGOs must be approved before login

    // Web Push Subscription
    pushSubscription: { type: Object, default: null },
    fcmToken: { type: String },

    // Gamification & Trust
    points: { type: Number, default: 0 },
    donationsCount: { type: Number, default: 0 },
    requestsCount: { type: Number, default: 0 },
    rank: { type: String, default: "Novice" },
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },

    phone: { type: String },
    bloodGroup: { type: String },
    addressText: { type: String },
    isAvailable: { type: Boolean, default: true },
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },

    // Geospatial Tracking
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true },
);

// Geographic Radar Index
userSchema.index({ location: "2dsphere" });

// Leaderboard Sort Index
userSchema.index({ points: -1 });

// 👉 THE FIX: Admin Growth Graph Index (OOM Prevention)
userSchema.index({ createdAt: -1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);