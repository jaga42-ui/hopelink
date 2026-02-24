import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FaPaperPlane, FaTimes, FaUserCircle } from 'react-icons/fa';

const ChatDrawer = ({ isOpen, onClose, currentUser, chatPartner, socket }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch History when drawer opens
  useEffect(() => {
    if (isOpen && chatPartner) {
      fetchMessages();
      socket.emit('join_chat', currentUser._id); // Ensure we are in our room
    }
  }, [isOpen, chatPartner]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on('receive_message', (msg) => {
      // Only append if it belongs to this conversation
      if (
        (msg.sender._id === chatPartner?._id) || 
        (msg.sender._id === currentUser._id)
      ) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    });
    return () => socket.off('receive_message');
  }, [chatPartner, currentUser]);

  const fetchMessages = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const { data } = await axios.get(`http://localhost:5000/api/chat/${chatPartner._id}`, config);
      setMessages(data);
      scrollToBottom();
    } catch (error) { console.error(error); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const payload = { receiverId: chatPartner._id, content: newMessage };
      
      const { data } = await axios.post('http://localhost:5000/api/chat', payload, config);
      
      // We append manually here for instant UI feedback (Socket also sends it, so handle duplicates if needed)
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) { console.error(error); }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          
          {/* Drawer */}
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-teal-600 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <FaUserCircle className="text-3xl" />
                <div>
                  <h3 className="font-bold">{chatPartner?.name || 'Chat'}</h3>
                  <span className="text-xs text-teal-100">Online</span>
                </div>
              </div>
              <button onClick={onClose}><FaTimes className="text-xl hover:text-red-200" /></button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.sender._id === currentUser._id || msg.sender === currentUser._id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${
                      isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
              />
              <button className="bg-teal-600 text-white p-3 rounded-xl hover:bg-teal-700 transition">
                <FaPaperPlane />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;