const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getDashboardStats, 
  getAllUsers, 
  getAllListings, 
  deleteUser, 
  deleteListing,
  toggleAdminRole // 👉 NEW IMPORT
} = require('../controllers/adminController');

const adminGuard = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'SECURITY BREACH: Not authorized as Admin' });
  }
};

router.use(protect, adminGuard);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/listings', getAllListings);
router.delete('/users/:id', deleteUser);
router.delete('/listings/:id', deleteListing);

// 👉 NEW ROUTE
router.patch('/users/:id/role', toggleAdminRole); 

module.exports = router;