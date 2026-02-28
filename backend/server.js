const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const webpush = require("web-push");
const rateLimit = require("express-rate-limit");
const compression = require("compression"); // 👉 ADDED COMPRESSION ENGINE

// 👉 CRON & MODEL IMPORTS FOR AUTO-CLEANUP
const cron = require("node-cron");
const Donation = require("./models/Donation");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Web Push
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

// 👉 THE BULLETPROOF CORS CONFIGURATION
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

// Apply CORS to Socket.io
const io = new Server(server, { cors: corsOptions });
app.set("io", io);

// Google Login Popup Fix
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// Apply CORS to Express
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// 👉 THE FIX: Shrink all server JSON responses by ~70% for lightning-fast loading!
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👉 ANTI-SPAM: General API Protection (Stops DDOS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: {
    message: "Too many requests. Please wait a few minutes to cool down.",
  },
});

// 👉 ANTI-SPAM: Strict Post Limiter (Stops Bot Spamming on Feed)
const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 posts per hour
  message: {
    message: "Spam protection active. You have reached your hourly post limit.",
  },
});

// 👉 THE 429 FIX: Apply limiters smartly
app.use("/api/", apiLimiter);

// Only apply the strict postLimiter to POST requests (creating new items)
// GET requests (scrolling the feed) flow freely!
app.use("/api/donations", (req, res, next) => {
  if (req.method === "POST") return postLimiter(req, res, next);
  next();
});

app.use("/api/events", (req, res, next) => {
  if (req.method === "POST") return postLimiter(req, res, next);
  next();
});

// Static folder for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/events", require("./routes/events"));

// Socket.io Real-time Logic
io.on("connection", (socket) => {
  console.log("User Connected via Socket:", socket.id);

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

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

// 👉 THE AUTO-CLEANUP ENGINE
cron.schedule("0 0 * * *", async () => {
  console.log("🧹 [CRON] Initiating nightly database cleanup...");
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // 1. Mark SOS Emergency Posts older than 24 hours as "expired"
    // 👉 CRITICAL FIX: Changed from 'available' to 'active' to match schema!
    const sosResult = await Donation.updateMany(
      { isEmergency: true, createdAt: { $lt: oneDayAgo }, status: "active" },
      { $set: { status: "expired" } },
    );

    // 2. Mark Food Posts older than 48 hours as "expired" (Hygiene control)
    // 👉 CRITICAL FIX: Changed from 'available' to 'active' to match schema!
    const foodResult = await Donation.updateMany(
      { category: "food", createdAt: { $lt: twoDaysAgo }, status: "active" },
      { $set: { status: "expired" } },
    );

    console.log(
      `✅ [CRON] Cleanup complete. Expired ${sosResult.modifiedCount} SOS posts and ${foodResult.modifiedCount} Food posts.`,
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