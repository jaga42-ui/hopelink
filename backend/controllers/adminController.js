const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Donation = require('../models/Donation');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalDonations = await Donation.countDocuments({ listingType: 'donation' });
  const totalRequests = await Donation.countDocuments({ listingType: 'request' });
  const fulfilledItems = await Donation.countDocuments({ status: 'fulfilled' });

  res.json({ totalUsers, totalDonations, totalRequests, fulfilledItems });
});

// @desc    Get all users
// @route   GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc    Get all listings
// @route   GET /api/admin/listings
const getAllListings = asyncHandler(async (req, res) => {
  const listings = await Donation.find({}).populate('donorId', 'name email').sort({ createdAt: -1 });
  res.json(listings);
});

// @desc    Delete a user and their posts
// @route   DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    // Clean up their posts so the feed doesn't break
    await Donation.deleteMany({ donorId: user._id }); 
    await user.deleteOne();
    res.json({ message: 'User removed completely' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Force delete any listing
// @route   DELETE /api/admin/listings/:id
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Donation.findById(req.params.id);
  if (listing) {
    await listing.deleteOne();
    res.json({ message: 'Listing removed' });
  } else {
    res.status(404);
    throw new Error('Listing not found');
  }
});

// @desc    Toggle a user's Admin status
// @route   PATCH /api/admin/users/:id/role
const toggleAdminRole = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  // 🛡️ SUPER ADMIN PROTECTION: You cannot demote yourself
  if (targetUser._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change your own admin status.');
  }

  targetUser.isAdmin = !targetUser.isAdmin; // Flip the boolean
  await targetUser.save();

  // 👉 NEW: THE REAL-TIME TRIGGER!
  // Grab the io instance and emit directly to this specific user's secure room
  const io = req.app.get('io');
  if (io) {
    io.to(targetUser._id.toString()).emit('role_updated', {
      userId: targetUser._id.toString(),
      isAdmin: targetUser.isAdmin
    });
  }

  res.json({ 
    message: `${targetUser.name} is now ${targetUser.isAdmin ? 'an Admin' : 'a standard User'}`,
    isAdmin: targetUser.isAdmin 
  });
});

module.exports = { 
  getDashboardStats, 
  getAllUsers, 
  getAllListings, 
  deleteUser, 
  deleteListing, 
  toggleAdminRole
};