import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaArrowLeft, FaSpinner, FaCommentAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
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
        // 👉 CLEAN REQUEST: No localhost and no manual config headers!
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
      <div className="max-w-3xl mx-auto pb-24">
        
        <header className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-white/50 hover:text-white transition-colors bg-[#111] p-4 rounded-2xl border border-white/10">
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
              MY <span className="text-teal-400">INBOX.</span>
            </h1>
          </div>
        </header>

        <div className="bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl min-h-[50vh]">
          {loading ? (
            <div className="flex justify-center items-center h-[50vh]"><FaSpinner className="animate-spin text-4xl text-teal-500" /></div>
          ) : inboxChats.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-[50vh] text-white/40">
              <FaCommentAlt className="text-5xl mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-sm">No active conversations</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {inboxChats.map((chat, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate(`/chat/${chat.donationId}`, { 
                    state: { otherUserId: chat.otherUserId, otherUserName: chat.otherUserName, itemTitle: chat.donationTitle } 
                  })}
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-white font-black text-xl overflow-hidden uppercase">
                    {chat.otherUserProfilePic ? (
                      <img src={chat.otherUserProfilePic} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      chat.otherUserName.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-white font-bold text-lg truncate pr-2">{chat.otherUserName}</h3>
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-white/60 text-sm truncate pr-2">
                        {chat.latestMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-teal-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
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