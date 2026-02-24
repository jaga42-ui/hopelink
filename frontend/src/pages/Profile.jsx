import { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaMapMarkerAlt, FaTint, FaBoxOpen, FaAward, FaHistory, FaEdit, FaSave, FaTimes, FaPhone, FaLocationArrow, FaSpinner, FaStar, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

import api from '../utils/api';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalDonations: 0, activeListings: 0, bloodDonations: 0 });
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bloodGroup: user?.bloodGroup || '',
    phone: user?.phone || '',
    addressText: user?.addressText || ''
  });

  const isDonor = user?.activeRole === 'donor';
  const themeAccent = isDonor ? 'text-teal-400' : 'text-blue-400';
  const themeBg = isDonor ? 'bg-teal-500' : 'bg-blue-500';

  useEffect(() => {
    const fetchImpactStats = async () => {
      if (!user?.token) return;
      try {
        const { data } = await api.get('/donations/my-history');
        const active = data.filter(d => d.status === 'available' || d.status === 'pending').length;
        const blood = data.filter(d => d.category === 'blood').length;
        setStats({ totalDonations: data.length, activeListings: active, bloodDonations: blood });
        setLoading(false);
      } catch (error) { setLoading(false); }
    };

    setFormData({
      name: user?.name || '',
      bloodGroup: user?.bloodGroup || '',
      phone: user?.phone || '',
      addressText: user?.addressText || ''
    });

    fetchImpactStats();
  }, [user]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`);
          const addressInfo = data.address;
          const cityString = addressInfo.city || addressInfo.town || addressInfo.village || addressInfo.state || 'Unknown Location';
          
          setFormData({ ...formData, addressText: cityString });
          toast.success(`Location locked: ${cityString}`);
        } catch (error) { toast.error("Could not resolve location address"); } 
        finally { setIsFetchingLocation(false); }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error('Please allow location permissions');
      }
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/profile', formData);
      login(data); 
      setIsEditing(false);
      toast.success("Identity updated successfully.");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to update profile"); }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-24 text-white min-h-screen"> 
        
        <header className="mb-8 md:mb-12 border-b border-white/20 pt-6 pb-6 md:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl md:text-6xl font-black text-white italic tracking-tighter drop-shadow-md">
              MY <span className={themeAccent}>LEGACY.</span>
            </motion.h1>
            <p className="text-white/60 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] mt-1 md:mt-2">Identity & Community Impact</p>
          </div>
          
          {/* Glassmorphism Edit Button */}
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-6 py-4 md:py-3 rounded-2xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">
              <FaEdit /> Update Dossier
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* THE IDENTITY CARD (Left Column - Glassmorphism) */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden transition-all duration-500 shadow-2xl`}>
              
              <div className={`absolute top-0 left-0 w-full h-32 md:h-40 opacity-30 bg-gradient-to-b ${isDonor ? 'from-teal-500' : 'from-blue-500'} to-transparent pointer-events-none`}></div>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="relative mb-5 md:mb-6 group">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-2xl border-4 border-white/20 relative z-10" />
                  ) : (
                    <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center text-white font-black text-5xl md:text-6xl shadow-2xl border-4 border-white/20 relative z-10 bg-gradient-to-tr ${isDonor ? 'from-teal-400 to-teal-800' : 'from-blue-400 to-blue-800'}`}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-yellow-400 text-black p-2 md:p-2.5 rounded-full shadow-lg border-4 border-teal-900 z-20" title={user.rank || 'Member'}>
                    <FaShieldAlt className="text-xs md:text-sm" />
                  </div>
                </div>
                
                {!isEditing && (
                  <>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">{user.name}</h2>
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1 md:mt-2 ${themeAccent}`}>
                      {user.rank || (user.isAdmin ? <span className="text-red-400">System Admin</span> : 'Verified Member')}
                    </p>

                    <div className="mt-5 md:mt-6 flex items-center justify-center gap-4 bg-black/20 px-5 py-3 rounded-xl md:rounded-2xl border border-white/10 w-full shadow-inner">
                      <div className="flex items-center gap-2">
                        <FaStar className="text-yellow-400 text-lg md:text-xl drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                        {user.totalRatings > 0 ? (
                          <div className="flex flex-col items-start leading-none">
                            <span className="text-white font-black text-lg md:text-xl drop-shadow-sm">{user.rating?.toFixed(1)}</span>
                            <span className="text-white/60 text-[8px] md:text-[9px] uppercase font-bold tracking-widest mt-0.5">{user.totalRatings} Endorsements</span>
                          </div>
                        ) : (
                          <span className="text-white/60 font-black text-[10px] md:text-xs tracking-widest uppercase ml-1">Unranked</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 md:mt-8 space-y-2 md:space-y-3 relative z-10">
                    <div className="flex items-center gap-4 text-white/90 bg-white/10 border border-white/10 p-3.5 md:p-4 rounded-xl md:rounded-2xl active:bg-white/20 transition-colors shadow-sm">
                      <FaEnvelope className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/90 bg-white/10 border border-white/10 p-3.5 md:p-4 rounded-xl md:rounded-2xl active:bg-white/20 transition-colors shadow-sm">
                      <FaPhone className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.phone || 'Phone Classified'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/90 bg-white/10 border border-white/10 p-3.5 md:p-4 rounded-xl md:rounded-2xl active:bg-white/20 transition-colors shadow-sm">
                      <FaTint className="text-red-400 shrink-0" /> <span className="text-xs md:text-sm font-bold truncate">Type: {user.bloodGroup || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/90 bg-white/10 border border-white/10 p-3.5 md:p-4 rounded-xl md:rounded-2xl active:bg-white/20 transition-colors shadow-sm">
                      <FaMapMarkerAlt className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.addressText || 'Sector Unknown'}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="edit" onSubmit={handleUpdateProfile} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 md:mt-6 space-y-4 relative z-10">
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/70 ml-2 md:ml-4 mb-1.5 block">Full Name</label>
                      <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/30 border border-white/20 rounded-xl md:rounded-2xl px-4 py-3.5 text-white text-base md:text-sm outline-none focus:border-teal-400 transition-all shadow-inner" required />
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/70 ml-2 md:ml-4 mb-1.5 block">Secure Phone</label>
                      <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXXXXXXX" className="w-full bg-black/30 border border-white/20 rounded-xl md:rounded-2xl px-4 py-3.5 text-white text-base md:text-sm outline-none focus:border-teal-400 transition-all shadow-inner" />
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/70 ml-2 md:ml-4 mb-1.5 block">Blood Type</label>
                      <select value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} className="w-full bg-black/30 border border-white/20 rounded-xl md:rounded-2xl px-4 py-3.5 text-white text-base md:text-sm outline-none focus:border-teal-400 appearance-none transition-all shadow-inner cursor-pointer">
                        <option value="" className="text-black">Select Blood Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg} className="text-black">{bg}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/70 ml-2 md:ml-4 mb-1.5 block">Sector / Base</label>
                      <div className="flex gap-2">
                        <input value={formData.addressText} onChange={(e) => setFormData({...formData, addressText: e.target.value})} placeholder="e.g. Bhubaneswar" className="flex-1 w-full bg-black/30 border border-white/20 rounded-xl md:rounded-2xl px-4 py-3.5 text-white text-base md:text-sm outline-none focus:border-teal-400 transition-all shadow-inner" />
                        <button 
                          type="button" onClick={handleGetLocation} disabled={isFetchingLocation}
                          className="px-4 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-xl md:rounded-2xl active:bg-teal-500/40 hover:bg-teal-500/30 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-sm"
                        >
                          {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 md:gap-3 mt-6 md:mt-8 pt-4 border-t border-white/20">
                      <button type="button" onClick={() => setIsEditing(false)} className="w-12 md:w-14 shrink-0 py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase bg-white/10 hover:bg-white/20 text-white active:bg-red-500/40 active:text-white transition-all flex items-center justify-center shadow-lg border border-white/10">
                        <FaTimes className="text-lg" />
                      </button>
                      <button type="submit" className={`flex-1 py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${themeBg} hover:opacity-90 text-white shadow-xl active:scale-95 border border-white/20`}>
                        <FaSave className="text-lg" /> Commit Record
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* THE METRICS DASHBOARD (Right Column - Glassmorphism) */}
          <div className="lg:col-span-8 space-y-5 md:space-y-6">
            
            {/* The Golden XP Banner (Glassmorphism) */}
            <div className="bg-white/10 backdrop-blur-xl border border-yellow-500/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-8 -bottom-8 md:-right-10 md:-bottom-10 text-8xl md:text-9xl text-yellow-500/20 pointer-events-none drop-shadow-2xl">
                <FaAward />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-6">
                <div>
                  <p className="text-yellow-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2 flex items-center gap-2 drop-shadow-sm">
                    <FaStar className="animate-pulse" /> Community Standing
                  </p>
                  <h3 className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-xl">{user.points || 0}</h3>
                  <p className="text-white/80 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1 md:mt-2">Total Experience Points (XP)</p>
                </div>
                <div className="w-full md:w-auto bg-black/30 backdrop-blur-md px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border border-white/20 text-center md:min-w-[140px] shadow-inner">
                  <p className="text-white/60 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Current Rank</p>
                  <p className="text-yellow-400 font-bold text-sm md:text-base tracking-wider truncate drop-shadow-sm">{user.rank || 'Initiate'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {/* Transactions Metric */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-white/10 rounded-bl-[80px] md:rounded-bl-[100px]"></div>
                <div className={`text-3xl md:text-4xl mb-4 md:mb-6 opacity-90 drop-shadow-md ${themeAccent}`}><FaBoxOpen /></div>
                {loading ? (
                  <div className="h-10 md:h-14 w-16 md:w-24 bg-white/20 animate-pulse rounded-lg md:rounded-xl"></div>
                ) : (
                  <h3 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">{user.donationsCount || stats.totalDonations}</h3>
                )}
                <p className="text-white/70 text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-2 md:mt-3 leading-tight">Missions Completed</p>
              </div>

              {/* Active Logistics Metric */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-white/10 rounded-bl-[80px] md:rounded-bl-[100px]"></div>
                <div className={`text-3xl md:text-4xl mb-4 md:mb-6 opacity-90 drop-shadow-md ${themeAccent}`}><FaHistory /></div>
                {loading ? (
                  <div className="h-10 md:h-14 w-16 md:w-24 bg-white/20 animate-pulse rounded-lg md:rounded-xl"></div>
                ) : (
                  <h3 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">{stats.activeListings}</h3>
                )}
                <p className="text-white/70 text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-2 md:mt-3 leading-tight">Active Field Ops</p>
              </div>
            </div>

            {/* Subtle Motivational Quote */}
            <div className="text-center pt-6 md:pt-8 opacity-60 px-4">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] italic leading-relaxed drop-shadow-sm text-white">
                "A community is only as strong as its willingness to protect one another."
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Profile;