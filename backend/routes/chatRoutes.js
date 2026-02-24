const express = require('express');
const router = express.Router();
const { getInbox, getChatHistory, sendMessage, deleteMessage, editMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { markMessagesAsRead } = require('../controllers/chatController'); // 👉 Import it

router.get('/inbox', protect, getInbox);
router.get('/:donationId', protect, getChatHistory);
router.post('/', protect, sendMessage);

// 👉 NEW: Edit and Delete routes
router.delete('/:id', protect, deleteMessage);
router.put('/:id', protect, editMessage);
router.put('/:donationId/read', protect, markMessagesAsRead);

module.exports = router;