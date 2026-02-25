const asyncHandler = require('express-async-handler');
const Donation = require('../models/Donation');
const User = require('../models/User');
const admin = require('firebase-admin'); // 👉 NEW: Imported Firebase Admin

// 👉 INITIALIZE FIREBASE USING RENDER ENVIRONMENT VARIABLE
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('🔥 Firebase Admin Initialized successfully in Donations');
    } else {
      console.log('⚠️ FIREBASE_SERVICE_ACCOUNT env var missing. Push notifications disabled.');
    }
  } catch (error) {
    console.log('⚠️ Firebase Admin setup failed:', error.message);
  }
}

const createDonation = asyncHandler(async (req, res) => {
  const { listingType, category, title, description, quantity, addressText, condition, foodType, expiryDate, pickupTime, bookAuthor, isEmergency, bloodGroup, lat, lng } = req.body;
  
  // 👉 Cloudinary puts the secure web URL directly into req.file.path
  let imageUrl = req.file ? req.file.path : ''; 
  const pickupPIN = Math.floor(1000 + Math.random() * 9000).toString();

  // 👉 We securely parse the GPS coordinates from the frontend
  const parsedLat = parseFloat(lat) || 0;
  const parsedLng = parseFloat(lng) || 0;

  const isCriticalEmergency = isEmergency === 'true' || isEmergency === true;

  const donation = await Donation.create({
    donorId: req.user._id,
    listingType: listingType || 'donation',
    category, title, description, quantity,
    condition, foodType, expiryDate, pickupTime, bookAuthor, 
    pickupPIN, 
    image: imageUrl,
    isEmergency: isCriticalEmergency,
    bloodGroup,
    // 👉 Now users actually show up on the map!
    location: { type: 'Point', coordinates: [parsedLng, parsedLat], addressText }
  });

  // 👉 NEW: FIREBASE PUSH NOTIFICATION FOR SOS BLASTS
  if (isCriticalEmergency) {
    try {
      // Find potential heroes who have active tokens
      const potentialSaviors = await User.find({
        activeRole: 'donor',
        _id: { $ne: req.user._id }, // Don't ping the person asking for help
        fcmToken: { $exists: true, $ne: null }
      });

      const tokens = potentialSaviors.map(u => u.fcmToken);

      if (tokens.length > 0) {
        const message = {
          notification: {
            title: `🚨 CRITICAL EMERGENCY: ${bloodGroup || 'Help'} Needed!`,
            body: `${title} near ${addressText}. Open HopeLink to respond now!`,
          },
          tokens: tokens,
        };

        admin.messaging().sendEachForMulticast(message)
          .then(response => console.log(`🔥 Firebase SOS Blast: Sent to ${response.successCount} locked phones.`))
          .catch(error => console.error('Firebase SOS Blast Error:', error));
      }
    } catch (pushError) {
      console.error('Failed to process push notifications:', pushError);
      // We don't throw an error here so the donation still saves successfully!
    }
  }
  
  res.status(201).json(donation);
});

// 👉 UPGRADED: Added Chunking (Pagination) to protect server memory
const getDonations = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12; // Send 12 items at a time
  const skip = (page - 1) * limit;

  let query = { status: { $ne: 'fulfilled' } };

  // If the frontend sends GPS coordinates, sort/find nearby!
  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 50000 // 50km radius for items
      }
    };
  }

  const donations = await Donation.find(query)
    .populate('donorId', 'name profilePic addressText phone')
    .populate('requestedBy', 'name profilePic')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Tell the frontend if there is more data to fetch
  const total = await Donation.countDocuments(query);
  const hasMore = total > skip + donations.length;

  res.json({ donations, hasMore });
});

// 👉 UPGRADED: Added Chunking (Pagination) to protect server memory
const getNearbyFeed = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const donations = await Donation.find({ status: { $ne: 'fulfilled' } })
    .populate('donorId', 'name profilePic addressText points rank rating totalRatings phone')
    .populate('requestedBy', 'name profilePic') 
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Donation.countDocuments({ status: { $ne: 'fulfilled' } });
  const hasMore = total > skip + donations.length;

  res.json({ donations, hasMore });
});

const requestItem = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) { res.status(404); throw new Error('Item not found'); }
  if (donation.status !== 'active') { res.status(400); throw new Error('Donor is currently assisting someone else'); }
  if (donation.donorId.toString() === req.user._id.toString()) { res.status(400); throw new Error('You cannot request your own item'); }
  if (donation.requestedBy.includes(req.user._id)) { res.status(400); throw new Error('You have already requested this item'); }

  donation.requestedBy.push(req.user._id);
  await donation.save();

  // Notify Donor via Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to(donation.donorId.toString()).emit('new_request_notification', {
      donationId: donation._id,
      title: donation.title,
      requesterName: req.user.name
    });
  }

  res.status(200).json({ message: 'Request sent to donor!', requestedBy: donation.requestedBy });
});

const approveRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const donation = await Donation.findById(req.params.id);

  if (!donation) { res.status(404); throw new Error('Item not found'); }
  if (donation.donorId.toString() !== req.user._id.toString()) { res.status(401); throw new Error('Only the donor can approve requests'); }
  if (donation.status !== 'active') { res.status(400); throw new Error('This item is already pending or fulfilled'); }
  if (!donation.requestedBy.includes(receiverId)) { res.status(400); throw new Error('This user is not on the request list'); }

  donation.receiverId = receiverId;
  donation.status = 'pending'; 
  await donation.save();

  const chatRoomId = `${donation._id}_${receiverId}`;

  // Notify Receiver via Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to(receiverId.toString()).emit('request_approved', {
      donationId: donation._id,
      title: donation.title,
      donorName: req.user.name,
      chatRoomId: chatRoomId
    });
  }

  res.status(200).json({ message: 'Request approved successfully!', chatRoomId, donation });
});

// THE NEW EMERGENCY HANDLER
const acceptSOS = asyncHandler(async (req, res) => {
  const donationId = req.params.id;
  const heroId = req.user._id;

  const sosRequest = await Donation.findById(donationId).populate('donorId', 'name phone profilePic');

  if (!sosRequest) { res.status(404); throw new Error('Emergency request not found.'); }
  if (!sosRequest.isEmergency) { res.status(400); throw new Error('This is not an emergency listing.'); }
  if (sosRequest.status !== 'active') { res.status(400); throw new Error('Someone else is already responding to this emergency!'); }

  // Lock the request instantly to the hero
  sosRequest.receiverId = heroId;
  sosRequest.status = 'pending'; 
  await sosRequest.save();

  res.status(200).json(sosRequest);
});

const markFulfilled = asyncHandler(async (req, res) => {
  const { pin, rating } = req.body;
  const donation = await Donation.findById(req.params.id);
  
  if (!donation || donation.pickupPIN !== pin) {
    res.status(400); throw new Error('Incorrect OTP');
  }

  donation.status = 'fulfilled'; 
  await donation.save();

  // Update Donor
  const donor = await User.findById(donation.donorId);
  donor.points += 50;
  donor.donationsCount += 1;
  if (donor.points > 500) donor.rank = 'Community Hero';
  if (donor.points > 1000) donor.rank = 'Guardian Angel';
  await donor.save();

  // Update Receiver & Apply Rating
  if (donation.receiverId) {
    const receiver = await User.findById(donation.receiverId);
    receiver.points += 20;
    receiver.requestsCount += 1;
    
    if (rating) {
      const newTotal = receiver.totalRatings + 1;
      const newAverage = ((receiver.rating * receiver.totalRatings) + Number(rating)) / newTotal;
      receiver.rating = Number(newAverage.toFixed(1)); 
      receiver.totalRatings = newTotal;
    }
    await receiver.save();
  }

  res.json({ message: "Handshake Successful", pointsEarned: 50 });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await User.find({})
    .select('name profilePic points rank donationsCount rating totalRatings')
    .sort({ points: -1 })
    .limit(10);
  res.json(topUsers);
});

const getMyHistory = asyncHandler(async (req, res) => {
  const donations = await Donation.find({ 
    $or: [{ donorId: req.user._id }, { receiverId: req.user._id }] 
  }).sort({ createdAt: -1 });
  res.json(donations);
});

const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation || donation.donorId.toString() !== req.user.id) {
    res.status(401); throw new Error('Not authorized');
  }
  await donation.deleteOne();
  res.json({ id: req.params.id });
});

module.exports = { 
  createDonation, 
  getDonations,    
  getNearbyFeed, 
  getMyHistory, 
  deleteDonation, 
  markFulfilled, 
  requestItem,     
  approveRequest, 
  acceptSOS,       
  getLeaderboard 
};