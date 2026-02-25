const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const User = require('../models/User');
const admin = require('firebase-admin'); // 👉 Firebase for Push Notifications

// Initialize Firebase (Safety check)
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      });
    }
  } catch (error) { console.log('Firebase setup failed:', error.message); }
}

// @desc    Create a new organization event/drive
// @route   POST /api/events
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, eventDate, startTime, endTime, locationText, lat, lng } = req.body;
  let imageUrl = req.file ? req.file.path : ''; 

  if (!title || !description || !eventDate || !locationText || !lat || !lng) {
    res.status(400); throw new Error('Please fill all required event fields and provide GPS coordinates');
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  const event = await Event.create({
    organizationId: req.user._id,
    title, description, category, eventDate, startTime, endTime, locationText, image: imageUrl,
    location: { type: 'Point', coordinates: [parsedLng, parsedLat] }
  });

  // 👉 THE 10KM PUSH NOTIFICATION BLAST
  try {
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: 10000 
        }
      },
      _id: { $ne: req.user._id }, // Don't notify the person creating it
      fcmToken: { $exists: true, $ne: null }
    });

    const tokens = nearbyUsers.map(u => u.fcmToken);

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: `📅 Local Event: ${title}`,
          body: `Happening near you on ${new Date(eventDate).toLocaleDateString()}. Open HopeLink to view details.`,
        },
        tokens: tokens,
      };

      admin.messaging().sendEachForMulticast(message)
        .then(response => console.log(`🔥 Event Blast sent to ${response.successCount} nearby users.`))
        .catch(err => console.error('Firebase Event Push Error', err));
    }
  } catch (pushError) {
    console.error('Failed to process event push notifications', pushError);
  }

  // Populate so the frontend immediately shows the organizer's name/pic
  await event.populate('organizationId', 'name profilePic');
  
  res.status(201).json(event);
});

// @desc    Get all upcoming events within 10km
// @route   GET /api/events
const getEvents = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let query = { eventDate: { $gte: today } };

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 10000 // 10km radius
      }
    };
  }

  const events = await Event.find(query).populate('organizationId', 'name profilePic');
  res.json(events);
});

// @desc    Delete an event
// @route   DELETE /api/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) { res.status(404); throw new Error('Event not found'); }
  if (event.organizationId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401); throw new Error('Not authorized to delete this event');
  }

  await event.deleteOne();
  res.json({ id: req.params.id });
});

// 👉 NEW: Update an event (Allows organizations to edit their posts)
// @route   PUT /api/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) { res.status(404); throw new Error('Event not found'); }
  
  // Verify ownership (Admin can override)
  if (event.organizationId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401); throw new Error('Not authorized to edit this event');
  }

  const { title, description, category, eventDate, startTime, endTime, locationText, lat, lng } = req.body;
  let imageUrl = req.file ? req.file.path : event.image; // Keep old image if no new one uploaded

  // Update fields
  event.title = title || event.title;
  event.description = description || event.description;
  event.category = category || event.category;
  event.eventDate = eventDate || event.eventDate;
  event.startTime = startTime || event.startTime;
  event.endTime = endTime || event.endTime;
  event.locationText = locationText || event.locationText;
  event.image = imageUrl;

  // Update GPS if a new address was searched
  if (lat && lng) {
    event.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
  }

  const updatedEvent = await event.save();
  
  // Re-attach the organization profile pic/name so the frontend updates seamlessly
  await updatedEvent.populate('organizationId', 'name profilePic');
  
  res.json(updatedEvent);
});

// 👉 Make sure to export the new updateEvent function!
module.exports = { createEvent, getEvents, deleteEvent, updateEvent };