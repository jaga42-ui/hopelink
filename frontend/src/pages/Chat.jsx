import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import EmojiPicker from 'emoji-picker-react';
import { FaPaperPlane, FaArrowLeft, FaSpinner, FaSmile, FaCheckDouble, FaCheck, FaChevronDown, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
import api from '../utils/api';

// 👉 DYNAMIC SOCKET URL: Switches automatically just like your API!
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

    // 1. Initialize Connection (Using the dynamic URL)
    socket = io(SOCKET_URL);
    socket.emit('join_chat', { userId: user._id, donationId });

    // 2. Fetch History & Clear Unread Status
    const fetchHistoryAndMarkRead = async () => {
      try {
        // 👉 CLEAN REQUEST: No headers, no localhost
        const { data } = await api.get(`/chat/${donationId}`);
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);

        // Mark as Read in Database
        await api.put(`/chat/${donationId}/read`);
        
        // Emit Read Receipt to Sender
        socket.emit('mark_as_read', { donationId, readerId: user._id });

      } catch (error) {
        setMessages([]); 
        setLoading(false);
      }
    };

    fetchHistoryAndMarkRead();

    // 3. Listeners for real-time syncing
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...(Array.isArray(prev) ? prev : []), message]);
      
      // If we receive a message while looking at the chat, mark it read instantly
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
        // 👉 CLEAN REQUEST
        const { data } = await api.put(`/chat/${editingMessage._id}`, { content: newMessage });
        socket.emit('edit_message', data);
        setMessages((prev) => prev.map(msg => msg._id === data._id ? data : msg));
        setEditingMessage(null);
      } else {
        const messageData = { receiverId: otherUserId, donationId, content: newMessage };
        // 👉 CLEAN REQUEST
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
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        // 👉 CLEAN REQUEST
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
      <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-[#0b141a] border border-white/10 sm:rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundRepeat: 'repeat' }}></div>

        {/* CHAT HEADER */}
        <header className="bg-[#202c33] p-4 flex items-center justify-between z-10 shadow-sm border-b border-white/10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/chat/inbox')} className="text-[#aebac1] hover:text-white transition-colors p-2 -ml-2">
              <FaArrowLeft className="text-xl" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#6b7c85] flex items-center justify-center text-white font-bold text-xl uppercase shadow-inner">
                {otherUserName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[17px] font-semibold text-[#e9edef] leading-tight">{otherUserName}</h2>
                <p className="text-[#8696a0] text-[13px] truncate max-w-[200px] md:max-w-sm">Re: {itemTitle}</p>
              </div>
            </div>
          </div>
        </header>

        {/* MESSAGES AREA */}
        <div 
          className="flex-1 overflow-y-auto p-4 md:px-[8%] space-y-4 z-10 no-scrollbar relative"
          onClick={() => setDropdownOpen(null)}
        >
          {loading ? (
            <div className="flex justify-center items-center h-40"><FaSpinner className="animate-spin text-4xl text-teal-500" /></div>
          ) : activeConversation.length === 0 ? (
            <div className="flex justify-center mt-10">
              <div className="bg-[#182229] text-[#8696a0] text-[13px] px-6 py-3 rounded-lg text-center shadow-sm border border-white/5">
                Send a message to start the conversation!
              </div>
            </div>
          ) : (
            activeConversation.map((msg, index) => {
              const isMe = msg.sender === user._id;
              
              return (
                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                  
                  {/* The Message Bubble */}
                  <div className={`relative max-w-[85%] sm:max-w-[70%] px-3 py-2 shadow-sm flex flex-col group ${
                    isMe ? 'bg-[#005c4b] text-[#e9edef] rounded-xl rounded-tr-sm' : 'bg-[#202c33] text-[#e9edef] rounded-xl rounded-tl-sm'
                  }`}>
                    
                    {/* Edit/Delete Dropdown Toggle */}
                    {isMe && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === msg._id ? null : msg._id); }}
                          className="text-white/50 hover:text-white p-1"
                        >
                          <FaChevronDown className="text-[12px]" />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen === msg._id && (
                          <div className="absolute right-0 top-6 bg-[#233138] border border-white/10 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden w-28">
                            <button 
                              onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); setDropdownOpen(null); }} 
                              className="px-4 py-2 text-xs text-white hover:bg-white/5 text-left flex items-center gap-2"
                            ><FaEdit /> Edit</button>
                            <button 
                              onClick={() => { handleDeleteMessage(msg._id); setDropdownOpen(null); }} 
                              className="px-4 py-2 text-xs text-red-400 hover:bg-white/5 text-left flex items-center gap-2 border-t border-white/5"
                            ><FaTrash /> Delete</button>
                          </div>
                        )}
                      </div>
                    )}

                    <p className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${isMe ? 'pr-4' : ''}`}>
                      {msg.content}
                    </p>
                    
                    <div className="flex justify-end items-center gap-1 mt-1 opacity-70">
                      <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                      {isMe && (
                        msg.read ? (
                          <FaCheckDouble className="text-[#53bdeb] text-[12px]" />
                        ) : (
                          <FaCheck className="text-white/40 text-[12px]" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {showEmojis && (
          <div className="absolute bottom-20 left-4 z-50 shadow-2xl">
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={320} height={400} />
          </div>
        )}

        {/* "Editing Message" Banner */}
        {editingMessage && (
          <div className="bg-[#182229] px-4 py-2 flex justify-between items-center border-t border-white/10 z-10">
            <span className="text-teal-400 text-sm font-bold flex items-center gap-2"><FaEdit /> Editing message</span>
            <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-white/50 hover:text-white p-1">
              <FaTimes />
            </button>
          </div>
        )}

        {/* INPUT AREA */}
        <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 z-10 border-t border-white/10">
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} className={`p-2 transition-colors ${showEmojis ? 'text-teal-500' : 'text-[#8696a0] hover:text-[#aebac1]'}`}>
            <FaSmile className="text-2xl" />
          </button>

          <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => setShowEmojis(false)}
              placeholder="Type a message..." 
              className="flex-1 bg-[#2a3942] rounded-xl px-5 py-3 text-[#e9edef] text-[15px] outline-none placeholder-[#8696a0] shadow-inner focus:ring-1 focus:ring-teal-500/50 transition-all"
              autoComplete="off"
            />
            
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-md shrink-0 ${
                editingMessage ? 'bg-blue-600 hover:bg-blue-500' : 'bg-teal-600 hover:bg-teal-500'
              } disabled:bg-[#2a3942] disabled:text-[#8696a0]`}
            >
              {editingMessage ? <FaCheckDouble className="text-[16px]" /> : <FaPaperPlane className="text-[16px] -ml-1 mt-0.5" />}
            </button>
          </form>
        </div>

      </div>
    </Layout>
  );
};

export default Chat;