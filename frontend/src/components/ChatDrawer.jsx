import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaTimes, FaUserCircle, FaShieldAlt } from 'react-icons/fa';

// 👉 IMPORT YOUR API MANAGER
import api from '../utils/api';

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
      // 👉 CLEAN REQUEST: No localhost, no manual token headers!
      const { data } = await api.get(`/chat/${chatPartner._id}`);
      setMessages(data);
      scrollToBottom();
    } catch (error) { 
      console.error("Failed to load secure chat history", error); 
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const payload = { receiverId: chatPartner._id, content: newMessage };
      
      // 👉 CLEAN REQUEST
      const { data } = await api.post('/chat', payload);
      
      // We append manually here for instant UI feedback (Socket also sends it)
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) { 
      console.error("Transmission failed", error); 
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Tactical Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#050505]/80 backdrop-blur-sm z-40"
          />
          
          {/* Drawer: Uses 100dvh so the mobile keyboard doesn't hide the input */}
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            {/* HEADER */}
            <div className="p-4 md:p-5 bg-[#111] border-b border-white/10 flex justify-between items-center shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {chatPartner?.profilePic ? (
                    <img src={chatPartner.profilePic} alt="User" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-lg uppercase">
                      {chatPartner?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-teal-500 border-2 border-[#111] rounded-full shadow-[0_0_10px_rgba(20,184,166,0.8)]"></div>
                </div>
                <div>
                  <h3 className="font-black text-white text-sm md:text-base leading-tight flex items-center gap-2">
                    {chatPartner?.name || 'Unknown Operator'}
                  </h3>
                  <span className="text-[9px] md:text-[10px] text-teal-400 font-black uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <FaShieldAlt className="text-[8px]" /> Secure Line Active
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-95">
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#050505] space-y-4 relative no-scrollbar">
              {/* Subtle background texture */}
              <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundRepeat: 'repeat' }}></div>
              
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-2 relative z-10">
                  <FaShieldAlt className="text-4xl mb-2 opacity-50" />
                  <p className="font-bold text-xs uppercase tracking-widest">End-to-End Encrypted</p>
                  <p className="text-[10px] text-center max-w-[250px]">Messages are securely routed through the HopeLink network.</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isMe = msg.sender._id === currentUser._id || msg.sender === currentUser._id;
                
                return (
                  <div key={idx} className={`flex relative z-10 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[85%] md:max-w-[75%] px-4 py-3 shadow-sm flex flex-col group ${
                      isMe 
                        ? 'bg-teal-600 text-white rounded-2xl rounded-tr-sm shadow-teal-900/20' 
                        : 'bg-[#111] border border-white/10 text-white rounded-2xl rounded-tl-sm'
                    }`}>
                      <span className="text-sm leading-relaxed break-words">{msg.content}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="p-3 md:p-4 bg-[#111] border-t border-white/10 shrink-0 pb-safe">
              <form onSubmit={handleSend} className="flex gap-2">
                {/* text-base safely prevents iOS auto-zoom */}
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Transmit message..."
                  className="flex-1 px-4 py-3.5 bg-black/50 border border-white/10 rounded-2xl text-white text-base md:text-sm placeholder-white/30 focus:outline-none focus:border-teal-500 focus:bg-black transition-colors shadow-inner"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-teal-500 hover:bg-teal-400 text-[#050505] px-5 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center shrink-0"
                >
                  <FaPaperPlane className="text-lg translate-x-[-1px] translate-y-[1px]" />
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