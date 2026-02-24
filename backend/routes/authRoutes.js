const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  toggleRole, 
  googleLogin, 
  updateProfile, 
  savePushSubscription, 
  getMe,
  updateLocation,       
  getNearbyDonors,      
  sendEmergencyBlast,
  respondToBlast,
  forgotPassword, // 👉 NEWLY IMPORTED
  resetPassword   // 👉 NEWLY IMPORTED
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Standard Auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

// Password Reset Routes (Public)
router.post('/forgotpassword', forgotPassword); // 👉 Endpoint for sending email
router.post('/resetpassword/:id/:token', resetPassword); // 👉 Endpoint for saving new password

// Profile & Role Management
router.put('/role', protect, toggleRole);
router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getMe);
router.post('/subscribe', protect, savePushSubscription);

// Map & Radar Routes
router.put('/location', protect, updateLocation);
router.get('/nearby-donors', protect, getNearbyDonors);

// Emergency Blast & Response Routes
router.post('/emergency-blast', protect, sendEmergencyBlast);
router.post('/respond-blast/:id', protect, respondToBlast);

module.exports = router;