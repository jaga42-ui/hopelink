const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Blast = require("../models/Blast");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

const { sendPostAlertEmail } = require("../utils/sendEmail");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

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

  const user = await User.create({
    name,
    email,
    password,
    phone,
    bloodGroup: bloodGroup || undefined,
    activeRole: activeRole || "donor",
    isAdmin: false,
    profilePic: "",
    addressText: "",
    location: { type: "Point", coordinates: [0, 0] },
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
      // 👉 FIXED: Replaced "HopeLink" with "Sahayam"
      const securePass = `Sahayam_${Math.random().toString(36).slice(-8)}!`;
      user = await User.create({
        name: name || "New Hero",
        email,
        password: securePass,
        profilePic: picture || "",
        googleId,
        phone: "Not Provided",
        activeRole: "donor",
        points: 10,
        location: { type: "Point", coordinates: [0, 0] },
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

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (user) res.json(user);
  else {
    res.status(404);
    throw new Error("User not found");
  }
});

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

  const nearbyDonors = await User.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 20000,
      },
    },
    activeRole: "donor",
    _id: { $ne: req.user._id },
  });

  const pushTokens = nearbyDonors
    .filter((donor) => donor.fcmToken)
    .map((donor) => donor.fcmToken);
  const emailAddresses = nearbyDonors
    .filter((donor) => donor.email)
    .map((donor) => donor.email);

  if (pushTokens.length > 0) {
    const pushMessage = {
      notification: {
        title: `🚨 URGENT: ${bloodGroup || "Help"} Needed Nearby`,
        body: message,
      },
      tokens: pushTokens,
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

  if (emailAddresses.length > 0) {
    sendPostAlertEmail(emailAddresses, {
      message,
      bloodGroup,
      isEmergency: true,
    });
  }

  res
    .status(200)
    .json({
      success: true,
      blastId: blast._id,
      recipients: nearbyDonors.length,
    });
});

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
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
  });

  // 👉 FIXED: Replaced HopeLink text and styling with Sahayam Light Theme
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: "Sahayam - Security Clearance Reset",
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border-radius: 24px; color: #29524a; border: 1px solid rgba(132, 107, 138, 0.3);">
        <h2 style="color: #29524a; margin-top: 0; font-weight: 900; font-style: italic;">PASSWORD RESET PROTOCOL</h2>
        <p style="color: #846b8a; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">You requested a security clearance update.</p>
        
        <p style="margin: 30px 0; font-size: 16px; font-weight: 500;">Click the button below to securely set a new password for your Sahayam account. This link will expire in exactly 15 minutes.</p>
        
        <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #ff4a1c; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">Reset Password</a>
        
        <hr style="border: 0; border-top: 1px solid rgba(132, 107, 138, 0.2); margin: 40px 0 20px 0;" />
        <p style="font-size: 10px; color: #846b8a; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">If you did not request this change, you may safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  res.json({ message: "Security clearance link dispatched to your email." });
});

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
