import { useState, useEffect, useContext } from 'react';
import axios from 'axios'; // 👉 Kept ONLY for the external OpenStreetMap API
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; 
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  FaHeartbeat, FaMapMarkerAlt, FaCommentDots, FaSpinner, FaTimes, 
  FaExclamationTriangle, FaTrash, FaBoxOpen, FaLocationArrow, 
  FaEnvelope, FaCheckCircle, FaLeaf, FaCalendarAlt, FaClock, FaTags, 
  FaBook, FaSearch, FaLock, FaStar, FaUsers, FaBell, FaRunning 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
import api from '../utils/api';

// 👉 DYNAMIC URLS for Sockets and Images
const BACKEND_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000' 
  : 'https://hopelink-api.onrender.com';

const Dashboard = () => {
  // 👉 PULLED `switchRole` DIRECTLY FROM YOUR CONTEXT!
  const { user, switchRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [unreadCount, setUnreadCount] = useState(0);

  const [responders, setResponders] = useState([]);

  const [filterCategory, setFilterCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('urgent'); 
  
  const [showSOS, setShowSOS] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosData, setSosData] = useState({
    bloodGroup: '', quantity: '', hospital: '', addressText: '', description: ''
  });

  const [fulfillModal, setFulfillModal] = useState({ isOpen: false, donationId: null, pin: '', rating: 5 });
  const [requestsModal, setRequestsModal] = useState({ isOpen: false, donation: null });

  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null); 

  useEffect(() => {
    if (!user?.token) return;

    const fetchDashboardData = async () => {
      try {
        // 👉 CLEAN REQUESTS: No manual headers or localhost
        const { data: feedData } = await api.get('/donations/feed');
        setFeed(Array.isArray(feedData) ? feedData : []);
        
        const { data: inboxData } = await api.get('/chat/inbox');
        if (Array.isArray(inboxData)) {
          const totalUnread = inboxData.reduce((acc, chat) => acc + chat.unreadCount, 0);
          setUnreadCount(totalUnread);
        }

        setLoading(false);
      } catch (error) { setLoading(false); }
    };
    
    fetchDashboardData();
  }, [user]);

  // Socket Listener for Chat AND SOS Responders
  useEffect(() => {
    if (!user) return;
    
    // 👉 DYNAMIC SOCKET CONNECTION
    const socket = io(BACKEND_URL);
    socket.emit('setup', user._id);
    
    socket.on('new_message_notification', () => {
      setUnreadCount(prev => prev + 1);
      
      toast('💬 New Message Received!', {
        position: 'top-right',
        style: { 
          borderRadius: '1rem', 
          background: '#111', 
          color: '#fff', 
          border: '1px solid rgba(20, 184, 166, 0.5)',
          boxShadow: '0 0 20px rgba(20, 184, 166, 0.2)'
        }
      });
    });

    socket.on('donor_coming', (data) => {
      setResponders(prev => [...prev, data]);
      toast.success(`${data.donorName} is en route to help! 🦸‍♂️`, { 
        duration: 8000,
        style: { background: '#dc2626', color: '#fff', fontWeight: 'bold' } 
      });
    });

    return () => socket.disconnect();
  }, [user]);

  // Push Notification Helpers
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error("Push notifications are not supported by this browser.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("Permission denied. We can't send you alerts.");
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      await api.post('/auth/subscribe', subscription);

      toast.success("Notifications enabled! You will now receive background alerts.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to enable notifications.");
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        toast(
          (t) => (
            <div className="flex flex-col items-center gap-3 p-2">
              <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center text-xl mb-1">
                <FaBell className="animate-pulse" />
              </div>
              <p className="font-black text-sm text-center tracking-wide text-white">
                STAY CONNECTED
              </p>
              <p className="text-xs text-center text-white/60 mb-2">
                Enable background alerts so you never miss a critical message or community request.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { 
                    toast.dismiss(t.id); 
                    subscribeToPush(); 
                  }} 
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-teal-500/20"
                >
                  Enable Now
                </button>
                <button 
                  onClick={() => toast.dismiss(t.id)} 
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors border border-white/10"
                >
                  Later
                </button>
              </div>
            </div>
          ),
          { 
            duration: Infinity, 
            position: 'top-center', 
            style: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', minWidth: '320px', borderRadius: '1.5rem' } 
          }
        );
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser'); return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`);
          const cityString = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown Location';
          setSosData(prev => ({ ...prev, addressText: cityString }));
          toast.success(`Location locked: ${cityString}`);
        } catch (error) { toast.error("Could not resolve location address"); } 
        finally { setIsFetchingLocation(false); }
      },
      () => { setIsFetchingLocation(false); toast.error('Please allow location permissions'); }
    );
  };

  const handleLocationType = (e) => {
    const val = e.target.value;
    setSosData(prev => ({ ...prev, addressText: val }));
    if (typingTimeout) clearTimeout(typingTimeout); 
    if (val.length > 2) {
      const newTimer = setTimeout(async () => {
        try {
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&limit=4&email=hopelink.dev@example.com`);
          setSuggestions(data);
        } catch (error) { console.error("Autocomplete failed"); }
      }, 600); 
      setTypingTimeout(newTimer);
    } else { setSuggestions([]); }
  };

  const handleSelectSuggestion = (locationName) => {
    const cleanName = locationName.split(',')[0]; 
    setSosData(prev => ({ ...prev, addressText: cleanName }));
    setSuggestions([]); 
  };

  const handleSOSSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('listingType', 'request');
      formData.append('category', 'blood');
      formData.append('isEmergency', 'true');
      formData.append('bloodGroup', sosData.bloodGroup);
      formData.append('quantity', `${sosData.quantity} Units`);
      formData.append('title', `URGENT: ${sosData.bloodGroup} Blood Needed!`);
      formData.append('description', sosData.description);
      formData.append('addressText', `${sosData.hospital}, ${sosData.addressText}`);

      const { data } = await api.post('/donations', formData);
      
      setFeed([data, ...feed]);
      setShowSOS(false);
      setSosData({ bloodGroup: '', quantity: '', hospital: '', addressText: '', description: '' });
      toast.success("EMERGENCY BROADCAST SENT!");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to broadcast SOS"); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await api.delete(`/donations/${id}`);
        setFeed(feed.filter(item => item._id !== id));
        toast.success("Listing successfully removed.");
      } catch (error) { toast.error("Failed to delete the listing."); }
    }
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/donations/${fulfillModal.donationId}/fulfill`, { 
        pin: fulfillModal.pin,
        rating: fulfillModal.rating 
      });
      
      setFeed(feed.filter(item => item._id !== fulfillModal.donationId));
      toast.success("Handshake Verified! Points & Rating applied 🌟");
      setFulfillModal({ isOpen: false, donationId: null, pin: '', rating: 5 });
    } catch (error) { 
      toast.error(error.response?.data?.message || "Incorrect PIN"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestItem = async (donationId) => {
    try {
      await api.post(`/donations/${donationId}/request`, {});
      
      setFeed(feed.map(item => 
        item._id === donationId 
          ? { ...item, requestedBy: [...(item.requestedBy || []), { _id: user._id, name: user.name }] } 
          : item
      ));
      
      toast.success("Request sent! The donor will be notified.");
    } catch (error) { 
      toast.error(error.response?.data?.message || "Failed to send request"); 
    }
  };

  const handleApproveRequest = async (donationId, receiverId) => {
    try {
      const { data } = await api.patch(`/donations/${donationId}/approve`, { receiverId });
      
      const receiverName = requestsModal.donation.requestedBy.find(r => r._id === receiverId)?.name || 'Receiver';

      setFeed(feed.map(item => item._id === donationId ? { ...item, status: 'pending', receiverId: receiverId } : item));
      setRequestsModal({ isOpen: false, donation: null });
      toast.success("Approved! You can now chat with them.");
      
      navigate(`/chat/${data.chatRoomId}`, {
        state: {
          otherUserId: receiverId,
          otherUserName: receiverName,
          itemTitle: requestsModal.donation.title
        }
      });
    } catch (error) { toast.error(error.response?.data?.message || "Approval failed"); }
  };

  const processedFeed = feed
    .filter(item => filterCategory === 'All' ? true : item.category?.toLowerCase() === filterCategory.toLowerCase())
    .sort((a, b) => {
      if (sortOrder === 'urgent') {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-24 relative">
        
        {/* LIVE RESPONDER HUD (Hero Tracking Panel) */}
        <div className="fixed top-24 right-8 z-[100] w-72 space-y-3 pointer-events-none">
          <AnimatePresence>
            {responders.map((res, i) => (
              <motion.div 
                key={i} 
                initial={{ x: 100, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-red-600 border border-red-400 p-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
                  <FaRunning className="text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-white/70 font-black uppercase tracking-widest">En Route to Help</p>
                  <p className="text-sm font-bold text-white truncate">{res.donorName}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
              COMMUNITY <span className={user.activeRole === 'donor' ? 'text-teal-400' : 'text-blue-400'}>FEED.</span>
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
            
            {/* 👉 THE NEW ROLE SWITCHER ANIMATED TOGGLE */}
            {user && !user.isAdmin && (
              <button 
                onClick={() => {
                  switchRole();
                  // A slight delay to ensure context state updates before navigating/refreshing UI feel
                  setTimeout(() => window.location.reload(), 300);
                }}
                className="px-6 py-4 bg-[#111] border border-white/10 rounded-full flex items-center gap-3 hover:bg-white/5 transition-all shadow-lg"
                title="Switch Role"
              >
                <span className={`text-[10px] font-black uppercase tracking-widest ${user.activeRole === 'donor' ? 'text-teal-400' : 'text-white/30'}`}>Donor</span>
                
                <div className="w-10 h-5 bg-black rounded-full relative border border-white/20">
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${user.activeRole === 'donor' ? 'bg-teal-400 left-0.5' : 'bg-blue-400 left-[22px]'}`}></div>
                </div>
                
                <span className={`text-[10px] font-black uppercase tracking-widest ${user.activeRole === 'receiver' ? 'text-blue-400' : 'text-white/30'}`}>Receiver</span>
              </button>
            )}

            <button 
              onClick={subscribeToPush} 
              className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-white transition-all shadow-lg flex items-center justify-center group" 
              title="Enable Background Notifications"
            >
              <FaBell className="text-xl text-yellow-400 group-hover:scale-110 transition-transform" />
            </button>

            {user.activeRole === 'donor' && (
              <button 
                onClick={() => navigate('/donations')} 
                className="px-8 py-4 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-full font-black uppercase tracking-widest text-sm hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <FaBoxOpen className="text-xl" /> Post an Item
              </button>
            )}
            
            <button onClick={() => setShowSOS(true)} className="group relative px-8 py-4 bg-red-600 rounded-full font-black text-white uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <FaHeartbeat className="text-xl animate-pulse" /> Emergency SOS
            </button>
          </div>
        </header>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-[#111] p-4 rounded-3xl border border-white/10">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
            {['All', 'Blood', 'Food', 'Clothes', 'Book'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${
                  filterCategory === cat 
                    ? 'bg-white text-black shadow-lg shadow-white/20' 
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 border-t border-white/10 md:border-0 pt-4 md:pt-0">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Sort By:</span>
             <select
               value={sortOrder}
               onChange={(e) => setSortOrder(e.target.value)}
               className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-bold outline-none focus:border-white/30 appearance-none cursor-pointer"
             >
               <option value="urgent">Urgent First</option>
               <option value="newest">Newest First</option>
             </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-teal-500" /></div>
        ) : processedFeed.length === 0 ? (
          <div className="text-center py-20 text-white/40 font-bold uppercase tracking-widest">
            No {filterCategory !== 'All' ? filterCategory : ''} listings found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {processedFeed.map((item) => {
              
              const isEmergency = item.isEmergency;
              const isRequest = item.listingType === 'request' && !isEmergency;

              let cardStyle = 'bg-[#111] border-white/10 hover:border-white/20 shadow-xl'; 
              let badgeStyle = 'bg-teal-500/20 text-teal-400';
              let buttonStyle = 'bg-white/5 hover:bg-white/10 text-white';

              if (isEmergency) {
                cardStyle = 'bg-red-500/5 border-red-500/30 border shadow-lg';
                badgeStyle = 'bg-red-500 text-white';
                buttonStyle = 'bg-red-600 hover:bg-red-500 text-white';
              } else if (isRequest) {
                cardStyle = 'bg-[#0f172a] border-blue-500/30 border shadow-lg';
                badgeStyle = 'bg-blue-500/20 text-blue-400';
                buttonStyle = 'bg-blue-600 hover:bg-blue-500 text-white';
              }

              return (
                <div key={item._id} className={`rounded-[2rem] p-6 flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 border ${cardStyle}`}>
                  
                  {isEmergency && (
                    <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-2 z-10">
                      <FaExclamationTriangle /> Critical Emergency
                    </div>
                  )}
                  {isRequest && (
                    <div className="absolute top-0 left-0 w-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] text-center py-1 flex items-center justify-center gap-2 z-10">
                      <FaSearch /> Community Request
                    </div>
                  )}
                  
                  <div className={`${isEmergency || isRequest ? 'mt-6' : 'mt-0'} flex justify-between items-start mb-4`}>
                    <div className="flex items-center gap-3">
                      {item.donorId?.profilePic ? (
                        <img src={item.donorId.profilePic} alt="User" className="w-10 h-10 rounded-xl object-cover border border-white/10" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-white/50 uppercase">{item.donorId?.name?.charAt(0) || '?'}</div>
                      )}
                      <div>
                        <p className="text-white font-bold text-sm">{item.donorId?.name || 'Unknown User'}</p>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{item.category}</p>
                      </div>
                    </div>
                    {item.bloodGroup && <div className={`px-3 py-1 rounded-full text-xs font-black z-10 ${badgeStyle}`}>{item.bloodGroup}</div>}
                  </div>

                  {item.image ? (
                    <div className="w-full h-48 mb-4 rounded-xl overflow-hidden border border-white/5 relative group flex-shrink-0">
                      <img 
                        src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </div>
                  ) : item.category === 'blood' ? (
                    <div className="w-full h-48 mb-4 rounded-xl overflow-hidden border border-red-500/20 bg-gradient-to-br from-red-900/40 to-[#111] flex flex-col items-center justify-center relative group flex-shrink-0">
                      <FaHeartbeat className="text-6xl text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] mb-3" />
                      <span className="text-4xl font-black text-white drop-shadow-md tracking-tighter">{item.bloodGroup || 'BLOOD'}</span>
                      <span className="text-red-400 text-[10px] uppercase font-black tracking-[0.4em] mt-2">Required Immediately</span>
                    </div>
                  ) : null}

                  <h3 className="text-xl font-black text-white mb-2 leading-tight">{item.title}</h3>
                  {item.quantity && <p className="text-white/80 font-bold text-xs mb-3">Qty: <span className="text-white">{item.quantity}</span></p>}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.foodType && (
                      <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        <FaLeaf className={item.foodType === 'Veg' ? 'text-green-400' : 'text-orange-400'} /> {item.foodType}
                      </span>
                    )}
                    {item.expiryDate && (
                      <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        <FaCalendarAlt className="text-red-400" /> Exp: {new Date(item.expiryDate).toLocaleDateString()}
                      </span>
                    )}
                    {item.bookAuthor && (
                      <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        <FaBook className="text-blue-400" /> {item.bookAuthor}
                      </span>
                    )}
                    {item.condition && (
                      <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        <FaTags className="text-purple-400" /> {item.condition}
                      </span>
                    )}
                    {item.pickupTime && (
                      <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        <FaClock className="text-yellow-400" /> {item.pickupTime}
                      </span>
                    )}
                  </div>

                  <p className="text-white/60 text-sm mb-6 flex-1 line-clamp-3">{item.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold max-w-[45%]">
                      <FaMapMarkerAlt className="flex-shrink-0" />
                      <span className="truncate">{item.location?.addressText || item.donorId?.addressText || 'Location Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.donorId?._id === user._id ? (
                        <>
                          {item.status === 'active' && item.requestedBy?.length > 0 && (
                            <button onClick={() => setRequestsModal({ isOpen: true, donation: item })} className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center gap-2 border border-blue-500/30">
                              <FaUsers /> Requests <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{item.requestedBy.length}</span>
                            </button>
                          )}
                          {item.status === 'pending' && (
                            <button 
                              onClick={() => {
                                const approvedUser = item.requestedBy?.find(r => r._id === item.receiverId) || {};
                                navigate(`/chat/${item._id}_${item.receiverId}`, {
                                  state: {
                                    otherUserId: item.receiverId,
                                    otherUserName: approvedUser.name || 'Receiver',
                                    itemTitle: item.title
                                  }
                                });
                              }} 
                              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white flex items-center gap-2 border border-teal-500/30"
                            >
                              <FaCommentDots /> Chat
                            </button>
                          )}
                          <button onClick={() => setFulfillModal({ isOpen: true, donationId: item._id, pin: '', rating: 5 })} className="px-3 py-2 rounded-xl text-xs font-black uppercase transition-all bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white" title="Mark as Fulfilled">
                            <FaCheckCircle className="text-lg" />
                          </button>
                          <button onClick={() => handleDeletePost(item._id)} className="px-3 py-2 rounded-xl text-xs font-black uppercase transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" title="Delete Post">
                            <FaTrash className="text-lg" />
                          </button>
                        </>
                      ) : (
                        <>
                          {item.status === 'active' ? (
                            item.requestedBy?.some(req => req._id === user._id) ? (
                              <button disabled className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white/5 text-white/30 cursor-not-allowed border border-white/5">
                                Pending...
                              </button>
                            ) : (
                              <button onClick={() => handleRequestItem(item._id)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${buttonStyle}`}>
                                <FaCommentDots /> {isRequest ? 'Offer Help' : 'Request Item'}
                              </button>
                            )
                          ) : item.receiverId === user._id ? (
                            <>
                              <div className="flex flex-col items-end mr-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Handshake PIN</span>
                                <span className="text-xs font-black text-white bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30">{item.pickupPIN}</span>
                              </div>
                              <button onClick={() => navigate(`/chat/${item._id}_${user._id}`)} className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white">
                                <FaCommentDots /> Open Chat
                              </button>
                            </>
                          ) : (
                            <button disabled className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-yellow-500/10 text-yellow-500/50 cursor-not-allowed border border-yellow-500/10">Reserved</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => navigate('/chat/inbox')} className="fixed bottom-8 right-8 z-40 bg-teal-500 hover:bg-teal-400 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.4)] hover:scale-110 transition-transform">
          <div className="relative">
            <FaEnvelope className="text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-[#111]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </button>

        {/* SOS MODAL OVERLAY */}
        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSOS(false)} />
              
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#111] border-2 border-red-500/30 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-visible">
                <button onClick={() => setShowSOS(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"><FaTimes className="text-xl" /></button>

                <div className="flex items-center gap-4 mb-6 text-red-500">
                  <FaHeartbeat className="text-4xl animate-pulse" />
                  <h2 className="text-2xl font-black italic tracking-tighter text-white">EMERGENCY <br/>BROADCAST</h2>
                </div>

                <form onSubmit={handleSOSSubmit} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Blood Group</label>
                      <select required value={sosData.bloodGroup} onChange={e => setSosData({...sosData, bloodGroup: e.target.value})} className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer">
                        <option value="" disabled className="bg-[#111] text-white">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg} className="bg-[#111] text-white">{bg}</option>)}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Units</label>
                      <input required type="number" min="1" placeholder="e.g. 2" value={sosData.quantity} onChange={e => setSosData({...sosData, quantity: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-white/30 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Hospital Name</label>
                    <input required value={sosData.hospital} onChange={e => setSosData({...sosData, hospital: e.target.value})} placeholder="e.g. Apollo Hospital" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-white/30 transition-colors" />
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">City / Area</label>
                    <div className="flex gap-2">
                      <input required value={sosData.addressText} onChange={handleLocationType} placeholder="Type city or use GPS..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-white/30 transition-colors" />
                      <button type="button" onClick={handleGetLocation} disabled={isFetchingLocation} className="px-5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center" title="Use GPS">
                        {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        {suggestions.map((s, index) => (
                          <div key={index} onClick={() => handleSelectSuggestion(s.display_name)} className="px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 truncate">{s.display_name}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Patient Details</label>
                    <textarea required value={sosData.description} onChange={e => setSosData({...sosData, description: e.target.value})} placeholder="Require urgent blood for surgery..." rows="3" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-white/30 transition-colors resize-none"></textarea>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full mt-4 py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-white uppercase tracking-widest text-sm transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-3">
                    {isSubmitting ? <FaSpinner className="animate-spin text-xl" /> : <><FaExclamationTriangle /> Send Alert to Network</>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SECURE OTP MODAL */}
        <AnimatePresence>
          {fulfillModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setFulfillModal({ isOpen: false, donationId: null, pin: '', rating: 5 })} />
              
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(20,184,166,0.1)] text-center">
                <button onClick={() => setFulfillModal({ isOpen: false, donationId: null, pin: '', rating: 5 })} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"><FaTimes className="text-xl" /></button>

                <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-teal-500/20">
                  <FaLock />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">SECURE HANDSHAKE</h2>
                <p className="text-white/50 text-xs font-bold leading-relaxed mb-6">To claim your impact points, enter the 4-digit PIN provided by the person who received your item.</p>

                <form onSubmit={handleFulfillSubmit}>
                  <input type="text" required maxLength="4" placeholder="ENTER 4-DIGIT PIN" value={fulfillModal.pin} onChange={e => setFulfillModal({...fulfillModal, pin: e.target.value.replace(/\D/g, '')})} className="w-full bg-black/40 border-2 border-dashed border-white/20 rounded-2xl px-5 py-4 text-center text-white text-2xl tracking-[0.5em] font-black outline-none focus:border-teal-500 transition-colors mb-4" />

                  <div className="mb-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <p className="text-white/50 text-[10px] uppercase font-black tracking-widest mb-3">Rate the Receiver</p>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FaStar key={star} onClick={() => setFulfillModal({...fulfillModal, rating: star})} className={`text-3xl cursor-pointer transition-transform hover:scale-110 ${fulfillModal.rating >= star ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-white/10'}`} />
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting || fulfillModal.pin.length !== 4} className="w-full py-4 bg-teal-500 hover:bg-teal-400 rounded-2xl font-black text-white uppercase tracking-widest text-sm transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
                    {isSubmitting ? <FaSpinner className="animate-spin text-xl" /> : <><FaCheckCircle /> Verify & Complete</>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* REQUESTS MODAL */}
        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setRequestsModal({ isOpen: false, donation: null })} />
              
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                <button onClick={() => setRequestsModal({ isOpen: false, donation: null })} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"><FaTimes className="text-xl" /></button>

                <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">COMMUNITY REQUESTS</h2>
                <p className="text-white/50 text-xs font-bold leading-relaxed mb-6">Choose one person to connect with for <span className="text-white">"{requestsModal.donation.title}"</span>. Approving a request opens a private chat and reserves the item.</p>

                <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-2">
                  {requestsModal.donation.requestedBy.map((requester) => (
                    <div key={requester._id} className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        {requester.profilePic ? (
                          <img src={requester.profilePic} alt="User" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-white/50 uppercase">{requester.name?.charAt(0) || '?'}</div>
                        )}
                        <span className="text-white font-bold text-sm">{requester.name}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleApproveRequest(requestsModal.donation._id, requester._id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
};

export default Dashboard;