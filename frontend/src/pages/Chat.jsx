import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import EmojiPicker from "emoji-picker-react";
import {
  FaPaperPlane,
  FaArrowLeft,
  FaSpinner,
  FaSmile,
  FaCheckDouble,
  FaCheck,
  FaChevronDown,
  FaTimes,
  FaEdit,
  FaTrash,
  FaShieldAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const SOCKET_URL = "https://hopelink-api.onrender.com";

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { donationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const otherUserId = location.state?.otherUserId;
  const otherUserName = location.state?.otherUserName || "Community Member";
  const itemTitle = location.state?.itemTitle || "Donation Listing";

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);

  const [editingMessage, setEditingMessage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const messagesEndRef = useRef(null);

  // 👉 THE FIX: Bind the socket to a Ref so React never drops the connection!
  const socketRef = useRef(null);

  // 👉 SOLID DARK THEME CONFIG
  const localRole = user?.activeRole || "donor";
  const isDonor = localRole === "donor";
  const roleTheme = {
    primaryGradient: isDonor
      ? "from-teal-500 to-teal-700"
      : "from-blue-500 to-blue-700",
    buttonBg: isDonor
      ? "bg-teal-600 hover:bg-teal-500"
      : "bg-blue-600 hover:bg-blue-500",
    text: isDonor ? "text-teal-400" : "text-blue-400",
    border: isDonor ? "border-teal-700/50" : "border-blue-700/50",
    shadow: isDonor ? "shadow-teal-900/40" : "shadow-blue-900/40",
    avatarBg: isDonor
      ? "bg-teal-950 text-teal-400"
      : "bg-blue-950 text-blue-400",
  };

  const scrollToBottom = () => {
    // Slight timeout ensures DOM has updated before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    if (!user || !otherUserId) {
      navigate("/dashboard");
      return;
    }

    // Initialize airtight socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.emit("join_chat", { userId: user._id, donationId });

    const fetchHistoryAndMarkRead = async () => {
      try {
        const { data } = await api.get(`/chat/${donationId}`);
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);

        await api.put(`/chat/${donationId}/read`);
        socketRef.current.emit("mark_as_read", {
          donationId,
          readerId: user._id,
        });
        scrollToBottom();
      } catch (error) {
        setMessages([]);
        setLoading(false);
      }
    };

    fetchHistoryAndMarkRead();

    // 👉 REAL-TIME RECEIVER: Appends instantly without refreshing
    socketRef.current.on("receive_message", (message) => {
      setMessages((prev) => {
        // Prevent duplicate renders
        if (Array.isArray(prev) && prev.some((m) => m._id === message._id))
          return prev;
        return [...(Array.isArray(prev) ? prev : []), message];
      });
      if (message.sender !== user._id) {
        socketRef.current.emit("mark_as_read", {
          donationId,
          readerId: user._id,
        });
      }
      scrollToBottom();
    });

    socketRef.current.on("messages_read", ({ readerId }) => {
      if (readerId !== user._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === user._id ? { ...msg, read: true } : msg,
          ),
        );
      }
    });

    socketRef.current.on("message_edited", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMsg._id ? updatedMsg : msg)),
      );
    });

    socketRef.current.on("message_deleted", (deletedId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== deletedId));
    });

    // 👉 🚀 THE NUCLEAR TERMINATION RECEIVER
    socketRef.current.on("chat_terminated", (data) => {
      toast.success(
        data.message || "Transaction verified. Channel closing...",
        {
          duration: 4000,
          icon: "🔒",
          style: {
            background: "#0f172a",
            color: "#10b981",
            border: "1px solid #10b981",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          },
        },
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user, donationId, otherUserId, navigate]);

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prevInput) => prevInput + emojiObject.emoji);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Instantly clear the input
    setShowEmojis(false);

    if (editingMessage) {
      // Optimistic Edit
      const tempEditedMsg = { ...editingMessage, content: messageContent };
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === editingMessage._id ? tempEditedMsg : msg,
        ),
      );
      setEditingMessage(null);

      try {
        const { data } = await api.put(`/chat/${editingMessage._id}`, {
          content: messageContent,
        });
        socketRef.current.emit("edit_message", data);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === data._id ? data : msg)),
        );
      } catch (error) {
        toast.error("Failed to edit message");
      }
    } else {
      // 👉 OPTIMISTIC SEND
      const tempId = `temp_${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        content: messageContent,
        sender: user._id,
        receiver: otherUserId,
        createdAt: new Date().toISOString(),
        read: false,
        isSending: true,
      };

      setMessages((prev) => [...(Array.isArray(prev) ? prev : []), tempMsg]);
      scrollToBottom();

      try {
        const messageData = {
          receiverId: otherUserId,
          donationId,
          content: messageContent,
        };
        const { data } = await api.post("/chat", messageData);

        socketRef.current.emit("send_message", {
          ...data,
          donationId,
          receiver: otherUserId,
          senderName: user.name,
        });

        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? data : msg)),
        );
      } catch (error) {
        toast.error("Network unstable. Message failed to send.");
        setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      }
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Purge this transmission from the logs?")) {
      setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
      try {
        await api.delete(`/chat/${msgId}`);
        socketRef.current.emit("delete_message", { id: msgId, donationId });
      } catch (error) {
        toast.error("Failed to delete message");
      }
    }
  };

  if (!user) return null;

  const activeConversation = Array.isArray(messages)
    ? messages.filter(
        (msg) =>
          (msg.sender === user._id && msg.receiver === otherUserId) ||
          (msg.sender === otherUserId && msg.receiver === user._id),
      )
    : [];

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout>
      <div className="w-full h-[calc(100dvh-80px)] md:h-[85vh] md:max-w-4xl md:mx-auto md:my-4 flex flex-col bg-slate-950 md:border md:border-slate-800 md:rounded-[2.5rem] overflow-hidden md:shadow-2xl relative">
        <header className="bg-slate-900 p-3 md:p-5 flex items-center justify-between z-20 shadow-md border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => navigate("/chat/inbox")}
              className="text-slate-400 hover:text-white transition-colors p-2.5 active:scale-90 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-full shadow-inner"
            >
              <FaArrowLeft className="text-sm md:text-base" />
            </button>
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate(`/profile/${otherUserId}`)}
            >
              <div
                className={`w-11 h-11 md:w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg md:text-xl uppercase shadow-md border ${roleTheme.border} ${roleTheme.avatarBg} group-hover:scale-105 transition-transform`}
              >
                {otherUserName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] md:text-[17px] font-black text-white leading-tight truncate max-w-[150px] sm:max-w-xs flex items-center gap-2">
                  {otherUserName}
                </h2>
                <p
                  className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5 ${roleTheme.text} truncate max-w-[150px] sm:max-w-xs opacity-80`}
                >
                  <FaShieldAlt className="text-[8px]" /> {itemTitle}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10 no-scrollbar relative bg-slate-950"
          onClick={() => {
            setDropdownOpen(null);
            setShowEmojis(false);
          }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <FaSpinner
                className={`animate-spin text-4xl ${roleTheme.text}`}
              />
            </div>
          ) : activeConversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
              <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <FaShieldAlt
                  className={`text-4xl ${roleTheme.text} animate-pulse opacity-50`}
                />
              </div>
              <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">
                Secure Channel Open
              </p>
              <p className="text-[10px] text-center max-w-[250px] font-medium text-slate-500 leading-relaxed">
                Messages are end-to-end encrypted and routed directly through
                the HopeLink grid.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {activeConversation.map((msg, index) => {
                const isMe = msg.sender === user._id;

                return (
                  <motion.div
                    key={msg._id || index}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}
                  >
                    <div
                      className={`relative max-w-[85%] md:max-w-[70%] px-5 py-3.5 shadow-lg flex flex-col group transition-all duration-300 ${
                        isMe
                          ? `bg-gradient-to-br ${roleTheme.primaryGradient} text-white rounded-[2rem] rounded-tr-md ${roleTheme.shadow}`
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-[2rem] rounded-tl-md shadow-inner"
                      } ${msg.isSending ? "opacity-60" : "opacity-100"}`}
                    >
                      {isMe && !msg.isSending && (
                        <div className="absolute top-1 right-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpen(
                                dropdownOpen === msg._id ? null : msg._id,
                              );
                            }}
                            className="text-white/60 hover:text-white p-2 md:p-1.5 md:opacity-0 md:group-hover:opacity-100 transition-all active:bg-black/20 rounded-full"
                          >
                            <FaChevronDown className="text-[10px]" />
                          </button>

                          {dropdownOpen === msg._id && (
                            <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden w-36 py-1">
                              <button
                                onClick={() => {
                                  setEditingMessage(msg);
                                  setNewMessage(msg.content);
                                  setDropdownOpen(null);
                                }}
                                className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-700 hover:text-white text-left flex items-center gap-3 transition-colors"
                              >
                                <FaEdit className="text-sm" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteMessage(msg._id);
                                  setDropdownOpen(null);
                                }}
                                className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white text-left flex items-center gap-3 border-t border-slate-700/50 transition-colors"
                              >
                                <FaTrash className="text-sm" /> Purge
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <p
                        className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium ${isMe ? "pr-5" : ""}`}
                      >
                        {msg.content}
                      </p>

                      <div
                        className={`flex justify-end items-center gap-1.5 mt-2 ${isMe ? "opacity-90" : "opacity-50"}`}
                      >
                        <span className="text-[9px] font-bold tracking-wider">
                          {formatTime(msg.createdAt)}
                        </span>
                        {isMe &&
                          (msg.isSending ? (
                            <FaSpinner className="text-white/60 text-[8px] animate-spin" />
                          ) : msg.read ? (
                            <FaCheckDouble className="text-white text-[10px]" />
                          ) : (
                            <FaCheck className="text-white/60 text-[10px]" />
                          ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <AnimatePresence>
          {showEmojis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-[90px] left-2 right-2 md:left-4 md:right-auto z-50 shadow-2xl flex justify-center md:block"
            >
              <div className="w-full md:w-[320px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme="dark"
                  width="100%"
                  height={350}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingMessage && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="bg-slate-900 px-5 py-3 flex justify-between items-center border-t border-slate-800 z-20 shadow-inner overflow-hidden"
            >
              <span
                className={`${roleTheme.text} text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}
              >
                <FaEdit /> Modifying Transmission...
              </span>
              <button
                onClick={() => {
                  setEditingMessage(null);
                  setNewMessage("");
                }}
                className="text-slate-500 hover:text-white p-2 bg-slate-950 rounded-full transition-colors border border-slate-800"
              >
                <FaTimes className="text-xs" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-slate-950 px-3 py-3 md:p-4 z-20 border-t border-slate-800 shrink-0 pb-6 md:pb-4">
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-3xl p-1.5 shadow-inner transition-all focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-800"
          >
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className={`p-3 rounded-full transition-colors flex shrink-0 items-center justify-center self-end mb-0.5 ${showEmojis ? roleTheme.text + " bg-slate-950 shadow-sm" : "text-slate-500 hover:text-white"}`}
            >
              <FaSmile className="text-xl" />
            </button>

            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => setShowEmojis(false)}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent py-3.5 px-2 text-white text-[15px] outline-none placeholder-slate-500 resize-none max-h-32 overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />

            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`w-11 h-11 rounded-full flex shrink-0 items-center justify-center text-white transition-all shadow-md self-end mb-1 mr-1 ${
                editingMessage
                  ? "bg-orange-600 shadow-orange-900/50 hover:bg-orange-500"
                  : `${roleTheme.buttonBg} ${roleTheme.shadow}`
              } disabled:opacity-30 disabled:scale-100 active:scale-95`}
            >
              {editingMessage ? (
                <FaCheckDouble className="text-[14px]" />
              ) : (
                <FaPaperPlane className="text-[13px] -ml-1 mt-0.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
