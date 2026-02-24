import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaArrowLeft, FaSpinner, FaCommentAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

import api from '../utils/api';

const Inbox = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [inboxChats, setInboxChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/dashboard');
      return;
    }

    const fetchInbox = async () => {
      try {
        const { data } = await api.get('/chat/inbox');
        setInboxChats(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load messages');
        setLoading(false);
      }
    };

    fetchInbox();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto md:px-4 pb-32 md:pb-24">
        
        {/* HEADER: Added px-4 for mobile edge spacing */}
        <header className="mb-6 md:mb-8 pt-4 px-4 md:px-0 flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-white/50 hover:text-white transition-colors bg-[#111] p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 active:bg-white/5"
          >
            <FaArrowLeft className="text-lg md:text-xl" />
          </button>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              MY <span className="text-teal-400">INBOX.</span>
            </h1>
          </div>
        </header>

        {/* LIST CONTAINER: Edge-to-edge on mobile, rounded on desktop */}
        <div className="bg-[#111] border-y md:border border-white/10 md:rounded-[2rem] overflow-hidden shadow-none md:shadow-2xl min-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center h-[50vh]">
              <FaSpinner className="animate-spin text-4xl text-teal-500" />
            </div>
          ) : inboxChats.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-[50vh] text-white/40 px-6 text-center">
              <FaCommentAlt className="text-5xl mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs md:text-sm">No active conversations</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {inboxChats.map((chat, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate(`/chat/${chat.donationId}`, { 
                    state: { otherUserId: chat.otherUserId, otherUserName: chat.otherUserName, itemTitle: chat.donationTitle } 
                  })}
                  className="flex items-center gap-3 md:gap-4 p-4 md:p-5 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                  {/* User Avatar */}
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-white font-black text-lg md:text-xl overflow-hidden uppercase">
                    {chat.otherUserProfilePic ? (
                      <img src={chat.otherUserProfilePic} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      chat.otherUserName.charAt(0)
                    )}
                  </div>
                  
                  {/* Message Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="text-white font-bold text-base md:text-lg truncate pr-2 leading-tight">
                        {chat.otherUserName}
                      </h3>
                      <span className={`text-[9px] md:text-xs font-bold uppercase tracking-widest shrink-0 ${chat.unreadCount > 0 ? 'text-teal-400' : 'text-white/40'}`}>
                        {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs md:text-sm truncate pr-2 ${chat.unreadCount > 0 ? 'text-white font-bold' : 'text-white/60'}`}>
                        {chat.latestMessage}
                      </p>
                      
                      {/* Unread Badge */}
                      {chat.unreadCount > 0 && (
                        <span className="bg-teal-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(20,184,166,0.5)]">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Inbox;