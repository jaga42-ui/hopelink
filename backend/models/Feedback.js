const mongoose = require("mongoose");
const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true },
  message: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model("Feedback", feedbackSchema);