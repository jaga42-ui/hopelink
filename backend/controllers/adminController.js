const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Donation = require('../models/Donation');
const moment = require('moment'); // Required for the 30-day growth graph

// @desc    Get platform statistics (Upgraded for Recharts & Moderation)
// @route   GET /api/admin/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalDonations = await Donation.countDocuments({ listingType: 'donation' });
  const totalRequests = await Donation.countDocuments({ listingType: 'request' });
  const fulfilledItems = await Donation.countDocuments({ status: 'fulfilled' });
  
  // Count active SOS emergencies
  const activeSOS = await Donation.countDocuments({ isEmergency: true, status: 'active' });

  // Generate 30-Day Growth Data for the Area Chart
  const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
  
  const dailyUsers = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Format data perfectly for Recharts X-Axis
  const growthData = dailyUsers.map(day => ({
    date: moment(day._id).format('MMM DD'),
    Users: day.count
  }));

  // 👉 NEW: Fetch any posts that have been flagged by the community for the Moderation Queue
  const reportedPosts = await Donation.find({ 'reports.0': { $exists: true } })
    .populate("donorId", "name email")
    .sort({ createdAt: -1 });

  res.json({ 
    totalUsers, 
    totalDonations, 
    totalRequests, 
    fulfilledItems,
    activeSOS,     // Sent to frontend pie chart
    growthData,    // Sent to frontend area chart
    reportedPosts  // 👉 Sent to frontend Moderation Queue
  });
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

  // THE REAL-TIME TRIGGER!
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

// 👉 THE RED BUTTON (Global WebSocket Broadcast)
// @route   POST /api/admin/broadcast
const sendBroadcast = asyncHandler(async (req, res) => {
  const { message, level } = req.body; 
  
  const io = req.app.get("io");
  if (io) {
    io.emit("global_alert", { message, level, timestamp: new Date() });
  }

  res.json({ success: true, message: "Broadcast transmitted to all active users." });
});

// 👉 RESOLVE COMMUNITY REPORTS
// @route   PATCH /api/admin/resolve-report/:id
const resolveReport = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'whitelist' or 'delete'
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (action === 'delete') {
    await donation.deleteOne();
    
    // Instantly wipe it from all active screens globally
    const io = req.app.get("io");
    if (io) io.emit("listing_deleted", req.params.id);
    
    res.json({ message: "Hostile transmission purged from network." });
  } else {
    // Whitelist it
    donation.reports = [];
    donation.status = 'active'; // Restore it to the feed
    await donation.save();
    res.json({ message: "Post whitelisted and reports cleared." });
  }
});

module.exports = { 
  getDashboardStats, 
  getAllUsers, 
  getAllListings, 
  deleteUser, 
  deleteListing, 
  toggleAdminRole,
  sendBroadcast, // 👉 Exported
  resolveReport  // 👉 Exported
};