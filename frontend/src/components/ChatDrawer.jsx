import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPaperPlane,
  FaTimes,
  FaShieldAlt,
  FaLock,
  FaCheckDouble,
  FaCheck,
} from "react-icons/fa";
import toast from "react-hot-toast";

// 👉 IMPORT YOUR API MANAGER
import api from "../utils/api";

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
      socket.emit("join_chat", {
        userId: currentUser._id,
        donationId: chatRoomId,
      });
    }
  }, [isOpen, chatPartner, chatRoomId]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      // Check if the incoming message belongs to this specific room
      if (msg.donationId === chatRoomId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => socket.off("receive_message", handleReceiveMessage);
  }, [socket, chatRoomId]);

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
    e?.preventDefault();
    if (!newMessage.trim() || !chatRoomId) return;

    const messageData = {
      receiverId: chatPartner._id,
      content: newMessage,
      donationId: chatRoomId, // Using the unique room ID
    };

    try {
      const { data } = await api.post("/chat", messageData);

      // Emit via socket so the other user sees it instantly
      socket.emit("send_message", data);

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
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-slate-950 border-l border-slate-800 z-[101] shadow-2xl flex flex-col"
          >
            {/* HEADER */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {chatPartner?.profilePic ? (
                    <img
                      src={chatPartner.profilePic}
                      alt="User"
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-11 h-11 bg-teal-950 text-teal-400 border border-teal-800/50 rounded-2xl flex items-center justify-center font-black text-lg uppercase shadow-sm">
                      {chatPartner?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-teal-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-black text-white text-[15px] leading-tight truncate max-w-[180px]">
                    {chatPartner?.name || "Unknown User"}
                  </h3>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5 opacity-80">
                    <FaLock className="text-[8px]" /> Secure Session
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all active:scale-90"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950 space-y-5 relative no-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin opacity-50"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                  <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-1 shadow-inner">
                    <FaShieldAlt className="text-2xl text-teal-500/50 animate-pulse" />
                  </div>
                  <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Encrypted Channel
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const isMe =
                      msg.sender === currentUser._id ||
                      msg.sender?._id === currentUser._id;
                    return (
                      <motion.div
                        key={msg._id || idx}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`relative max-w-[85%] px-4 py-3 shadow-lg flex flex-col ${
                            isMe
                              ? "bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-[1.5rem] rounded-tr-md shadow-teal-900/40"
                              : "bg-slate-900 border border-slate-800 text-slate-200 rounded-[1.5rem] rounded-tl-md shadow-inner"
                          }`}
                        >
                          <span className="text-[14px] leading-relaxed break-words font-medium pr-2">
                            {msg.content}
                          </span>

                          <div
                            className={`flex justify-end items-center gap-1.5 mt-1.5 ${isMe ? "opacity-90" : "opacity-50"}`}
                          >
                            <span className="text-[9px] font-bold tracking-wider">
                              {new Date(
                                msg.createdAt || Date.now(),
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && <FaCheck className="text-[10px]" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* 👉 REDESIGNED INPUT AREA: Modern Pill Design */}
            <div className="bg-slate-950 px-3 py-3 md:p-4 z-20 border-t border-slate-800 shrink-0 pb-6 md:pb-4">
              <form
                onSubmit={handleSend}
                className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-3xl p-1.5 shadow-inner transition-all focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-800"
              >
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent py-3.5 px-4 text-white text-[14px] outline-none placeholder-slate-500 resize-none max-h-32 overflow-y-auto"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-white transition-all shadow-md self-end mb-1 mr-1 bg-teal-600 hover:bg-teal-500 shadow-teal-900/40 disabled:opacity-30 disabled:scale-100 active:scale-95"
                >
                  <FaPaperPlane className="text-[12px] -ml-1 mt-0.5" />
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
