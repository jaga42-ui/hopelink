import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaArrowLeft,
  FaSpinner,
  FaCommentAlt,
  FaShieldAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import api from "../utils/api";

const Inbox = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [inboxChats, setInboxChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👉 SOLID DARK THEME CONFIG
  const localRole = user?.activeRole || "donor";
  const isDonor = localRole === "donor";
  const roleTheme = {
    text: isDonor ? "text-teal-400" : "text-blue-400",
    bg: isDonor ? "bg-teal-600" : "bg-blue-600",
    border: isDonor ? "border-teal-800/50" : "border-blue-800/50",
    shadow: isDonor ? "shadow-teal-900/40" : "shadow-blue-900/40",
    avatarBg: isDonor
      ? "bg-teal-950 text-teal-400"
      : "bg-blue-950 text-blue-400",
  };

  useEffect(() => {
    if (!user) {
      navigate("/dashboard");
      return;
    }

    // 👉 THE FIX: Added a background refresh flag so the UI doesn't flash the spinner
    const fetchInbox = async (isBackgroundRefresh = false) => {
      if (!isBackgroundRefresh) setLoading(true);
      try {
        const { data } = await api.get("/chat/inbox");
        setInboxChats(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error("Failed to load messages");
      } finally {
        if (!isBackgroundRefresh) setLoading(false);
      }
    };

    fetchInbox(); // Initial fetch on page load

    // 👉 REAL-TIME ENGINE: Listens for the ping from Layout.jsx and updates silently!
    const handleRealTimeUpdate = () => {
      fetchInbox(true); // True = invisible background update
    };

    window.addEventListener("new_unread_message", handleRealTimeUpdate);
    
    return () => {
      window.removeEventListener("new_unread_message", handleRealTimeUpdate);
    };
  }, [user, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto md:px-4 pb-32 md:pb-24">
        {/* HEADER */}
        <header className="mb-6 md:mb-8 pt-6 px-4 md:px-0 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 p-3 md:p-3.5 rounded-full border border-slate-800 active:scale-90 shadow-sm"
          >
            <FaArrowLeft className="text-lg md:text-sm" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-none">
              SECURE <span className={roleTheme.text}>INBOX.</span>
            </h1>
          </div>
        </header>

        {/* SOLID DARK LIST CONTAINER */}
        <div className="bg-slate-900 border-y md:border border-slate-800 md:rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[60vh] relative">
          {/* Subtle background texture to match the grid vibe */}
          <div
            className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
              backgroundRepeat: "repeat",
            }}
          ></div>

          <div className="relative z-10">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <FaSpinner
                  className={`animate-spin text-4xl ${roleTheme.text} opacity-50`}
                />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                  Decrypting...
                </p>
              </div>
            ) : inboxChats.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-[60vh] text-slate-500 px-6 text-center">
                <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <FaCommentAlt className="text-3xl opacity-20" />
                </div>
                <p className="font-black uppercase tracking-[0.2em] text-xs text-slate-400">
                  No Active Comms
                </p>
                <p className="text-[11px] mt-2 max-w-[250px] font-medium leading-relaxed">
                  Your secure communications will appear here once a signal is
                  approved.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                <AnimatePresence>
                  {inboxChats.map((chat, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                      onClick={() =>
                        navigate(
                          `/chat/${chat.donationId}_${chat.otherUserId}`,
                          {
                            state: {
                              otherUserId: chat.otherUserId,
                              otherUserName: chat.otherUserName,
                              itemTitle: chat.donationTitle,
                            },
                          },
                        )
                      }
                      className="flex items-center gap-4 p-4 md:p-6 cursor-pointer hover:bg-slate-800/50 active:bg-slate-950 transition-colors group"
                    >
                      {/* Avatar */}
                      <div
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black text-xl overflow-hidden uppercase border border-slate-700 ${roleTheme.avatarBg} group-hover:scale-105 transition-transform shadow-md`}
                      >
                        {chat.otherUserProfilePic ? (
                          <img
                            src={chat.otherUserProfilePic}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          chat.otherUserName.charAt(0)
                        )}
                      </div>

                      {/* Message Preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-white font-black text-[15px] md:text-lg truncate pr-2 leading-tight">
                            {chat.otherUserName}
                          </h3>
                          <span
                            className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5 ${chat.unreadCount > 0 ? roleTheme.text : "text-slate-500"}`}
                          >
                            {new Date(chat.updatedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-3">
                          <div className="flex flex-col truncate pr-2">
                            <p className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-1 mb-0.5 truncate">
                              <FaShieldAlt className="text-[8px]" />{" "}
                              {chat.donationTitle}
                            </p>
                            <p
                              className={`text-[13px] md:text-sm truncate ${chat.unreadCount > 0 ? "text-white font-bold" : "text-slate-400 font-medium"}`}
                            >
                              {chat.latestMessage}
                            </p>
                          </div>

                          {/* Dynamic Unread Badge */}
                          {chat.unreadCount > 0 && (
                            <span
                              className={`${roleTheme.bg} text-white text-[10px] md:text-[11px] font-black min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${roleTheme.shadow}`}
                            >
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Inbox;