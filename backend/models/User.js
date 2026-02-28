const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String },
    activeRole: { type: String, enum: ["donor", "receiver"], default: "donor" },
    isAdmin: { type: Boolean, default: false },

    // Web Push Subscription
    pushSubscription: { type: Object, default: null },

    // Gamification & Trust
    points: { type: Number, default: 0 },
    donationsCount: { type: Number, default: 0 },
    requestsCount: { type: Number, default: 0 },
    rank: { type: String, default: "Novice" },
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },

    // User Details
    phone: { type: String },
    bloodGroup: { type: String },
    addressText: { type: String },

    // 👉 Geospatial Location Tracking
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
  },
  { timestamps: true },
);

// 👉 This index is what allows the "Blood Radar" to find people by distance
userSchema.index({ location: "2dsphere" });

// 👉 THE FIX: PERFORMANCE INDEX FOR LEADERBOARD
// Makes sorting users by points instantaneous, even with 100,000 users.
userSchema.index({ points: -1 });

// 👉 Hashes password before saving to DB (Used in Register & Reset Password)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 👉 Renamed to match your Controller call
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
