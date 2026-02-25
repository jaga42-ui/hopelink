import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import EmojiPicker from 'emoji-picker-react';
import { FaPaperPlane, FaArrowLeft, FaSpinner, FaSmile, FaCheckDouble, FaCheck, FaChevronDown, FaTimes, FaEdit, FaTrash, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

const SOCKET_URL = 'https://hopelink-api.onrender.com';
let socket;

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { donationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const otherUserId = location.state?.otherUserId;
  const otherUserName = location.state?.otherUserName || "Community Member";
  const itemTitle = location.state?.itemTitle || "Donation Listing";

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);

  const [editingMessage, setEditingMessage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null); 

  const messagesEndRef = useRef(null);

  // Dynamic Theme based on Role
  const localRole = user?.activeRole || "donor";
  const isDonor = localRole === "donor";
  const roleTheme = {
    primary: isDonor ? "from-teal-500 to-emerald-600" : "from-blue-500 to-indigo-600",
    text: isDonor ? "text-teal-400" : "text-blue-400",
    border: isDonor ? "border-teal-500/50" : "border-blue-500/50",
    shadow: isDonor ? "shadow-teal-500/20" : "shadow-blue-500/20"
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || !otherUserId) {
      navigate('/dashboard');
      return;
    }

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    
    socket.emit('join_chat', { userId: user._id, donationId });

    const fetchHistoryAndMarkRead = async () => {
      try {
        const { data } = await api.get(`/chat/${donationId}`);
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);

        await api.put(`/chat/${donationId}/read`);
        socket.emit('mark_as_read', { donationId, readerId: user._id });
      } catch (error) {
        setMessages([]); 
        setLoading(false);
      }
    };

    fetchHistoryAndMarkRead();

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...(Array.isArray(prev) ? prev : []), message]);
      if (message.sender !== user._id) {
        socket.emit('mark_as_read', { donationId, readerId: user._id });
      }
    });

    socket.on('messages_read', ({ readerId }) => {
      if (readerId !== user._id) {
        setMessages(prev => prev.map(msg => 
          msg.sender === user._id ? { ...msg, read: true } : msg
        ));
      }
    });

    socket.on('message_edited', (updatedMsg) => {
      setMessages((prev) => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
    });

    socket.on('message_deleted', (deletedId) => {
      setMessages((prev) => prev.filter(msg => msg._id !== deletedId));
    });

    return () => socket.disconnect();
  }, [user, donationId, otherUserId, navigate]);

  useEffect(() => scrollToBottom(), [messages]);

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevInput => prevInput + emojiObject.emoji);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (editingMessage) {
        const { data } = await api.put(`/chat/${editingMessage._id}`, { content: newMessage });
        socket.emit('edit_message', data);
        setMessages((prev) => prev.map(msg => msg._id === data._id ? data : msg));
        setEditingMessage(null);
      } else {
        const messageData = { receiverId: otherUserId, donationId, content: newMessage };
        const { data } = await api.post('/chat', messageData);
        socket.emit('send_message', data);
        setMessages((prev) => [...(Array.isArray(prev) ? prev : []), data]);
      }
      
      setNewMessage('');
      setShowEmojis(false);
    } catch (error) { 
      toast.error('Failed to transmit message'); 
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Purge this transmission from the logs?")) {
      setMessages((prev) => prev.filter(msg => msg._id !== msgId));
      try {
        await api.delete(`/chat/${msgId}`);
        socket.emit('delete_message', { id: msgId, donationId });
      } catch (error) { 
        toast.error("Failed to delete message"); 
      }
    }
  };

  if (!user) return null;

  const activeConversation = Array.isArray(messages) ? messages.filter(
    (msg) => (msg.sender === user._id && msg.receiver === otherUserId) || (msg.sender === otherUserId && msg.receiver === user._id)
  ) : [];

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      {/* GLASSMORPHISM MOBILE-FIRST CONTAINER */}
      <div className="w-full h-[calc(100dvh)] md:h-[85vh] md:max-w-4xl md:mx-auto md:my-4 flex flex-col bg-black/20 backdrop-blur-3xl md:border md:border-white/10 md:rounded-[2.5rem] overflow-hidden md:shadow-2xl relative">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundRepeat: 'repeat' }}></div>

        {/* CHAT HEADER */}
        <header className="bg-white/5 backdrop-blur-md p-3 md:p-5 flex items-center justify-between z-10 shadow-sm border-b border-white/10">
          <div className="flex items-center gap-3 md:gap-5">
            <button onClick={() => navigate('/chat/inbox')} className="text-white/50 hover:text-white transition-colors p-2 active:scale-90 bg-white/5 rounded-full">
              <FaArrowLeft className="text-lg md:text-xl" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/profile/${otherUserId}`)}>
              <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg md:text-xl uppercase shadow-sm border ${roleTheme.border} ${isDonor ? 'bg-teal-500/20' : 'bg-blue-500/20'} group-hover:scale-105 transition-transform`}>
                {otherUserName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] md:text-[17px] font-black text-white leading-tight truncate max-w-[150px] sm:max-w-xs flex items-center gap-2">
                  {otherUserName}
                </h2>
                <p className={`text-[10px] md:text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5 ${roleTheme.text} truncate max-w-[150px] sm:max-w-xs`}>
                  <FaShieldAlt className="text-[8px]" /> {itemTitle}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* MESSAGES AREA */}
        <div 
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 no-scrollbar relative"
          onClick={() => { setDropdownOpen(null); setShowEmojis(false); }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full"><FaSpinner className="animate-spin text-4xl text-white/30" /></div>
          ) : activeConversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-2">
              <FaShieldAlt className="text-5xl mb-2 opacity-50" />
              <p className="font-black text-xs uppercase tracking-[0.2em]">End-to-End Encrypted</p>
              <p className="text-[10px] text-center max-w-[250px] font-medium">Messages are securely routed through the HopeLink grid.</p>
            </div>
          ) : (
            activeConversation.map((msg, index) => {
              const isMe = msg.sender === user._id;
              
              return (
                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                  
                  <div className={`relative max-w-[85%] md:max-w-[70%] px-4 py-3 shadow-md flex flex-col group ${
                    isMe 
                      ? `bg-gradient-to-br ${roleTheme.primary} text-white rounded-3xl rounded-tr-sm ${roleTheme.shadow}` 
                      : 'bg-white/10 border border-white/10 text-white rounded-3xl rounded-tl-sm backdrop-blur-md'
                  }`}>
                    
                    {/* Touch-Friendly Dropdown Toggle */}
                    {isMe && (
                      <div className="absolute top-1 right-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === msg._id ? null : msg._id); }}
                          className="text-white/70 hover:text-white p-2 md:p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity active:bg-white/20 rounded-full"
                        >
                          <FaChevronDown className="text-[10px] md:text-[12px]" />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen === msg._id && (
                          <div className="absolute right-0 top-8 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden w-32">
                            <button 
                              onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); setDropdownOpen(null); }} 
                              className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white active:bg-white/10 md:hover:bg-white/10 text-left flex items-center gap-2"
                            ><FaEdit /> Edit</button>
                            <button 
                              onClick={() => { handleDeleteMessage(msg._id); setDropdownOpen(null); }} 
                              className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-red-400 active:bg-white/10 md:hover:bg-white/10 text-left flex items-center gap-2 border-t border-white/5"
                            ><FaTrash /> Delete</button>
                          </div>
                        )}
                      </div>
                    )}

                    <p className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${isMe ? 'pr-6 md:pr-4' : ''}`}>
                      {msg.content}
                    </p>
                    
                    <div className="flex justify-end items-center gap-1 mt-1.5 opacity-70">
                      <span className="text-[9px] md:text-[10px] font-bold">{formatTime(msg.createdAt)}</span>
                      {isMe && (
                        msg.read ? <FaCheckDouble className="text-white text-[10px] md:text-[12px]" /> : <FaCheck className="text-white/50 text-[10px] md:text-[12px]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* EMOJI PICKER */}
        {showEmojis && (
          <div className="absolute bottom-[130px] md:bottom-24 left-0 right-0 md:left-4 md:right-auto z-50 shadow-2xl flex justify-center md:block">
            <div className="w-full md:w-[320px] rounded-3xl overflow-hidden border border-white/10">
               <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width="100%" height={350} />
            </div>
          </div>
        )}

        {/* EDIT BANNER */}
        {editingMessage && (
          <div className="bg-black/60 backdrop-blur-xl px-5 py-3 flex justify-between items-center border-t border-white/10 z-10 shadow-lg">
            <span className={`${roleTheme.text} text-xs font-black uppercase tracking-widest flex items-center gap-2`}><FaEdit /> Editing Transmission...</span>
            <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-white/50 active:text-white hover:text-white p-2 bg-white/5 rounded-full transition-colors">
              <FaTimes className="text-xs" />
            </button>
          </div>
        )}

        {/* INPUT AREA WITH MOBILE PADDING */}
        <div className="bg-black/40 backdrop-blur-xl px-3 pt-3 pb-[90px] md:p-4 flex items-center gap-2 md:gap-3 z-10 border-t border-white/10">
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} className={`p-3 rounded-full active:bg-white/10 transition-colors ${showEmojis ? roleTheme.text + ' bg-white/10' : 'text-white/50 hover:text-white'}`}>
            <FaSmile className="text-xl md:text-2xl" />
          </button>

          <form onSubmit={handleSendMessage} className="flex-1 flex gap-2 md:gap-3">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => setShowEmojis(false)}
              placeholder="Transmit message..." 
              className={`flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3.5 text-white text-base md:text-[15px] outline-none placeholder-white/40 focus:bg-black/60 focus:border-${isDonor ? 'teal' : 'blue'}-500 transition-all shadow-inner`}
              autoComplete="off"
            />
            
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${
                editingMessage ? 'bg-orange-500 shadow-orange-500/30' : `bg-gradient-to-r ${roleTheme.primary} ${roleTheme.shadow}`
              } disabled:opacity-30 disabled:active:scale-100 shrink-0`}
            >
              {editingMessage ? <FaCheckDouble className="text-[16px]" /> : <FaPaperPlane className="text-[15px] -ml-1 mt-0.5" />}
            </button>
          </form>
        </div>

      </div>
    </Layout>
  );
};

export default Chat;