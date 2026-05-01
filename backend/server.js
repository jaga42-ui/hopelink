const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const webpush = require("web-push");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const cron = require("node-cron");
const Donation = require("./models/Donation");
const Feedback = require("./models/Feedback"); 
const { protect } = require("./middleware/authMiddleware");

dotenv.config();

// 👉 STARTUP CHECK: Ensure critical env variables are present
const requiredEnv = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    console.error(`🚨 FATAL ERROR: Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

const app = express();
const server = http.createServer(app);

// Bulletproof Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

if (
  process.env.VAPID_EMAIL &&
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (origin && origin.includes("vercel.app"))
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const io = new Server(server, { cors: corsOptions });
app.set("io", io);

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    message: "Too many requests. Please wait a few minutes to cool down.",
  },
});

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    message: "Spam protection active. You have reached your hourly post limit.",
  },
});

// 👉 THE FIX: Strict Auth Limiter to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Security Protocol Active: Too many authentication attempts. Try again in 15 minutes.",
  },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgotpassword", authLimiter);

app.use("/api/donations", (req, res, next) => {
  if (req.method === "POST") return postLimiter(req, res, next);
  next();
});

app.use("/api/events", (req, res, next) => {
  if (req.method === "POST") return postLimiter(req, res, next);
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Standard Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/events", require("./routes/events"));

// ==========================================
// 👉 FEEDBACK ROUTES (Inline MVP implementation)
// ==========================================

// 1. Users submitting feedback
app.post("/api/feedback", protect, async (req, res) => {
  try {
    const feedback = await Feedback.create({
      user: req.user._id,
      rating: req.body.rating,
      message: req.body.message
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(400).json({ message: "Failed to submit feedback" });
  }
});

// 2. Admins retrieving feedback for the Command Center
app.get("/api/admin/feedback", protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized as an admin" });
    }
    const feedbacks = await Feedback.find({})
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 });
    
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feedback" });
  }
});
// ==========================================

io.on("connection", (socket) => {
  socket.on("setup", (userId) => {
    socket.join(userId);
  });

  socket.on("join_chat", ({ userId, donationId }) => {
    socket.join(donationId);
  });

  socket.on("send_message", (data) => {
    socket.to(data.donationId).emit("receive_message", data);
    socket.to(data.receiver).emit("new_message_notification", data);
  });

  socket.on("mark_as_read", ({ donationId, readerId }) => {
    socket.to(donationId).emit("messages_read", { readerId });
  });

  socket.on("edit_message", (data) => {
    socket.to(data.donationId).emit("message_edited", data);
  });

  socket.on("delete_message", (data) => {
    socket.to(data.donationId).emit("message_deleted", data.id);
  });
});

cron.schedule("0 0 * * *", async () => {
  console.log("🧹 [CRON] Initiating nightly database cleanup...");
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    await Donation.updateMany(
      { isEmergency: true, createdAt: { $lt: oneDayAgo }, status: "active" },
      { $set: { status: "expired" } },
    );

    await Donation.updateMany(
      { category: "food", createdAt: { $lt: twoDaysAgo }, status: "active" },
      { $set: { status: "expired" } },
    );

  } catch (err) {
    console.error("❌ [CRON] Cleanup failed:", err);
  }
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🔥 MongoDB Connected Securely");
    server.listen(PORT, () =>
      console.log(`🚀 Master Server running on port ${PORT}`),
    );
  })
  .catch((err) => console.log(err));