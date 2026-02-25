import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaTimes, FaUserCircle, FaShieldAlt, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
import api from '../utils/api';

const ChatDrawer = ({ isOpen, onClose, currentUser, chatPartner, socket }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 👉 Create a unique Room ID for the two users
  const chatRoomId = chatPartner 
    ? [currentUser._id, chatPartner._id].sort().join("_") 
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch History when drawer opens
  useEffect(() => {
    if (isOpen && chatPartner && chatRoomId) {
      fetchMessages();
      // Join the unique combined room so both users hear each other
      socket.emit('join_chat', { userId: currentUser._id, donationId: chatRoomId }); 
    }
  }, [isOpen, chatPartner, chatRoomId]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (msg) => {
      // Check if the incoming message belongs to this specific room
      if (msg.donationId === chatRoomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off('receive_message');
  }, [chatRoomId]);

  // Always scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // We use the chatRoomId as the identifier for history
      const { data } = await api.get(`/chat/${chatRoomId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) { 
      console.error("Failed to load secure chat history", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoomId) return;

    const messageData = { 
      receiverId: chatPartner._id, 
      content: newMessage,
      donationId: chatRoomId // Using the unique room ID
    };

    try {
      const { data } = await api.post('/chat', messageData);
      
      // Emit via socket so the other user sees it instantly
      socket.emit('send_message', data);
      
      // Optimistic UI Update
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } catch (error) { 
      toast.error("Transmission failed. Check connection.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#050505]/80 backdrop-blur-sm z-[100]"
          />
          
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            {/* HEADER */}
            <div className="p-4 bg-[#111] border-b border-white/10 flex justify-between items-center shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {chatPartner?.profilePic ? (
                    <img src={chatPartner.profilePic} alt="User" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-black uppercase">
                      {chatPartner?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-teal-500 border-2 border-[#111] rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-black text-white text-sm leading-tight truncate max-w-[180px]">
                    {chatPartner?.name || 'Unknown User'}
                  </h3>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                    <FaLock className="text-[8px]" /> Secure Session
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-xl transition-all">
                <FaTimes />
              </button>
            </div>

            {/* MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#050505] space-y-4 relative no-scrollbar">
              <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')` }}></div>
              
              {messages.map((msg, idx) => {
                const isMe = msg.sender === currentUser._id || msg.sender?._id === currentUser._id;
                return (
                  <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[80%] px-4 py-2.5 flex flex-col ${
                      isMe ? 'bg-teal-600 text-white rounded-2xl rounded-tr-none' : 'bg-[#1a1a1a] border border-white/5 text-white rounded-2xl rounded-tl-none'
                    }`}>
                      <span className="text-[13px] leading-relaxed">{msg.content}</span>
                      <span className="text-[8px] mt-1 opacity-50 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 👉 FIXED: INPUT AREA CLEARING MOBILE NAV */}
            <div className="p-3 bg-[#111] border-t border-white/10 shrink-0 pb-[calc(85px+env(safe-area-inset-bottom))] md:pb-4">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-base md:text-sm outline-none focus:border-teal-500 transition-all"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-teal-500 text-black p-3 rounded-xl active:scale-95 disabled:opacity-30 transition-all"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;