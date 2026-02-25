const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: { type: String, required: [true, 'Please add an event title'] },
    description: { type: String, required: [true, 'Please add an event description'] },
    category: {
      type: String,
      enum: ['Blood Camp', 'Food Drive', 'Clothes Drive', 'Fundraiser', 'General Announcement'],
      required: true,
    },
    eventDate: { type: Date, required: [true, 'Please add the event date'] },
    startTime: { type: String, required: [true, 'Please add a start time (e.g., 10:00 AM)'] },
    endTime: { type: String, required: [true, 'Please add an end time (e.g., 4:00 PM)'] },
    locationText: { type: String, required: [true, 'Please add the location address'] },
    
    // 👉 NEW: Geospatial Location for 10km mapping
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    
    image: { type: String, default: '' }
  },
  { timestamps: true }
);

// This index allows us to measure distances instantly
eventSchema.index({ location: '2dsphere' });

// 👉 NEW: AUTOMATIC CLEANUP (TTL Index)
// MongoDB will automatically delete the event 24 hours (86400 seconds) after the eventDate
eventSchema.index({ eventDate: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Event', eventSchema);