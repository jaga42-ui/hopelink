const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const webpush = require("web-push");
const compression = require("compression");
const cron = require("node-cron");
const Donation = require("./models/Donation");

// 👉 THE SCALE FIX: REDIS IMPORTS FOR STATELESS CLUSTERING
const rateLimit = require("express-rate-limit");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const { RedisStore } = require("rate-limit-redis");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Web Push
if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

// 👉 REDIS CLIENT SETUP
// Defaults to local Redis if no cloud URI is provided in .env
const redisClient = createClient({ url: process.env.REDIS_URI || 'redis://localhost:6379' });
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

Promise.all([redisClient.connect(), pubClient.connect(), subClient.connect()])
  .then(() => console.log("🔥 Redis Cluster Connected for Stateless Scaling"))
  .catch(err => console.error("⚠️ Redis Connection Failed:", err));

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes("vercel.app")) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply CORS to Socket.io & Attach Redis Adapter
const io = new Server(server, { cors: corsOptions });
io.adapter(createAdapter(pubClient, subClient)); // 👉 Binds all Socket servers together globally
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

// 👉 ANTI-SPAM: Global Redis Rate Limiters (Prevents bypassing limits by hitting different servers)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  message: { message: "Network overload. Please wait a few minutes." },
});

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 15, 
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  message: { message: "Spam protection active. Hourly transmission limit reached." },
});

app.use("/api/", apiLimiter);
app.use("/api/donations", (req, res, next) => {
  if (req.method === "POST") return postLimiter(req, res, next);
  next();
});
app.use("/api/events", (req, res, next) => {
  if (req.method === "POST") return postLimiter(req, res, next);
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/events", require("./routes/events"));

io.on("connection", (socket) => {
  socket.on("setup", (userId) => socket.join(userId));
  socket.on("join_chat", ({ userId, donationId }) => socket.join(donationId));

  socket.on("send_message", (data) => {
    socket.to(data.donationId).emit("receive_message", data);
    socket.to(data.receiver).emit("new_message_notification", data);
  });

  socket.on("mark_as_read", ({ donationId, readerId }) => socket.to(donationId).emit("messages_read", { readerId }));
  socket.on("edit_message", (data) => socket.to(data.donationId).emit("message_edited", data));
  socket.on("delete_message", (data) => socket.to(data.donationId).emit("message_deleted", data.id));
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
    console.log("🗄️ MongoDB Connected Securely");
    server.listen(PORT, () => console.log(`🚀 Stateless Server Node active on port ${PORT}`));
  })
  .catch((err) => console.log(err));