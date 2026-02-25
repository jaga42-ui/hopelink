import { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; 
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  FaHeartbeat, FaMapMarkerAlt, FaCommentDots, FaSpinner, FaTimes, 
  FaExclamationTriangle, FaTrash, FaBoxOpen, FaLocationArrow, 
  FaEnvelope, FaCheckCircle, FaLeaf, FaCalendarAlt, FaTags, 
  FaBook, FaSearch, FaLock, FaStar, FaUsers, FaRunning, FaDownload, FaHandsHelping
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import api from '../utils/api';

const BACKEND_URL = 'https://hopelink-api.onrender.com';

const Dashboard = () => {
  const { user, switchRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [localRole, setLocalRole] = useState(user?.activeRole || 'donor');
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [responders, setResponders] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('urgent'); 
  
  // App Download (PWA) State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

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
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

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
    
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socket.emit('setup', user._id);
    
    socket.on('new_message_notification', () => {
      setUnreadCount(prev => prev + 1);
      toast('💬 Secure Transmission Received!', {
        position: 'top-right',
        style: { borderRadius: '1rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
      });
    });

    socket.on('donor_coming', (data) => {
      setResponders(prev => [...prev, data]);
      toast.success(`${data.donorName} is en route to help! 🦸‍♂️`, { 
        duration: 8000,
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' } 
      });
    });

    return () => socket.disconnect();
  }, [user]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      toast.success("HopeLink is installing securely to your device.");
    }
    setDeferredPrompt(null);
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported by your browser.');
    
    setIsFetchingLocation(true);
    toast.loading("Locking onto GPS coordinates...", { id: 'gps-toast' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`);
          const cityString = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown Location';
          setSosData(prev => ({ ...prev, addressText: cityString }));
          toast.success(`Coordinates locked: ${cityString}`, { id: 'gps-toast' });
        } catch (error) { 
          toast.error("Could not resolve specific address.", { id: 'gps-toast' }); 
        } finally { 
          setIsFetchingLocation(false); 
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        toast.error("Failed to acquire location signal.", { id: 'gps-toast' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
      toast.success("Emergency broadcast deployed successfully!");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to broadcast SOS"); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Are you sure you want to retract this transmission?")) {
      try {
        await api.delete(`/donations/${id}`);
        setFeed(feed.filter(item => item._id !== id));
        toast.success("Transmission successfully retracted.");
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
      toast.success("Handshake Verified! Points securely applied.");
      setFulfillModal({ isOpen: false, donationId: null, pin: '', rating: 5 });
    } catch (error) { toast.error(error.response?.data?.message || "Incorrect Access PIN"); } 
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
      toast.success("Response sent! The author has been notified.");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to send request"); }
  };

  const handleApproveRequest = async (donationId, receiverId) => {
    try {
      const { data } = await api.patch(`/donations/${donationId}/approve`, { receiverId });
      const receiverName = requestsModal.donation.requestedBy.find(r => r._id === receiverId)?.name || 'Receiver';
      setFeed(feed.map(item => item._id === donationId ? { ...item, status: 'pending', receiverId: receiverId } : item));
      setRequestsModal({ isOpen: false, donation: null });
      toast.success("Approved! Secure comms channel established.");
      navigate(`/chat/${data.chatRoomId}`, {
        state: { otherUserId: receiverId, otherUserName: receiverName, itemTitle: requestsModal.donation.title }
      });
    } catch (error) { toast.error("Approval failed"); }
  };

  // 👉 NEW: Unified Click Handler for the entire card
  const handleCardClick = (item) => {
    const isMine = item.donorId?._id === user._id;
    const alreadyRequested = item.requestedBy?.some(req => req._id === user._id);
    const isReceiver = item.receiverId === user._id;

    if (isMine) {
      if (item.status === 'active' && item.requestedBy?.length > 0) {
        setRequestsModal({ isOpen: true, donation: item });
      } else if (item.status === 'pending') {
        setFulfillModal({ isOpen: true, donationId: item._id, pin: '', rating: 5 });
      }
    } else {
      if (item.status === 'active') {
        if (!alreadyRequested) {
          handleRequestItem(item._id);
        } else {
          toast("You've already responded. Awaiting their approval.");
        }
      } else if (item.status === 'pending' && isReceiver) {
        navigate(`/chat/${item._id}_${user._id}`);
      }
    }
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
      <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-24 relative min-h-screen text-white"> 
        
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
        <header className="mb-6 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight">
              COMMUNITY FEED
            </h1>
          </div>
          
          <div className="w-full md:w-auto grid grid-cols-2 md:flex gap-3 md:gap-4 items-center">
            
            {user && !user.isAdmin && (
              <button 
                onClick={() => {
                  const newRole = localRole === 'donor' ? 'receiver' : 'donor';
                  setLocalRole(newRole);
                  switchRole();
                }}
                className="col-span-2 md:col-span-1 px-4 py-3 md:py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center gap-3 active:bg-white/20 transition-all shadow-lg"
              >
                <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${localRole === 'donor' ? 'text-white' : 'text-white/50'}`}>Donor</span>
                <div className="w-10 h-5 bg-black/30 rounded-full relative shrink-0 border border-white/10">
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out ${localRole === 'donor' ? '' : 'translate-x-[19px]'}`}></div>
                </div>
                <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${localRole === 'receiver' ? 'text-white' : 'text-white/50'}`}>Receiver</span>
              </button>
            )}

            {isInstallable && (
              <button onClick={handleInstallClick} className="col-span-2 md:col-span-1 px-4 md:px-6 py-3 md:py-3.5 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl font-bold text-[11px] md:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl border border-teal-400">
                <FaDownload className="text-lg" /> Download App
              </button>
            )}

            {localRole === 'donor' ? (
              <button onClick={() => navigate('/donations')} className="px-4 md:px-6 py-3 md:py-3.5 bg-white text-teal-700 rounded-2xl font-extrabold text-[11px] md:text-sm active:scale-95 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-xl">
                <FaBoxOpen className="text-lg" /> Post Item
              </button>
            ) : (
              <div className="hidden md:block w-full"></div> 
            )}
            
            <button onClick={() => setShowSOS(true)} className="col-span-2 md:col-span-1 px-4 md:px-6 py-3 md:py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-extrabold text-xs md:text-sm shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 border border-red-500">
              <FaHeartbeat className="text-lg md:text-xl animate-pulse" /> Emergency SOS
            </button>
          </div>
        </header>

        {/* FILTERS & SORT */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8 bg-white/10 backdrop-blur-xl p-3 md:p-4 rounded-2xl md:rounded-[2rem] border border-white/20 shadow-lg">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0 scroll-smooth">
            {['All', 'Blood', 'Food', 'Clothes', 'Book'].map(cat => (
              <button
                key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-5 py-2 md:py-2.5 rounded-xl md:rounded-full font-extrabold text-[11px] md:text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                  filterCategory === cat ? 'bg-white text-teal-800 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 border-t border-white/10 md:border-0 pt-3 md:pt-0">
             <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Sort By:</span>
             <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-black/40 border border-white/20 rounded-lg md:rounded-xl px-3 py-2 text-white text-[11px] md:text-xs font-bold outline-none cursor-pointer">
               <option value="urgent" className="text-black">Urgent First</option>
               <option value="newest" className="text-black">Newest First</option>
             </select>
          </div>
        </div>

        {/* FEED GRID - NEW CLEAN, CLICKABLE WIDGET CARDS */}
        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-white" /></div>
        ) : processedFeed.length === 0 ? (
          <div className="text-center py-20 text-white/70 font-medium text-sm">
            No {filterCategory !== 'All' ? filterCategory : ''} listings found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {processedFeed.map((item) => {
              const isMine = item.donorId?._id === user._id;
              const isEmergency = item.isEmergency;
              const isRequest = item.listingType === 'request' && !isEmergency;
              const alreadyRequested = item.requestedBy?.some(req => req._id === user._id);
              const isReceiver = item.receiverId === user._id;

              // Action Banner Logic
              let bannerClass = "bg-white/5 text-white/50";
              let bannerText = "Broadcasting...";
              let bannerIcon = <FaSpinner className="animate-spin opacity-50" />;

              if (isMine) {
                if (item.status === 'active' && item.requestedBy?.length > 0) {
                  bannerClass = "bg-teal-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)]";
                  bannerText = `View ${item.requestedBy.length} Responder(s)`;
                  bannerIcon = <FaUsers />;
                } else if (item.status === 'pending') {
                  bannerClass = "bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]";
                  bannerText = "Complete Handshake";
                  bannerIcon = <FaCheckCircle />;
                }
              } else {
                if (item.status === 'active') {
                  if (alreadyRequested) {
                    bannerClass = "bg-white/10 text-white/50";
                    bannerText = "Response Pending...";
                    bannerIcon = <FaSpinner className="animate-spin opacity-50" />;
                  } else {
                    bannerClass = isEmergency 
                      ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" 
                      : "bg-white text-teal-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]";
                    bannerText = isRequest ? "Offer Help" : "Respond to Listing";
                    bannerIcon = <FaHandsHelping />;
                  }
                } else if (item.status === 'pending') {
                  if (isReceiver) {
                    bannerClass = "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]";
                    bannerText = `Open Secure Chat • PIN: ${item.pickupPIN}`;
                    bannerIcon = <FaCommentDots />;
                  } else {
                    bannerClass = "bg-black/40 text-white/30";
                    bannerText = "Resolved";
                    bannerIcon = <FaLock />;
                  }
                }
              }

              let cardStyle = 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/30'; 
              if (isEmergency) cardStyle = 'bg-red-900/30 backdrop-blur-xl border-red-500/30 hover:border-red-500'; 
              else if (isRequest) cardStyle = 'bg-blue-900/30 backdrop-blur-xl border-blue-500/30 hover:border-blue-400'; 

              return (
                <motion.div 
                  key={item._id} 
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCardClick(item)}
                  className={`rounded-[2rem] flex flex-col relative overflow-hidden transition-all duration-300 shadow-2xl border cursor-pointer group ${cardStyle}`}
                >
                  
                  {/* Subtle Delete Button (Owner Only) */}
                  {isMine && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePost(item._id); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-black/80 z-20 transition-all border border-white/10"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}

                  {isEmergency && <div className="w-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1.5 z-10"><FaExclamationTriangle className="inline mr-1" /> Critical Emergency</div>}
                  {isRequest && <div className="w-full bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider text-center py-1.5 z-10"><FaSearch className="inline mr-1" /> Community Request</div>}
                  
                  <div className="p-5 md:p-6 flex-1 flex flex-col">
                    
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 mb-5">
                      {item.donorId?.profilePic ? (
                        <img src={item.donorId.profilePic} className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-sm" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white uppercase shadow-sm border border-white/10">{item.donorId?.name?.charAt(0) || '?'}</div>
                      )}
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{item.donorId?.name || 'Unknown User'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">{item.category}</p>
                          {item.bloodGroup && <span className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white">{item.bloodGroup}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Image or Icon Container */}
                    {item.image ? (
                      <div className="w-full h-44 mb-4 rounded-2xl overflow-hidden relative flex-shrink-0 border border-white/10">
                        <img src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : item.category === 'blood' ? (
                      <div className="w-full h-32 mb-4 rounded-2xl overflow-hidden border border-red-500/20 bg-red-900/20 flex flex-col items-center justify-center flex-shrink-0">
                        <FaHeartbeat className="text-4xl text-red-400 mb-2 drop-shadow-md" />
                        <span className="text-2xl font-black text-white tracking-tight drop-shadow-sm">{item.bloodGroup || 'BLOOD'}</span>
                      </div>
                    ) : null}

                    {/* Title & Desc */}
                    <h3 className="text-lg font-bold text-white mb-1.5 leading-snug drop-shadow-sm">{item.title}</h3>
                    {item.quantity && <p className="text-white/60 font-medium text-[11px] mb-3">Qty: <span className="text-white">{item.quantity}</span></p>}
                    
                    <p className="text-white/70 text-sm mb-5 flex-1 line-clamp-2">{item.description}</p>
                    
                    {/* Location Footer */}
                    <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-medium mt-auto">
                      <FaMapMarkerAlt className="flex-shrink-0" />
                      <span className="truncate">{item.location?.addressText || item.donorId?.addressText || 'Location Unknown'}</span>
                    </div>
                  </div>

                  {/* THE FULL WIDTH ACTION BANNER */}
                  <div className={`w-full py-4 flex items-center justify-center gap-2 font-black uppercase tracking-[0.15em] text-[10px] md:text-[11px] transition-all duration-300 ${bannerClass}`}>
                    {bannerIcon} {bannerText}
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

        {/* Floating Inbox Button */}
        <button onClick={() => navigate('/chat/inbox')} className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-white text-teal-800 hover:bg-gray-100 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 transition-transform border border-white/20">
          <div className="relative">
            <FaEnvelope className="text-xl md:text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </button>

        {/* SOS MODAL */}
        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSOS(false)} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border-t sm:border border-white/20 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-white">
                <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-6 sm:hidden" />
                <button type="button" onClick={() => setShowSOS(false)} className="hidden sm:block absolute top-6 right-6 text-white/50 hover:text-white"><FaTimes className="text-xl" /></button>

                <div className="flex items-center gap-3 mb-6 text-red-400">
                  <FaHeartbeat className="text-3xl sm:text-4xl animate-pulse drop-shadow-md" />
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">Emergency <br className="hidden sm:block"/>Request</h2>
                </div>

                <form onSubmit={handleSOSSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 ml-1 mb-1 block">Blood Group</label>
                      <select required value={sosData.bloodGroup} onChange={e => setSosData({...sosData, bloodGroup: e.target.value})} className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white text-base md:text-sm outline-none appearance-none focus:border-red-400 transition-colors">
                        <option value="" disabled className="text-black">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg} className="text-black">{bg}</option>)}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 ml-1 mb-1 block">Units</label>
                      <input required type="number" min="1" placeholder="e.g. 2" value={sosData.quantity} onChange={e => setSosData({...sosData, quantity: e.target.value})} className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white text-base md:text-sm outline-none focus:border-red-400 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 ml-1 mb-1 block">Hospital / Location</label>
                    <input required value={sosData.hospital} onChange={e => setSosData({...sosData, hospital: e.target.value})} placeholder="e.g. City General Hospital" className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white text-base md:text-sm outline-none focus:border-red-400 transition-colors" />
                  </div>

                  <div className="relative">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 ml-1 mb-1 block">City Area</label>
                    <div className="flex gap-2">
                      <input required value={sosData.addressText} onChange={handleLocationType} placeholder="Type area or use GPS..." className="flex-1 w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white text-base md:text-sm outline-none focus:border-red-400 transition-colors" />
                      <button type="button" onClick={handleGetLocation} disabled={isFetchingLocation} className="px-4 bg-red-500/20 text-red-300 border border-red-500/40 rounded-xl flex items-center justify-center hover:bg-red-500/40 transition-colors">
                        {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute bottom-full mb-2 z-50 w-full bg-[#111] border border-white/20 rounded-xl max-h-40 overflow-y-auto shadow-2xl">
                        {suggestions.map((s, idx) => <div key={idx} onClick={() => handleSelectSuggestion(s.display_name)} className="px-4 py-3 text-sm text-white/80 border-b border-white/10 hover:bg-white/10 cursor-pointer">{s.display_name}</div>)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 ml-1 mb-1 block">Details</label>
                    <textarea required value={sosData.description} onChange={e => setSosData({...sosData, description: e.target.value})} placeholder="Any additional information..." rows="2" className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white text-base md:text-sm outline-none resize-none focus:border-red-400 transition-colors"></textarea>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full mt-4 mb-2 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all border border-red-500">
                    {isSubmitting ? <FaSpinner className="animate-spin text-lg" /> : <><FaExclamationTriangle /> Broadcast Request</>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SECURE OTP MODAL */}
        <AnimatePresence>
          {fulfillModal.isOpen && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setFulfillModal({ isOpen: false, donationId: null, pin: '', rating: 5 })} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-sm bg-white/10 backdrop-blur-2xl border-t sm:border border-white/20 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 text-center shadow-2xl text-white">
                <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-6 sm:hidden" />
                <div className="w-14 h-14 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-white/20 shadow-inner"><FaLock /></div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Secure Exchange</h2>
                <p className="text-white/70 text-xs font-medium leading-relaxed mb-6">Enter the 4-digit PIN provided by the receiver.</p>

                <form onSubmit={handleFulfillSubmit}>
                  <input type="text" required maxLength="4" placeholder="PIN" value={fulfillModal.pin} onChange={e => setFulfillModal({...fulfillModal, pin: e.target.value.replace(/\D/g, '')})} className="w-full bg-black/30 border-2 border-dashed border-white/40 rounded-2xl px-5 py-4 text-center text-white text-base md:text-2xl tracking-[0.5em] font-black outline-none focus:border-white transition-colors mb-6" />

                  <div className="mb-6 bg-black/20 p-4 rounded-xl border border-white/10">
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-2">Rate your experience</p>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FaStar key={star} onClick={() => setFulfillModal({...fulfillModal, rating: star})} className={`text-2xl sm:text-3xl cursor-pointer transition-colors ${fulfillModal.rating >= star ? 'text-yellow-400 drop-shadow-md' : 'text-white/20'}`} />
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting || fulfillModal.pin.length !== 4} className="w-full mb-2 py-4 bg-white text-teal-800 hover:bg-gray-200 rounded-xl font-extrabold uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-xl border border-white/20">
                    {isSubmitting ? <FaSpinner className="animate-spin text-lg" /> : <><FaCheckCircle className="text-lg" /> Verify & Complete</>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* REQUESTS MODAL */}
        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRequestsModal({ isOpen: false, donation: null })} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border-t sm:border border-white/20 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl text-white">
                <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-6 sm:hidden" />
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Community Requests</h2>
                <p className="text-white/70 text-xs font-medium leading-relaxed mb-6">Choose someone to connect with for <span className="text-white font-bold">"{requestsModal.donation.title}"</span>.</p>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-4">
                  {requestsModal.donation.requestedBy.map((requester) => (
                    <div key={requester._id} className="flex items-center justify-between bg-black/20 border border-white/10 p-3 sm:p-4 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {requester.profilePic ? (
                          <img src={requester.profilePic} className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/30" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white uppercase shrink-0 border border-white/10">{requester.name?.charAt(0) || '?'}</div>
                        )}
                        <span className="font-bold text-sm truncate">{requester.name}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleApproveRequest(requestsModal.donation._id, requester._id)}
                        className="px-4 py-2.5 bg-white text-teal-800 hover:bg-gray-200 rounded-lg text-xs font-extrabold transition-colors shrink-0 shadow-lg border border-white/20"
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