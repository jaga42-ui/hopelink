const express = require('express');
const router = express.Router();
const { createEvent, getEvents, deleteEvent, updateEvent } = require('../controllers/eventController'); 
const { protect } = require('../middleware/authMiddleware');

// 👉 FIXED: Pointing to your existing Cloudinary setup!
const { upload } = require('../config/cloudinary'); 

router.route('/')
  .get(protect, getEvents)
  .post(protect, upload.single('image'), createEvent);

router.route('/:id')
  .delete(protect, deleteEvent)
  .put(protect, upload.single('image'), updateEvent);

module.exports = router;