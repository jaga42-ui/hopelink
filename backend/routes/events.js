const express = require('express');
const router = express.Router();
const { createEvent, getEvents, deleteEvent, updateEvent } = require('../controllers/eventController'); // 👉 ADDED updateEvent
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Assuming you have a multer/cloudinary middleware

router.route('/')
  .get(protect, getEvents)
  .post(protect, upload.single('image'), createEvent);

router.route('/:id')
  .delete(protect, deleteEvent)
  .put(protect, upload.single('image'), updateEvent); // 👉 ADDED the PUT route for editing

module.exports = router;