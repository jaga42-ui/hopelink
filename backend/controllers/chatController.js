const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
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
      console.log('🔥 Firebase Admin Initialized successfully in Chat');
    } else {
      console.log('⚠️ FIREBASE_SERVICE_ACCOUNT env var missing. Chat push notifications disabled.');
    }
  } catch (error) {
    console.log('⚠️ Firebase Admin setup failed in Chat:', error.message);
  }
}

// @desc    Get user's inbox
// @route   GET /api/chat/inbox
const getInbox = asyncHandler(async (req, res) => {
  const myId = req.user._id;

  const messages = await Message.find({
    $or: [{ sender: myId }, { receiver: myId }]
  })
  .populate('sender', 'name profilePic')
  .populate('receiver', 'name profilePic')
  .populate('donationId', 'title image')
  .sort({ createdAt: -1 });

  const conversations = [];
  const seen = new Set();

  messages.forEach(msg => {
    if (!msg.donationId || !msg.sender || !msg.receiver) return; 

    const isMeSender = msg.sender._id.toString() === myId.toString();
    const otherUser = isMeSender ? msg.receiver : msg.sender;
    const convoKey = `${msg.donationId._id.toString()}_${otherUser._id.toString()}`;

    if (!seen.has(convoKey)) {
      seen.add(convoKey);
      conversations.push({
        donationId: msg.donationId._id,
        donationTitle: msg.donationId.title,
        otherUserId: otherUser._id,
        otherUserName: otherUser.name,
        otherUserProfilePic: otherUser.profilePic,
        latestMessage: msg.content.startsWith('[AUDIO]') ? '🎤 Voice message' : msg.content,
        updatedAt: msg.createdAt,
        unreadCount: (!msg.read && !isMeSender) ? 1 : 0
      });
    } else {
      if (!msg.read && !isMeSender) {
        const convo = conversations.find(c => c.donationId.toString() === msg.donationId._id.toString() && c.otherUserId.toString() === otherUser._id.toString());
        if (convo) convo.unreadCount += 1;
      }
    }
  });

  res.json(conversations);
});

// @desc    Get chat history
// @route   GET /api/chat/:donationId
const getChatHistory = asyncHandler(async (req, res) => {
  const rawId = req.params.donationId;
  // Clean the ID before querying
  const actualDonationId = rawId.includes('_') ? rawId.split('_')[0] : rawId;
  const myId = req.user._id;

  const messages = await Message.find({
    donationId: actualDonationId,
    $or: [{ sender: myId }, { receiver: myId }]
  }).sort({ createdAt: 1 }); 

  res.json(messages);
});

// @desc    Save a new message
// @route   POST /api/chat
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, donationId, content } = req.body;

  if (!receiverId || !donationId || !content) {
    res.status(400); throw new Error('Missing required fields');
  }

  // Clean the ID before saving to database
  const actualDonationId = donationId.includes('_') ? donationId.split('_')[0] : donationId;

  // 1. Create and save the message
  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    donationId: actualDonationId,
    content
  });

  // 2. Emit real-time Socket event (for when the app is open)
  const io = req.app.get('io');
  if (io) {
    io.to(receiverId.toString()).emit("new_message_notification");
  }

  // 👉 3. FIREBASE PUSH NOTIFICATION (for when the app is closed)
  try {
    const receiver = await User.findById(receiverId);
    
    // Check if the receiver has an active Firebase token saved
    if (receiver && receiver.fcmToken) {
      
      const pushMessage = {
        notification: {
          title: `${req.user.name} sent you a message`,
          body: content.startsWith('[AUDIO]') ? '🎤 Voice message' : (content.length > 40 ? content.substring(0, 40) + '...' : content),
        },
        token: receiver.fcmToken // Sending to this specific user's device
      };

      await admin.messaging().send(pushMessage);
      console.log(`🔥 Firebase Chat Blast: Sent to ${receiver.name}'s locked phone.`);
    }
  } catch (error) {
    console.error("Firebase Chat Push Error:", error.message);
    // Don't throw the error so the actual message still saves!
  }

  res.status(201).json(message);
});

// @route   DELETE /api/chat/:id
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) { res.status(404); throw new Error('Message not found'); }
  if (message.sender.toString() !== req.user._id.toString()) { 
    res.status(401); throw new Error('Not authorized to delete this message'); 
  }

  await message.deleteOne();
  res.json({ id: req.params.id, donationId: message.donationId });
});

// @route   PUT /api/chat/:id
const editMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) { res.status(404); throw new Error('Message not found'); }
  if (message.sender.toString() !== req.user._id.toString()) { 
    res.status(401); throw new Error('Not authorized to edit this message'); 
  }

  message.content = req.body.content;
  const updatedMessage = await message.save();

  res.json(updatedMessage);
});

// @desc    Mark all messages in a chat as read
// @route   PUT /api/chat/:donationId/read
// @access  Private
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const rawId = req.params.donationId;
  const actualDonationId = rawId.includes('_') ? rawId.split('_')[0] : rawId;

  await Message.updateMany(
    { 
      donationId: actualDonationId, 
      receiver: req.user._id, 
      read: false 
    },
    { $set: { read: true } }
  );

  res.json({ success: true });
});

module.exports = { getInbox, getChatHistory, sendMessage, deleteMessage, editMessage, markMessagesAsRead };