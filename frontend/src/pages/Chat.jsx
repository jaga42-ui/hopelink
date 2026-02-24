import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import EmojiPicker from 'emoji-picker-react';
import { FaPaperPlane, FaArrowLeft, FaSpinner, FaSmile, FaCheckDouble, FaCheck, FaChevronDown, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

import api from '../utils/api';

const SOCKET_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000' 
  : 'https://hopelink-api.onrender.com';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || !otherUserId) {
      navigate('/dashboard');
      return;
    }

    socket = io(SOCKET_URL);
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
      toast.error('Failed to send message'); 
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Delete this message?")) {
      try {
        await api.delete(`/chat/${msgId}`);
        socket.emit('delete_message', { id: msgId, donationId });
        setMessages((prev) => prev.filter(msg => msg._id !== msgId));
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
      {/* MOBILE-FIRST CONTAINER: Dynamic Viewport Height (dvh) so keyboard doesn't break UI */}
      <div className="w-full h-[calc(100dvh-70px)] md:h-[85vh] md:max-w-4xl md:mx-auto md:my-4 flex flex-col bg-[#0b141a] md:border md:border-white/10 md:rounded-2xl overflow-hidden md:shadow-2xl relative">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundRepeat: 'repeat' }}></div>

        {/* CHAT HEADER */}
        <header className="bg-[#202c33] p-3 md:p-4 flex items-center justify-between z-10 shadow-sm border-b border-white/5">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => navigate('/chat/inbox')} className="text-[#aebac1] hover:text-white transition-colors p-2 active:scale-90">
              <FaArrowLeft className="text-xl" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${otherUserId}`)}>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#6b7c85] flex items-center justify-center text-white font-black text-lg md:text-xl uppercase shadow-inner shrink-0">
                {otherUserName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] md:text-[17px] font-semibold text-[#e9edef] leading-tight truncate max-w-[150px] sm:max-w-xs">{otherUserName}</h2>
                <p className="text-[#8696a0] text-[11px] md:text-[13px] truncate max-w-[150px] sm:max-w-xs">Re: {itemTitle}</p>
              </div>
            </div>
          </div>
        </header>

        {/* MESSAGES AREA */}
        <div 
          className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 z-10 no-scrollbar relative"
          onClick={() => { setDropdownOpen(null); setShowEmojis(false); }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full"><FaSpinner className="animate-spin text-4xl text-teal-500" /></div>
          ) : activeConversation.length === 0 ? (
            <div className="flex justify-center mt-10">
              <div className="bg-[#182229] text-[#8696a0] text-xs md:text-[13px] px-6 py-3 rounded-xl text-center shadow-sm border border-white/5">
                Start the conversation securely on HopeLink.
              </div>
            </div>
          ) : (
            activeConversation.map((msg, index) => {
              const isMe = msg.sender === user._id;
              
              return (
                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                  
                  <div className={`relative max-w-[85%] md:max-w-[70%] px-3 md:px-4 py-2 shadow-sm flex flex-col group ${
                    isMe ? 'bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-sm' : 'bg-[#202c33] text-[#e9edef] rounded-2xl rounded-tl-sm'
                  }`}>
                    
                    {/* FIXED: Touch-Friendly Dropdown Toggle */}
                    {isMe && (
                      <div className="absolute top-1 right-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === msg._id ? null : msg._id); }}
                          // md:opacity-0 hides it on desktop until hover. On mobile, it's always slightly visible (opacity-50)
                          className="text-white/50 hover:text-white p-2 md:p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity active:bg-white/10 rounded-full"
                        >
                          <FaChevronDown className="text-[10px] md:text-[12px]" />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen === msg._id && (
                          <div className="absolute right-0 top-8 bg-[#233138] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden w-28 md:w-32">
                            <button 
                              onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); setDropdownOpen(null); }} 
                              className="px-4 py-3 md:py-2 text-xs text-white active:bg-white/10 md:hover:bg-white/5 text-left flex items-center gap-2"
                            ><FaEdit /> Edit</button>
                            <button 
                              onClick={() => { handleDeleteMessage(msg._id); setDropdownOpen(null); }} 
                              className="px-4 py-3 md:py-2 text-xs text-red-400 active:bg-white/10 md:hover:bg-white/5 text-left flex items-center gap-2 border-t border-white/5"
                            ><FaTrash /> Delete</button>
                          </div>
                        )}
                      </div>
                    )}

                    <p className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${isMe ? 'pr-6 md:pr-4' : ''}`}>
                      {msg.content}
                    </p>
                    
                    <div className="flex justify-end items-center gap-1 mt-1 opacity-70">
                      <span className="text-[9px] md:text-[10px]">{formatTime(msg.createdAt)}</span>
                      {isMe && (
                        msg.read ? <FaCheckDouble className="text-[#53bdeb] text-[10px] md:text-[12px]" /> : <FaCheck className="text-white/40 text-[10px] md:text-[12px]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* EMOJI PICKER: Responsive Width */}
        {showEmojis && (
          <div className="absolute bottom-16 md:bottom-20 left-0 right-0 md:left-4 md:right-auto z-50 shadow-2xl flex justify-center md:block">
            {/* The wrapper forces the picker to not overflow the phone screen */}
            <div className="w-full md:w-[320px]">
               <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width="100%" height={350} />
            </div>
          </div>
        )}

        {/* EDIT BANNER */}
        {editingMessage && (
          <div className="bg-[#182229] px-4 py-2.5 flex justify-between items-center border-t border-white/10 z-10 shadow-lg">
            <span className="text-teal-400 text-xs md:text-sm font-bold flex items-center gap-2"><FaEdit /> Editing message...</span>
            <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-white/50 active:text-white hover:text-white p-2 bg-white/5 rounded-full">
              <FaTimes className="text-xs" />
            </button>
          </div>
        )}

        {/* INPUT AREA */}
        <div className="bg-[#202c33] p-2 md:p-3 flex items-center gap-2 md:gap-3 z-10 border-t border-white/5 mb-safe">
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} className={`p-2.5 rounded-full active:bg-white/5 transition-colors ${showEmojis ? 'text-teal-500 bg-white/5' : 'text-[#8696a0]'}`}>
            <FaSmile className="text-xl md:text-2xl" />
          </button>

          <form onSubmit={handleSendMessage} className="flex-1 flex gap-2 md:gap-3">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => setShowEmojis(false)}
              placeholder="Message" 
              className="flex-1 bg-[#2a3942] rounded-full px-4 md:px-5 py-2.5 md:py-3 text-[#e9edef] text-[14px] md:text-[15px] outline-none placeholder-[#8696a0] focus:ring-1 focus:ring-teal-500/50 transition-all"
              autoComplete="off"
            />
            
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white transition-all shadow-md shrink-0 active:scale-95 ${
                editingMessage ? 'bg-blue-600' : 'bg-teal-600'
              } disabled:bg-[#2a3942] disabled:text-[#8696a0] disabled:shadow-none`}
            >
              {editingMessage ? <FaCheckDouble className="text-[14px] md:text-[16px]" /> : <FaPaperPlane className="text-[12px] md:text-[16px] -ml-0.5 md:-ml-1 mt-0.5" />}
            </button>
          </form>
        </div>

      </div>
    </Layout>
  );
};

export default Chat;