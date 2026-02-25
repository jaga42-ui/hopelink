import { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaMapMarkerAlt, FaTint, FaBoxOpen, 
  FaAward, FaHistory, FaEdit, FaSave, FaTimes, FaPhone, 
  FaLocationArrow, FaSpinner, FaStar, FaShieldAlt, FaSignOutAlt 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import api from '../utils/api';

const Profile = () => {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
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

  // 👉 SOLID DARK THEME VARIABLES
  const isDonor = user?.activeRole === 'donor';
  const themeAccent = isDonor ? 'text-teal-400' : 'text-blue-400';
  const themeBg = isDonor ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-500';
  const themeFocusBorder = isDonor ? 'focus:border-teal-500' : 'focus:border-blue-500';
  const themeGradient = isDonor ? 'from-teal-600 to-teal-800' : 'from-blue-600 to-blue-800';
  const themeTopGradient = isDonor ? 'from-teal-900/50' : 'from-blue-900/50';

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

  const handleMobileLogout = () => {
    logout();
    navigate('/login');
    toast.success("Successfully logged out.");
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-24 text-white min-h-screen"> 
        
        <header className="mb-8 md:mb-12 border-b border-slate-800 pt-6 pb-6 md:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight">
              MY <span className={themeAccent}>LEGACY.</span>
            </motion.h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] mt-1 md:mt-2">Identity & Community Impact</p>
          </div>
          
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-6 py-4 md:py-3 rounded-2xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md">
              <FaEdit /> Update Dossier
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* THE IDENTITY CARD */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden transition-all duration-500 shadow-xl">
              
              <div className={`absolute top-0 left-0 w-full h-32 md:h-40 bg-gradient-to-b ${themeTopGradient} to-transparent pointer-events-none`}></div>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="relative mb-5 md:mb-6 group">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-2xl border-4 border-slate-800 relative z-10" />
                  ) : (
                    <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center text-white font-black text-5xl md:text-6xl shadow-2xl border-4 border-slate-800 relative z-10 bg-gradient-to-tr ${themeGradient}`}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-yellow-500 text-black p-2 md:p-2.5 rounded-full shadow-lg border-4 border-slate-900 z-20" title={user.rank || 'Member'}>
                    <FaShieldAlt className="text-xs md:text-sm" />
                  </div>
                </div>
                
                {!isEditing && (
                  <>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">{user.name}</h2>
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1 md:mt-2 ${themeAccent}`}>
                      {user.rank || (user.isAdmin ? <span className="text-red-500">System Admin</span> : 'Verified Member')}
                    </p>

                    <div className="mt-5 md:mt-6 flex items-center justify-center gap-4 bg-slate-950 px-5 py-3 rounded-xl md:rounded-2xl border border-slate-800 w-full shadow-inner">
                      <div className="flex items-center gap-3">
                        <FaStar className="text-yellow-500 text-lg md:text-xl" />
                        {user.totalRatings > 0 ? (
                          <div className="flex flex-col items-start leading-none">
                            <span className="text-white font-black text-lg md:text-xl">{user.rating?.toFixed(1)}</span>
                            <span className="text-slate-500 text-[8px] md:text-[9px] uppercase font-bold tracking-widest mt-0.5">{user.totalRatings} Endorsements</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-black text-[10px] md:text-xs tracking-widest uppercase ml-1">Unranked</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 md:mt-8 space-y-2 md:space-y-3 relative z-10">
                    <div className="flex items-center gap-4 text-slate-300 bg-slate-950 border border-slate-800 p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-inner">
                      <FaEnvelope className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-300 bg-slate-950 border border-slate-800 p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-inner">
                      <FaPhone className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.phone || 'Phone Classified'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-300 bg-slate-950 border border-slate-800 p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-inner">
                      <FaTint className="text-red-500 shrink-0" /> <span className="text-xs md:text-sm font-bold truncate">Type: {user.bloodGroup || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-300 bg-slate-950 border border-slate-800 p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-inner">
                      <FaMapMarkerAlt className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.addressText || 'Sector Unknown'}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="edit" onSubmit={handleUpdateProfile} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 md:mt-6 space-y-4 relative z-10">
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 md:ml-4 mb-1.5 block">Full Name</label>
                      <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-4 py-3.5 text-white text-base md:text-sm outline-none transition-all shadow-inner ${themeFocusBorder}`} required />
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 md:ml-4 mb-1.5 block">Secure Phone</label>
                      <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXXXXXXX" className={`w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-4 py-3.5 text-white text-base md:text-sm outline-none transition-all shadow-inner placeholder-slate-600 ${themeFocusBorder}`} />
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 md:ml-4 mb-1.5 block">Blood Type</label>
                      <select value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} className={`w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-4 py-3.5 text-white text-base md:text-sm outline-none appearance-none transition-all shadow-inner cursor-pointer ${themeFocusBorder}`}>
                        <option value="" className="text-slate-500">Select Blood Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 md:ml-4 mb-1.5 block">Sector / Base</label>
                      <div className="flex gap-2">
                        <input value={formData.addressText} onChange={(e) => setFormData({...formData, addressText: e.target.value})} placeholder="e.g. Bhubaneswar" className={`flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-4 py-3.5 text-white text-base md:text-sm outline-none transition-all shadow-inner placeholder-slate-600 ${themeFocusBorder}`} />
                        <button 
                          type="button" onClick={handleGetLocation} disabled={isFetchingLocation}
                          className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl md:rounded-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-sm"
                        >
                          {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 md:gap-3 mt-6 md:mt-8 pt-4 border-t border-slate-800">
                      <button type="button" onClick={() => setIsEditing(false)} className="w-12 md:w-14 shrink-0 py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white active:scale-95 transition-all flex items-center justify-center shadow-md border border-slate-700">
                        <FaTimes className="text-lg" />
                      </button>
                      <button type="submit" className={`flex-1 py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-white shadow-md active:scale-95 border border-transparent ${themeBg}`}>
                        <FaSave className="text-lg" /> Commit Record
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* THE METRICS DASHBOARD */}
          <div className="lg:col-span-8 space-y-5 md:space-y-6">
            
            <div className="bg-slate-900 border border-yellow-500/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden group shadow-xl">
              <div className="absolute -right-8 -bottom-8 md:-right-10 md:-bottom-10 text-8xl md:text-9xl text-yellow-500/10 pointer-events-none">
                <FaAward />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-6">
                <div>
                  <p className="text-yellow-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2 flex items-center gap-2">
                    <FaStar className="animate-pulse" /> Community Standing
                  </p>
                  <h3 className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter">{user.points || 0}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1 md:mt-2">Total Experience Points (XP)</p>
                </div>
                <div className="w-full md:w-auto bg-slate-950 px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border border-yellow-500/20 text-center md:min-w-[140px] shadow-inner">
                  <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Current Rank</p>
                  <p className="text-yellow-500 font-bold text-sm md:text-base tracking-wider truncate">{user.rank || 'Initiate'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 relative overflow-hidden group shadow-md">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-slate-800/30 rounded-bl-[80px] md:rounded-bl-[100px]"></div>
                <div className={`text-3xl md:text-4xl mb-4 md:mb-6 opacity-90 ${themeAccent}`}><FaBoxOpen /></div>
                {loading ? (
                  <div className="h-10 md:h-14 w-16 md:w-24 bg-slate-800 animate-pulse rounded-lg md:rounded-xl"></div>
                ) : (
                  <h3 className="text-4xl md:text-5xl font-black text-white">{user.donationsCount || stats.totalDonations}</h3>
                )}
                <p className="text-slate-400 text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-2 md:mt-3 leading-tight">Missions Completed</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 relative overflow-hidden group shadow-md">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-slate-800/30 rounded-bl-[80px] md:rounded-bl-[100px]"></div>
                <div className={`text-3xl md:text-4xl mb-4 md:mb-6 opacity-90 ${themeAccent}`}><FaHistory /></div>
                {loading ? (
                  <div className="h-10 md:h-14 w-16 md:w-24 bg-slate-800 animate-pulse rounded-lg md:rounded-xl"></div>
                ) : (
                  <h3 className="text-4xl md:text-5xl font-black text-white">{stats.activeListings}</h3>
                )}
                <p className="text-slate-400 text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-2 md:mt-3 leading-tight">Active Field Ops</p>
              </div>
            </div>

            {/* MOBILE LOGOUT BUTTON */}
            <div className="md:hidden mt-8 pt-6 border-t border-slate-800">
              <button 
                onClick={handleMobileLogout} 
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-red-400 border border-red-900/50 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <FaSignOutAlt className="text-lg" /> Secure Logout
              </button>
            </div>

            <div className="text-center pt-6 md:pt-8 px-4">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] italic leading-relaxed text-slate-500">
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