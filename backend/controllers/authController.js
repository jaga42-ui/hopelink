const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Blast = require("../models/Blast");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

// 👉 Initialize the Google OAuth Client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

// 👉 INITIALIZE FIREBASE USING RENDER ENVIRONMENT VARIABLE
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin Initialized successfully");
    } else {
      console.log(
        "⚠️ FIREBASE_SERVICE_ACCOUNT env var missing. Push notifications disabled.",
      );
    }
  } catch (error) {
    console.log("⚠️ Firebase Admin setup failed:", error.message);
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register new user
// @route   POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, activeRole, bloodGroup } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error("Please add all required fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email already registered");
  }

  // 👉 THE FIX: Provide a default geographic Point so Mongoose doesn't crash on the 2dsphere index!
  const user = await User.create({
    name,
    email,
    password,
    phone,
    bloodGroup: bloodGroup || undefined, // Allow optional blood group
    activeRole: activeRole || "donor",
    isAdmin: false,
    profilePic: "",
    addressText: "",
    location: {
      type: "Point",
      coordinates: [0, 0], // Default [lng, lat] to 0,0 until they turn on GPS
    },
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      activeRole: user.activeRole,
      isAdmin: user.isAdmin,
      profilePic: user.profilePic,
      addressText: user.addressText,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      activeRole: user.activeRole,
      isAdmin: user.isAdmin,
      profilePic: user.profilePic,
      bloodGroup: user.bloodGroup,
      addressText: user.addressText,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

// @desc    Toggle Role (Donor <-> Receiver)
// @route   PUT /api/auth/role
// @access  Private
const toggleRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.activeRole = user.activeRole === "donor" ? "receiver" : "donor";
  const updatedUser = await user.save();

  res.json({
    _id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    activeRole: updatedUser.activeRole,
    isAdmin: updatedUser.isAdmin,
    profilePic: updatedUser.profilePic,
    bloodGroup: updatedUser.bloodGroup,
    addressText: updatedUser.addressText,
    token: req.headers.authorization.split(" ")[1],
  });
});

// @desc    Authenticate via Google (Secure Authorization Code Flow)
// @route   POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    res.status(400);
    throw new Error("Authorization code not provided");
  }

  try {
    const { tokens } = await client.getToken({
      code,
      redirect_uri: "postmessage",
    });

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const securePass = `HopeLink_${Math.random().toString(36).slice(-8)}!`;
      user = await User.create({
        name: name || "New Hero",
        email,
        password: securePass,
        profilePic: picture || "",
        googleId,
        phone: "Not Provided",
        activeRole: "donor",
        points: 10,
        location: {
          type: "Point",
          coordinates: [0, 0], // Default [lng, lat]
        },
      });
    } else {
      if (!user.profilePic && picture) {
        user.profilePic = picture;
        await user.save();
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      activeRole: user.activeRole,
      isAdmin: user.isAdmin,
      profilePic: user.profilePic,
      bloodGroup: user.bloodGroup,
      addressText: user.addressText,
      points: user.points,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500);
    throw new Error("Google authentication failed. Please try again.");
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
    user.phone = req.body.phone || user.phone;
    user.addressText = req.body.addressText || user.addressText;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      activeRole: updatedUser.activeRole,
      isAdmin: updatedUser.isAdmin,
      bloodGroup: updatedUser.bloodGroup,
      phone: updatedUser.phone,
      addressText: updatedUser.addressText,
      token: req.headers.authorization.split(" ")[1],
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// 👉 NEW: Save User's Firebase Web Push Token
// @route   POST /api/auth/fcm-token
// @access  Private
const saveFCMToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.fcmToken = req.body.fcmToken;
  await user.save();
  res
    .status(200)
    .json({ message: "Device securely registered for lock-screen alerts." });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update User's Live GPS Location
// @route   PUT /api/auth/location
const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng, addressText } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    user.location = { type: "Point", coordinates: [lng, lat] };
    if (addressText) user.addressText = addressText;
    await user.save();
    res.json({ message: "Live location locked in." });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// The Blood Radar Search Engine
// @route   GET /api/auth/nearby-donors
const getNearbyDonors = asyncHandler(async (req, res) => {
  const { lat, lng, bloodGroup, distance = 15000 } = req.query;
  let query = {
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(distance),
      },
    },
    _id: { $ne: req.user._id },
    activeRole: "donor",
  };

  if (bloodGroup && bloodGroup !== "All") query.bloodGroup = bloodGroup;
  const donors = await User.find(query).select(
    "name profilePic bloodGroup addressText phone location rank rating",
  );
  res.json(donors);
});

// 👉 UPGRADED: Send Emergency Blast to nearby donors using Firebase
// @route   POST /api/auth/emergency-blast
const sendEmergencyBlast = asyncHandler(async (req, res) => {
  const { lat, lng, message, bloodGroup } = req.body;

  if (!lat || !lng || !message) {
    res.status(400);
    throw new Error("Location and message are required for a blast");
  }

  const blast = await Blast.create({
    requester: req.user._id,
    message,
    bloodGroup,
    location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
  });

  // Find users acting as donors within 20km who have an FCM Token
  const nearbyDonors = await User.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 20000,
      },
    },
    activeRole: "donor",
    _id: { $ne: req.user._id },
    fcmToken: { $exists: true, $ne: null },
  });

  const tokens = nearbyDonors.map((donor) => donor.fcmToken);

  // If we found nearby users with registered phones, hit Firebase!
  if (tokens.length > 0) {
    const pushMessage = {
      notification: {
        title: `🚨 URGENT: ${bloodGroup || "Help"} Needed Nearby`,
        body: message,
      },
      tokens: tokens,
    };

    admin
      .messaging()
      .sendEachForMulticast(pushMessage)
      .then((response) =>
        console.log(
          `🔥 Firebase Blast: Sent to ${response.successCount} devices.`,
        ),
      )
      .catch((error) => console.error("Firebase Blast Failed:", error));
  }

  res
    .status(200)
    .json({
      success: true,
      blastId: blast._id,
      recipients: nearbyDonors.length,
    });
});

// Respond to a Blast
// @route   POST /api/auth/respond-blast/:id
const respondToBlast = asyncHandler(async (req, res) => {
  const blast = await Blast.findById(req.params.id);
  if (!blast) {
    res.status(404);
    throw new Error("SOS alert no longer active");
  }

  const alreadyResponded = blast.responses.find(
    (r) => r.donor.toString() === req.user._id.toString(),
  );
  if (alreadyResponded) return res.json(blast);

  blast.responses.push({ donor: req.user._id });
  await blast.save();

  const io = req.app.get("io");
  if (io) {
    io.to(blast.requester.toString()).emit("donor_coming", {
      donorName: req.user.name,
      donorPic: req.user.profilePic,
      blastId: blast._id,
    });
  }

  res.json({
    message: "Hero status confirmed! The requester has been notified.",
  });
});

// Forgot Password (Send Email)
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const secret = process.env.JWT_SECRET + user.password;
  const token = jwt.sign({ email: user.email, id: user._id }, secret, {
    expiresIn: "15m",
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: "HopeLink - Password Reset Request",
    html: `
      <h3>You requested a password reset</h3>
      <p>Click the link below to securely set a new password. This link expires in 15 minutes.</p>
      <a href="${resetLink}" style="padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    `,
  };

  await transporter.sendMail(mailOptions);
  res.json({ message: "Password reset link sent to your email." });
});

// Reset Password (Save new password)
// @route   POST /api/auth/resetpassword/:id/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const secret = process.env.JWT_SECRET + user.password;

  try {
    jwt.verify(token, secret);

    user.password = password;
    await user.save();

    res.json({
      message: "Password has been successfully reset. You can now log in.",
    });
  } catch (error) {
    res.status(400);
    throw new Error("Reset link is invalid or has expired.");
  }
});

module.exports = {
  registerUser,
  loginUser,
  toggleRole,
  updateProfile,
  googleLogin,
  saveFCMToken,
  getMe,
  updateLocation,
  getNearbyDonors,
  sendEmergencyBlast,
  respondToBlast,
  forgotPassword,
  resetPassword,
};
