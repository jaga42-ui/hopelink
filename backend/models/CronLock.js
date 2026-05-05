const mongoose = require('mongoose');

const cronLockSchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: true,
    unique: true,
  },
  lockedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  }
});

// TTL Index to automatically unlock expired jobs
cronLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CronLock = mongoose.model('CronLock', cronLockSchema);

module.exports = CronLock;
