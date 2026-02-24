import { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
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

import api from '../utils/api';

// 👉 NO MORE LOCALHOST BULLSHIT. Hardwired to Production.
const BACKEND_URL = 'https://hopelink-api.onrender.com';

const Dashboard = () => {
  const { user, switchRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Local State for Buttery Smooth Role Toggle
  const [localRole, setLocalRole] = useState(user?.activeRole || 'donor');

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

  // Keep local role perfectly in sync with Context
  useEffect(() => {
    if (user?.activeRole) setLocalRole(user.activeRole);
  }, [user?.activeRole]);

  useEffect(() => {
    if (!user?.token) return;

    const fetchDashboardData = async () => {
      try {
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

  useEffect(() => {
    if (!user) return;
    
    // 👉 Socket hardwired to live Render URL
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socket.emit('setup', user._id);
    
    socket.on('new_message_notification', () => {
      setUnreadCount(prev => prev + 1);
      toast('💬 New Message Received!', {
        position: 'top-right',
        style: { borderRadius: '1rem', background: '#111', color: '#fff', border: '1px solid rgba(20, 184, 166, 0.5)' }
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

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error("Push notifications not supported."); return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("Permission denied."); return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      await api.post('/auth/subscribe', subscription);
      toast.success("Notifications enabled!");
    } catch (error) { toast.error("Failed to enable notifications."); }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`);
          const cityString = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown Location';
          setSosData(prev => ({ ...prev, addressText: cityString }));
          toast.success(`Location locked: ${cityString}`);
        } catch (error) { toast.error("Could not resolve address"); } 
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
        pin: fulfillModal.pin, rating: fulfillModal.rating 
      });
      setFeed(feed.filter(item => item._id !== fulfillModal.donationId));
      toast.success("Handshake Verified! Points & Rating applied 🌟");
      setFulfillModal({ isOpen: false, donationId: null, pin: '', rating: 5 });
    } catch (error) { toast.error(error.response?.data?.message || "Incorrect PIN"); } 
    finally { setIsSubmitting(false); }
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
    } catch (error) { toast.error(error.response?.data?.message || "Failed to send request"); }
  };

  const handleApproveRequest = async (donationId, receiverId) => {
    try {
      const { data } = await api.patch(`/donations/${donationId}/approve`, { receiverId });
      const receiverName = requestsModal.donation.requestedBy.find(r => r._id === receiverId)?.name || 'Receiver';
      setFeed(feed.map(item => item._id === donationId ? { ...item, status: 'pending', receiverId: receiverId } : item));
      setRequestsModal({ isOpen: false, donation: null });
      toast.success("Approved! You can now chat with them.");
      navigate(`/chat/${data.chatRoomId}`, {
        state: { otherUserId: receiverId, otherUserName: receiverName, itemTitle: requestsModal.donation.title }
      });
    } catch (error) { toast.error("Approval failed"); }
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
      <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-24 relative"> 
        
        {/* LIVE RESPONDER HUD */}
        <div className="fixed top-20 right-4 md:top-24 md:right-8 z-[100] w-56 md:w-72 space-y-3 pointer-events-none">
          <AnimatePresence>
            {responders.map((res, i) => (
              <motion.div 
                key={i} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-red-600 border border-red-400 p-3 md:p-4 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center text-white shrink-0">
                  <FaRunning className="text-lg md:text-xl" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[8px] md:text-[10px] text-white/70 font-black uppercase tracking-widest">En Route</p>
                  <p className="text-xs md:text-sm font-bold text-white truncate">{res.donorName}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* HEADER AREA */}
        <header className="mb-6 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase transition-colors duration-500">
              COMMUNITY <span className={localRole === 'donor' ? 'text-teal-400' : 'text-blue-400'}>FEED.</span>
            </h1>
          </div>
          
          <div className="w-full md:w-auto grid grid-cols-2 md:flex gap-3 md:gap-4 items-center">
            
            {/* OPTIMISTIC UI ROLE SWITCHER */}
            {user && !user.isAdmin && (
              <button 
                onClick={() => {
                  const newRole = localRole === 'donor' ? 'receiver' : 'donor';
                  setLocalRole(newRole);
                  switchRole();
                }}
                className="col-span-2 md:col-span-1 px-4 py-3 md:py-4 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center gap-3 active:bg-white/5 transition-all shadow-lg"
              >
                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${localRole === 'donor' ? 'text-teal-400' : 'text-white/30'}`}>Donor</span>
                <div className="w-10 h-5 bg-black rounded-full relative border border-white/20 shrink-0">
                  <div 
                    className={`absolute top-0.5 left-0 w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${
                      localRole === 'donor' ? 'bg-teal-400 translate-x-[3px]' : 'bg-blue-400 translate-x-[21px]'
                    }`}
                  ></div>
                </div>
                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${localRole === 'receiver' ? 'text-blue-400' : 'text-white/30'}`}>Receiver</span>
              </button>
            )}

            <button onClick={subscribeToPush} className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl active:bg-white/10 text-white transition-all shadow-lg flex items-center justify-center">
              <FaBell className="text-lg md:text-xl text-yellow-400" />
            </button>

            {localRole === 'donor' ? (
              <button onClick={() => navigate('/donations')} className="px-4 md:px-8 py-3 md:py-4 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-sm active:bg-teal-500 hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg">
                <FaBoxOpen className="text-lg" /> Post Item
              </button>
            ) : (
              <div className="hidden md:block w-full"></div> 
            )}
            
            <button onClick={() => setShowSOS(true)} className="col-span-2 md:col-span-1 group relative px-4 md:px-8 py-4 bg-red-600 rounded-2xl md:rounded-full font-black text-white uppercase tracking-widest text-xs md:text-sm shadow-[0_0_30px_rgba(220,38,38,0.4)] active:scale-95 hover:scale-105 transition-all flex items-center justify-center gap-2 overflow-hidden">
              <FaHeartbeat className="text-lg md:text-xl animate-pulse" /> Emergency SOS
            </button>
          </div>
        </header>

        {/* FILTERS & SORT */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8 bg-[#111] p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/10">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0 scroll-smooth">
            {['All', 'Blood', 'Food', 'Clothes', 'Book'].map(cat => (
              <button
                key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-5 py-2 md:py-2.5 rounded-xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${
                  filterCategory === cat ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/50 active:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 border-t border-white/10 md:border-0 pt-3 md:pt-0">
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40">Sort By:</span>
             <select
               value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
               className="bg-black/50 border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-white text-[10px] md:text-xs font-bold outline-none appearance-none"
             >
               <option value="urgent">Urgent First</option>
               <option value="newest">Newest First</option>
             </select>
          </div>
        </div>

        {/* FEED GRID */}
        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-teal-500" /></div>
        ) : processedFeed.length === 0 ? (
          <div className="text-center py-20 text-white/40 font-bold uppercase tracking-widest text-sm">
            No {filterCategory !== 'All' ? filterCategory : ''} listings found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {processedFeed.map((item) => {
              const isEmergency = item.isEmergency;
              const isRequest = item.listingType === 'request' && !isEmergency;

              let cardStyle = 'bg-[#111] border-white/10 hover:border-white/20 shadow-xl'; 
              let badgeStyle = 'bg-teal-500/20 text-teal-400';
              let buttonStyle = 'bg-white/5 active:bg-white/10 text-white';

              if (isEmergency) {
                cardStyle = 'bg-red-500/5 border-red-500/30 shadow-lg'; badgeStyle = 'bg-red-500 text-white'; buttonStyle = 'bg-red-600 active:bg-red-700 text-white';
              } else if (isRequest) {
                cardStyle = 'bg-[#0f172a] border-blue-500/30 shadow-lg'; badgeStyle = 'bg-blue-500/20 text-blue-400'; buttonStyle = 'bg-blue-600 active:bg-blue-700 text-white';
              }

              return (
                <div key={item._id} className={`rounded-3xl md:rounded-[2rem] p-5 md:p-6 flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 border ${cardStyle}`}>
                  
                  {isEmergency && <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center py-1.5 z-10"><FaExclamationTriangle className="inline mr-1" /> Critical Emergency</div>}
                  {isRequest && <div className="absolute top-0 left-0 w-full bg-blue-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-center py-1 z-10"><FaSearch className="inline mr-1" /> Community Request</div>}
                  
                  <div className={`${isEmergency || isRequest ? 'mt-5' : 'mt-0'} flex justify-between items-start mb-4`}>
                    <div className="flex items-center gap-3">
                      {item.donorId?.profilePic ? (
                        <img src={item.donorId.profilePic} className="w-10 h-10 rounded-xl object-cover border border-white/10" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-white/50 uppercase">{item.donorId?.name?.charAt(0) || '?'}</div>
                      )}
                      <div>
                        <p className="text-white font-bold text-xs md:text-sm">{item.donorId?.name || 'Unknown User'}</p>
                        <p className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{item.category}</p>
                      </div>
                    </div>
                    {item.bloodGroup && <div className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-black z-10 ${badgeStyle}`}>{item.bloodGroup}</div>}
                  </div>

                  {item.image ? (
                    <div className="w-full h-40 md:h-48 mb-4 rounded-2xl overflow-hidden border border-white/5 relative flex-shrink-0">
                      <img src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`} className="w-full h-full object-cover" />
                    </div>
                  ) : item.category === 'blood' ? (
                    <div className="w-full h-40 md:h-48 mb-4 rounded-2xl overflow-hidden border border-red-500/20 bg-gradient-to-br from-red-900/40 to-[#111] flex flex-col items-center justify-center flex-shrink-0">
                      <FaHeartbeat className="text-5xl md:text-6xl text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] mb-2 md:mb-3" />
                      <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md tracking-tighter">{item.bloodGroup || 'BLOOD'}</span>
                    </div>
                  ) : null}

                  <h3 className="text-lg md:text-xl font-black text-white mb-1.5 leading-tight">{item.title}</h3>
                  {item.quantity && <p className="text-white/80 font-bold text-[10px] md:text-xs mb-3">Qty: <span className="text-white">{item.quantity}</span></p>}
                  
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3">
                    {item.foodType && <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded text-[9px] font-bold text-white/70 uppercase"><FaLeaf className={item.foodType==='Veg'?'text-green-400':'text-orange-400'}/> {item.foodType}</span>}
                    {item.expiryDate && <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded text-[9px] font-bold text-white/70 uppercase"><FaCalendarAlt className="text-red-400"/> Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>}
                    {item.bookAuthor && <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded text-[9px] font-bold text-white/70 uppercase"><FaBook className="text-blue-400"/> {item.bookAuthor}</span>}
                    {item.condition && <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded text-[9px] font-bold text-white/70 uppercase"><FaTags className="text-purple-400"/> {item.condition}</span>}
                  </div>

                  <p className="text-white/60 text-xs md:text-sm mb-5 flex-1 line-clamp-2 md:line-clamp-3">{item.description}</p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10 mt-auto">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] md:text-xs font-bold w-full sm:max-w-[45%]">
                      <FaMapMarkerAlt className="flex-shrink-0" />
                      <span className="truncate">{item.location?.addressText || item.donorId?.addressText || 'Location Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {item.donorId?._id === user._id ? (
                        <>
                          {item.status === 'active' && item.requestedBy?.length > 0 && (
                            <button onClick={() => setRequestsModal({ isOpen: true, donation: item })} className="flex-1 sm:flex-none px-3 py-2.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 active:bg-blue-500 active:text-white flex items-center justify-center gap-2">
                              <FaUsers /> Reqs <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{item.requestedBy.length}</span>
                            </button>
                          )}
                          {item.status === 'pending' && (
                            <button onClick={() => navigate(`/chat/${item._id}_${item.receiverId}`)} className="flex-1 sm:flex-none px-3 py-2.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest bg-teal-500/20 text-teal-400 flex items-center justify-center gap-2">
                              <FaCommentDots /> Chat
                            </button>
                          )}
                          <button onClick={() => setFulfillModal({ isOpen: true, donationId: item._id, pin: '', rating: 5 })} className="p-2.5 md:p-2 rounded-xl bg-teal-500/10 text-teal-400 active:bg-teal-500 active:text-white"><FaCheckCircle className="text-lg" /></button>
                          <button onClick={() => handleDeletePost(item._id)} className="p-2.5 md:p-2 rounded-xl bg-red-500/10 text-red-500 active:bg-red-500 active:text-white"><FaTrash className="text-lg" /></button>
                        </>
                      ) : (
                        <>
                          {item.status === 'active' ? (
                            item.requestedBy?.some(req => req._id === user._id) ? (
                              <button disabled className="w-full sm:w-auto px-4 py-2.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest bg-white/5 text-white/30 border border-white/5">Pending</button>
                            ) : (
                              <button onClick={() => handleRequestItem(item._id)} className={`w-full sm:w-auto px-4 py-2.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 ${buttonStyle}`}>
                                <FaCommentDots /> {isRequest ? 'Offer Help' : 'Request'}
                              </button>
                            )
                          ) : item.receiverId === user._id ? (
                            <div className="flex w-full sm:w-auto justify-between items-center gap-2">
                              <span className="text-[10px] font-black text-white bg-teal-500/20 px-2 py-1 rounded border border-teal-500/30 shrink-0">PIN: {item.pickupPIN}</span>
                              <button onClick={() => navigate(`/chat/${item._id}_${user._id}`)} className="flex-1 px-4 py-2.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest bg-teal-500/20 text-teal-400 flex justify-center items-center gap-2">
                                <FaCommentDots /> Chat
                              </button>
                            </div>
                          ) : (
                            <button disabled className="w-full sm:w-auto px-4 py-2.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500/50 border border-yellow-500/10">Reserved</button>
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

        <button onClick={() => navigate('/chat/inbox')} className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-teal-500 active:bg-teal-600 text-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.4)] active:scale-95 transition-transform">
          <div className="relative">
            <FaEnvelope className="text-xl md:text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] md:text-[10px] font-black min-w-[18px] md:min-w-[20px] h-4 md:h-5 px-1 rounded-full flex items-center justify-center border-2 border-[#111]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </button>

        {/* 1. SOS MODAL (Bottom Sheet) */}
        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#050505]/90 backdrop-blur-sm" onClick={() => setShowSOS(false)} />
              
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-[#0a0a0a] border-t sm:border border-red-500/30 rounded-t-[2.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(220,38,38,0.15)] max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
                <button type="button" onClick={() => setShowSOS(false)} className="hidden sm:block absolute top-6 right-6 text-white/40 hover:text-white"><FaTimes className="text-xl" /></button>

                <div className="flex items-center gap-3 mb-6 text-red-500">
                  <FaHeartbeat className="text-3xl sm:text-4xl animate-pulse" />
                  <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter text-white leading-tight">EMERGENCY <br className="hidden sm:block"/>BROADCAST</h2>
                </div>

                <form onSubmit={handleSOSSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 mb-1 block">Blood Group</label>
                      {/* text-base prevents iOS zoom */}
                      <select required value={sosData.bloodGroup} onChange={e => setSosData({...sosData, bloodGroup: e.target.value})} className="w-full bg-[#111] border border-red-500/30 rounded-xl px-4 py-3.5 text-white text-base md:text-sm outline-none appearance-none focus:border-red-500 transition-colors">
                        <option value="" disabled className="bg-[#111]">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg} className="bg-[#111]">{bg}</option>)}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 mb-1 block">Units</label>
                      <input required type="number" min="1" placeholder="e.g. 2" value={sosData.quantity} onChange={e => setSosData({...sosData, quantity: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base md:text-sm outline-none focus:border-red-500 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 mb-1 block">Hospital Name</label>
                    <input required value={sosData.hospital} onChange={e => setSosData({...sosData, hospital: e.target.value})} placeholder="e.g. Apollo Hospital" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base md:text-sm outline-none focus:border-red-500 transition-colors" />
                  </div>

                  <div className="relative">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 mb-1 block">City / Area</label>
                    <div className="flex gap-2">
                      <input required value={sosData.addressText} onChange={handleLocationType} placeholder="Type city or use GPS..." className="flex-1 w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base md:text-sm outline-none focus:border-red-500 transition-colors" />
                      <button type="button" onClick={handleGetLocation} disabled={isFetchingLocation} className="px-5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl flex items-center justify-center active:bg-red-500/20 transition-colors">
                        {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute bottom-full mb-2 z-50 w-full bg-[#111] border border-white/10 rounded-xl max-h-40 overflow-y-auto shadow-2xl">
                        {suggestions.map((s, idx) => <div key={idx} onClick={() => handleSelectSuggestion(s.display_name)} className="px-4 py-3 text-xs text-white/70 border-b border-white/5 active:bg-white/5">{s.display_name}</div>)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 mb-1 block">Patient Details</label>
                    <textarea required value={sosData.description} onChange={e => setSosData({...sosData, description: e.target.value})} placeholder="Require urgent blood for surgery..." rows="2" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base md:text-sm outline-none resize-none focus:border-red-500 transition-colors"></textarea>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full mt-2 mb-4 py-4 sm:py-5 bg-red-600 active:bg-red-700 rounded-xl font-black text-white uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.2)] disabled:opacity-50">
                    {isSubmitting ? <FaSpinner className="animate-spin text-lg" /> : <><FaExclamationTriangle /> Broadcast Alert</>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. SECURE OTP MODAL (Bottom Sheet) */}
        <AnimatePresence>
          {fulfillModal.isOpen && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#050505]/90 backdrop-blur-sm" onClick={() => setFulfillModal({ isOpen: false, donationId: null, pin: '', rating: 5 })} />
              
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-sm bg-[#0a0a0a] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2rem] p-6 sm:p-8 text-center shadow-2xl">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
                
                <div className="w-14 h-14 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 border border-teal-500/20 shadow-inner">
                  <FaLock />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-tighter">SECURE HANDSHAKE</h2>
                <p className="text-white/50 text-[10px] sm:text-xs font-bold leading-relaxed mb-6">Enter the 4-digit PIN provided by the receiver.</p>

                <form onSubmit={handleFulfillSubmit}>
                  {/* text-base safely prevents iOS auto-zoom on PIN code input */}
                  <input type="text" required maxLength="4" placeholder="PIN" value={fulfillModal.pin} onChange={e => setFulfillModal({...fulfillModal, pin: e.target.value.replace(/\D/g, '')})} className="w-full bg-[#111] border-2 border-dashed border-white/20 rounded-2xl px-5 py-4 text-center text-teal-400 text-base md:text-2xl tracking-[0.5em] font-black outline-none focus:border-teal-500 transition-colors mb-5" />

                  <div className="mb-6 bg-[#111] p-4 rounded-2xl border border-white/5">
                    <p className="text-white/50 text-[9px] sm:text-[10px] uppercase font-black tracking-widest mb-3">Rate the Receiver</p>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FaStar key={star} onClick={() => setFulfillModal({...fulfillModal, rating: star})} className={`text-2xl sm:text-3xl cursor-pointer transition-colors ${fulfillModal.rating >= star ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-white/10'}`} />
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting || fulfillModal.pin.length !== 4} className="w-full mb-2 py-4 sm:py-5 bg-teal-500 active:bg-teal-600 rounded-2xl font-black text-[#050505] uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                    {isSubmitting ? <FaSpinner className="animate-spin text-lg" /> : <><FaCheckCircle className="text-lg" /> Verify & Complete</>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. REQUESTS MODAL (Bottom Sheet) */}
        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#050505]/90 backdrop-blur-sm" onClick={() => setRequestsModal({ isOpen: false, donation: null })} />
              
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-[#0a0a0a] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
                
                <h2 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-tighter uppercase">COMMUNITY REQUESTS</h2>
                <p className="text-white/50 text-[10px] sm:text-xs font-bold leading-relaxed mb-6">Choose an operator to connect with for <span className="text-white">"{requestsModal.donation.title}"</span>.</p>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-4">
                  {requestsModal.donation.requestedBy.map((requester) => (
                    <div key={requester._id} className="flex items-center justify-between bg-[#111] border border-white/5 p-3 sm:p-4 rounded-2xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {requester.profilePic ? (
                          <img src={requester.profilePic} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-white/50 uppercase shrink-0">{requester.name?.charAt(0) || '?'}</div>
                        )}
                        <span className="text-white font-bold text-xs sm:text-sm truncate">{requester.name}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleApproveRequest(requestsModal.donation._id, requester._id)}
                        className="px-4 py-3 bg-teal-500/10 active:bg-teal-500 text-teal-400 active:text-black border border-teal-500/30 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shrink-0 transition-all"
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