const asyncHandler = require("express-async-handler");
const Donation = require("../models/Donation");
const User = require("../models/User");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin Initialized successfully in Donations");
    } else {
      console.log(
        "⚠️ FIREBASE_SERVICE_ACCOUNT env var missing. Push notifications disabled.",
      );
    }
  } catch (error) {
    console.log("⚠️ Firebase Admin setup failed:", error.message);
  }
}

const createDonation = asyncHandler(async (req, res) => {
  const {
    listingType,
    category,
    title,
    description,
    quantity,
    addressText,
    condition,
    foodType,
    expiryDate,
    pickupTime,
    bookAuthor,
    isEmergency,
    bloodGroup,
    lat,
    lng,
  } = req.body;

  let imageUrl = req.file ? req.file.path : "";
  const pickupPIN = Math.floor(1000 + Math.random() * 9000).toString();

  const parsedLat = parseFloat(lat) || 0;
  const parsedLng = parseFloat(lng) || 0;

  const isCriticalEmergency = isEmergency === "true" || isEmergency === true;

  const newDonation = await Donation.create({
    donorId: req.user._id,
    listingType: listingType || "donation",
    category,
    title,
    description,
    quantity,
    condition,
    foodType,
    expiryDate,
    pickupTime,
    bookAuthor,
    pickupPIN,
    image: imageUrl,
    isEmergency: isCriticalEmergency,
    bloodGroup,
    location: {
      type: "Point",
      coordinates: [parsedLng, parsedLat],
      addressText,
    },
  });

  // Fetch the full populated donation to send back to the frontend UI
  const populatedDonation = await Donation.findById(newDonation._id)
    .populate("donorId", "name profilePic addressText")
    .populate("requestedBy", "name profilePic");

  // 👉 1. REAL-TIME: BROADCAST NEW LISTING TO EVERYONE ONLINE
  const io = req.app.get("io");
  if (io) {
    io.emit("new_listing", populatedDonation);
  }

  // FIREBASE PUSH NOTIFICATION FOR SOS BLASTS
  if (isCriticalEmergency) {
    try {
      const potentialSaviors = await User.find({
        activeRole: "donor",
        _id: { $ne: req.user._id },
        fcmToken: { $exists: true, $ne: null },
      });

      const tokens = potentialSaviors.map((u) => u.fcmToken);

      if (tokens.length > 0) {
        const message = {
          notification: {
            title: `🚨 CRITICAL EMERGENCY: ${bloodGroup || "Help"} Needed!`,
            body: `${title} near ${addressText}. Open HopeLink to respond now!`,
          },
          tokens: tokens,
        };

        admin
          .messaging()
          .sendEachForMulticast(message)
          .then((response) =>
            console.log(
              `🔥 Firebase SOS Blast: Sent to ${response.successCount} locked phones.`,
            ),
          )
          .catch((error) => console.error("Firebase SOS Blast Error:", error));
      }
    } catch (pushError) {
      console.error("Failed to process push notifications:", pushError);
    }
  }

  res.status(201).json(populatedDonation);
});

const getDonations = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  let query = { status: { $ne: "fulfilled" } };

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 50000,
      },
    };
  }

  const donations = await Donation.find(query)
    .populate("donorId", "name profilePic addressText phone")
    .populate("requestedBy", "name profilePic")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Donation.countDocuments(query);
  const hasMore = total > skip + donations.length;

  res.json({ donations, hasMore });
});

const getNearbyFeed = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const donations = await Donation.find({ status: { $ne: "fulfilled" } })
    .populate(
      "donorId",
      "name profilePic addressText points rank rating totalRatings phone",
    )
    .populate("requestedBy", "name profilePic")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Donation.countDocuments({ status: { $ne: "fulfilled" } });
  const hasMore = total > skip + donations.length;

  res.json({ donations, hasMore });
});

const requestItem = asyncHandler(async (req, res) => {
  let donation = await Donation.findById(req.params.id);

  if (!donation) {
    res.status(404);
    throw new Error("Item not found");
  }

  // 👉 THE OPEN GRID FIX: Check for fulfilled, not active
  if (donation.status === "fulfilled") {
    res.status(400);
    throw new Error("This mission has already been completed.");
  }

  if (donation.donorId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot request your own item");
  }
  if (donation.requestedBy.includes(req.user._id)) {
    res.status(400);
    throw new Error("You have already requested this item");
  }

  donation.requestedBy.push(req.user._id);
  await donation.save();

  // Refetch the donation to get populated fields for the UI
  const updatedDonation = await Donation.findById(donation._id)
    .populate("donorId", "name profilePic addressText phone")
    .populate("requestedBy", "name profilePic");

  const io = req.app.get("io");
  if (io) {
    // Notify the specific donor
    io.to(donation.donorId.toString()).emit("new_request_notification", {
      donationId: donation._id,
      title: donation.title,
      requesterName: req.user.name,
    });

    // 👉 2. REAL-TIME: Update the UI for everyone
    io.emit("listing_updated", updatedDonation);
  }

  res.status(200).json({
    message: "Request sent to donor!",
    requestedBy: donation.requestedBy,
  });
});

const approveRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  let donation = await Donation.findById(req.params.id);

  if (!donation) {
    res.status(404);
    throw new Error("Item not found");
  }
  if (donation.donorId.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Only the donor can approve requests");
  }

  // 👉 THE OPEN GRID FIX: Check for fulfilled
  if (donation.status === "fulfilled") {
    res.status(400);
    throw new Error("This mission has already been completed.");
  }

  if (!donation.requestedBy.includes(receiverId)) {
    res.status(400);
    throw new Error("This user is not on the request list");
  }

  donation.receiverId = receiverId;
  donation.status = "pending";
  await donation.save();

  // Refetch the donation to get populated fields
  const updatedDonation = await Donation.findById(donation._id)
    .populate("donorId", "name profilePic addressText phone")
    .populate("requestedBy", "name profilePic");

  const chatRoomId = `${donation._id}_${receiverId}`;

  const io = req.app.get("io");
  if (io) {
    // Notify the receiver privately
    io.to(receiverId.toString()).emit("request_approved", {
      donationId: donation._id,
      title: donation.title,
      donorName: req.user.name,
      chatRoomId: chatRoomId,
    });

    // 👉 3. REAL-TIME: Update the UI globally
    io.emit("listing_updated", updatedDonation);
  }

  res.status(200).json({
    message: "Request approved successfully!",
    chatRoomId,
    donation: updatedDonation,
  });
});

const acceptSOS = asyncHandler(async (req, res) => {
  const donationId = req.params.id;
  const heroId = req.user._id;

  let sosRequest = await Donation.findById(donationId).populate(
    "donorId",
    "name phone profilePic",
  );

  if (!sosRequest) {
    res.status(404);
    throw new Error("Emergency request not found.");
  }
  if (!sosRequest.isEmergency) {
    res.status(400);
    throw new Error("This is not an emergency listing.");
  }

  // 👉 THE OPEN GRID FIX FOR SOS:
  // We ONLY block if the emergency is already fulfilled/completed.
  // We DO NOT block if it's 'active' or 'pending', allowing multiple heroes to respond!
  if (sosRequest.status === "fulfilled") {
    res.status(400);
    throw new Error("This emergency has already been resolved!");
  }

  if (sosRequest.donorId._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot respond to your own SOS");
  }

  // Add the hero to the requestedBy array if they aren't already in it
  if (!sosRequest.requestedBy.includes(heroId)) {
    sosRequest.requestedBy.push(heroId);
  }

  sosRequest.receiverId = heroId;
  sosRequest.status = "pending";
  await sosRequest.save();

  const updatedDonation = await Donation.findById(donationId)
    .populate("donorId", "name profilePic addressText phone")
    .populate("requestedBy", "name profilePic");

  const io = req.app.get("io");
  if (io) {
    // 👉 REAL-TIME: Update the UI instantly
    io.emit("listing_updated", updatedDonation);
  }

  res.status(200).json(sosRequest);
});

const markFulfilled = asyncHandler(async (req, res) => {
  const { pin, rating } = req.body;
  const donation = await Donation.findById(req.params.id);

  if (!donation || donation.pickupPIN !== pin) {
    res.status(400);
    throw new Error("Incorrect OTP");
  }

  donation.status = "fulfilled";
  await donation.save();

  // Update Donor
  const donor = await User.findById(donation.donorId);
  donor.points += 50;
  donor.donationsCount += 1;
  if (donor.points > 500) donor.rank = "Community Hero";
  if (donor.points > 1000) donor.rank = "Guardian Angel";
  await donor.save();

  // Update Receiver & Apply Rating
  if (donation.receiverId) {
    const receiver = await User.findById(donation.receiverId);
    receiver.points += 20;
    receiver.requestsCount += 1;

    if (rating) {
      const newTotal = receiver.totalRatings + 1;
      const newAverage =
        (receiver.rating * receiver.totalRatings + Number(rating)) / newTotal;
      receiver.rating = Number(newAverage.toFixed(1));
      receiver.totalRatings = newTotal;
    }
    await receiver.save();
  }

  const io = req.app.get("io");
  if (io) {
    // 👉 REAL-TIME: Completely remove fulfilled items from the feed
    io.emit("listing_deleted", donation._id);
  }

  res.json({ message: "Handshake Successful", pointsEarned: 50 });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await User.find({})
    .select("name profilePic points rank donationsCount rating totalRatings")
    .sort({ points: -1 })
    .limit(10);
  res.json(topUsers);
});

const getMyHistory = asyncHandler(async (req, res) => {
  const donations = await Donation.find({
    $or: [{ donorId: req.user._id }, { receiverId: req.user._id }],
  }).sort({ createdAt: -1 });
  res.json(donations);
});

const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation || donation.donorId.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized");
  }
  await donation.deleteOne();

  // 👉 4. REAL-TIME: Instantly wipe deleted posts off the screen
  const io = req.app.get("io");
  if (io) {
    io.emit("listing_deleted", req.params.id);
  }

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
  getLeaderboard,
};
