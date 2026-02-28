const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getDashboardStats, 
  getAllUsers, 
  getAllListings, 
  deleteUser, 
  deleteListing,
  toggleAdminRole,
  sendBroadcast, // 👉 NEW IMPORT
  resolveReport  // 👉 NEW IMPORT
} = require('../controllers/adminController');

const adminGuard = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'SECURITY BREACH: Not authorized as Admin' });
  }
};

// 🛡️ Apply protection to ALL routes below
router.use(protect, adminGuard);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/listings', getAllListings);
router.delete('/users/:id', deleteUser);
router.delete('/listings/:id', deleteListing);
router.patch('/users/:id/role', toggleAdminRole); 

// 👉 THE NEW MISSION CONTROL ROUTES
router.post('/broadcast', sendBroadcast);
router.patch('/resolve-report/:id', resolveReport);

module.exports = router;