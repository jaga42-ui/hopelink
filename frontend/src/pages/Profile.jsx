import { useState, useEffect, useContext } from 'react';
import axios from 'axios'; // 👉 Kept strictly for the external OpenStreetMap API
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaMapMarkerAlt, FaTint, FaBoxOpen, FaAward, FaHistory, FaEdit, FaSave, FaTimes, FaPhone, FaLocationArrow, FaSpinner, FaStar, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
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
  const themeGlow = isDonor ? 'shadow-[0_0_60px_rgba(20,184,166,0.15)]' : 'shadow-[0_0_60px_rgba(59,130,246,0.15)]';

  useEffect(() => {
    const fetchImpactStats = async () => {
      if (!user?.token) return;
      try {
        // 👉 CLEAN REQUEST: No localhost, no manual token headers!
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
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Standard axios for the external map API
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`);
          
          const addressInfo = data.address;
          const cityString = addressInfo.city || addressInfo.town || addressInfo.village || addressInfo.state || 'Unknown Location';
          
          setFormData({ ...formData, addressText: cityString });
          toast.success(`Location found: ${cityString}`);
        } catch (error) {
          toast.error("Could not resolve location address");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error('Please allow location permissions in your browser');
      }
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // 👉 CLEAN REQUEST
      const { data } = await api.put('/auth/profile', formData);
      
      login(data); 
      setIsEditing(false);
      toast.success("Identity updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-24">
        
        <header className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-5xl md:text-6xl font-black text-white italic tracking-tighter">
              MY <span className={themeAccent}>LEGACY.</span>
            </motion.h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Identity & Community Impact Dashboard</p>
          </div>
          
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 backdrop-blur-md">
              <FaEdit /> Update Dossier
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* THE IDENTITY CARD (Left Column) */}
          <div className="lg:col-span-4 space-y-8">
            <div className={`bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden ${themeGlow} transition-all duration-500`}>
              
              {/* Elegant Gradient Backdrop */}
              <div className={`absolute top-0 left-0 w-full h-40 opacity-20 bg-gradient-to-b ${isDonor ? 'from-teal-500' : 'from-blue-500'} to-transparent pointer-events-none`}></div>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer" className="w-36 h-36 rounded-full object-cover shadow-2xl border-4 border-[#111] relative z-10" />
                  ) : (
                    <div className={`w-36 h-36 rounded-full flex items-center justify-center text-white font-black text-6xl shadow-2xl border-4 border-[#111] relative z-10 bg-gradient-to-tr ${isDonor ? 'from-teal-400 to-emerald-800' : 'from-blue-400 to-indigo-800'}`}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                  {/* Rank Insignia */}
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black p-2.5 rounded-full shadow-lg border-4 border-[#0a0a0a] z-20" title={user.rank || 'Member'}>
                    <FaShieldAlt className="text-sm" />
                  </div>
                </div>
                
                {!isEditing && (
                  <>
                    <h2 className="text-3xl font-black text-white tracking-tight">{user.name}</h2>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${themeAccent}`}>
                      {user.rank || (user.isAdmin ? <span className="text-red-400">System Admin</span> : 'Verified Member')}
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 w-full">
                      <div className="flex items-center gap-2">
                        <FaStar className="text-yellow-400 text-xl drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                        {user.totalRatings > 0 ? (
                          <div className="flex flex-col items-start leading-none">
                            <span className="text-white font-black text-xl">{user.rating?.toFixed(1)}</span>
                            <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-0.5">{user.totalRatings} Endorsements</span>
                          </div>
                        ) : (
                          <span className="text-white font-black text-xs tracking-widest uppercase ml-1">Unranked</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 space-y-3 relative z-10">
                    <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                      <FaEnvelope className={themeAccent} /> <span className="text-sm font-bold truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                      <FaPhone className={themeAccent} /> <span className="text-sm font-bold truncate">{user.phone || 'Phone Classified'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                      <FaTint className="text-red-400" /> <span className="text-sm font-bold">Type: {user.bloodGroup || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                      <FaMapMarkerAlt className={themeAccent} /> <span className="text-sm font-bold truncate">{user.addressText || 'Sector Unknown'}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="edit" onSubmit={handleUpdateProfile} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 space-y-4 relative z-10">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Full Name</label>
                      <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-white/30 transition-all shadow-inner" required />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Secure Phone</label>
                      <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXXXXXXX" className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-white/30 transition-all shadow-inner" />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Blood Type</label>
                      <select value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-white/30 appearance-none transition-all shadow-inner cursor-pointer">
                        <option value="">Select Blood Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Sector / Base</label>
                      <div className="flex gap-2">
                        <input value={formData.addressText} onChange={(e) => setFormData({...formData, addressText: e.target.value})} placeholder="e.g. Bhubaneswar" className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-white/30 transition-all shadow-inner" />
                        <button 
                          type="button" 
                          onClick={handleGetLocation}
                          disabled={isFetchingLocation}
                          className="px-4 bg-white/10 text-white border border-white/20 rounded-2xl hover:bg-white/20 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg"
                          title="Lock GPS Coordinates"
                        >
                          {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                      <button type="button" onClick={() => setIsEditing(false)} className="w-14 flex-shrink-0 py-4 rounded-2xl font-black text-xs uppercase bg-white/5 text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center">
                        <FaTimes className="text-lg" />
                      </button>
                      <button type="submit" className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${themeBg} text-white shadow-xl hover:scale-[1.02] active:scale-95`}>
                        <FaSave className="text-lg" /> Commit Record
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* THE METRICS DASHBOARD (Right Column) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* The Golden XP Banner */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-[#111] border border-yellow-500/30 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group hover:border-yellow-500/50 transition-all shadow-2xl">
              <div className="absolute -right-10 -bottom-10 text-9xl text-yellow-500/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <FaAward />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <p className="text-yellow-500/70 text-xs font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                    <FaStar className="animate-pulse" /> Community Standing
                  </p>
                  <h3 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-xl">{user.points || 0}</h3>
                  <p className="text-white/60 font-bold uppercase tracking-widest text-[10px] mt-2">Total Experience Points (XP)</p>
                </div>
                <div className="bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[140px]">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Current Rank</p>
                  <p className="text-yellow-400 font-bold tracking-wider">{user.rank || 'Initiate'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Transactions Metric */}
              <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-[#151515] transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] transition-colors group-hover:bg-white/10"></div>
                <div className={`text-4xl mb-6 opacity-80 group-hover:scale-110 transition-transform ${themeAccent}`}><FaBoxOpen /></div>
                {loading ? (
                  <div className="h-14 w-24 bg-white/5 animate-pulse rounded-xl"></div>
                ) : (
                  <h3 className="text-5xl font-black text-white">{user.donationsCount || stats.totalDonations}</h3>
                )}
                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-3">Missions Completed</p>
              </div>

              {/* Active Logistics Metric */}
              <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-[#151515] transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] transition-colors group-hover:bg-white/10"></div>
                <div className={`text-4xl mb-6 opacity-80 group-hover:scale-110 transition-transform ${themeAccent}`}><FaHistory /></div>
                {loading ? (
                  <div className="h-14 w-24 bg-white/5 animate-pulse rounded-xl"></div>
                ) : (
                  <h3 className="text-5xl font-black text-white">{stats.activeListings}</h3>
                )}
                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-3">Active Field Operations</p>
              </div>

            </div>

            {/* A Subtle Motivational Quote */}
            <div className="text-center pt-8 opacity-40 hover:opacity-100 transition-opacity">
              <p className="text-xs font-bold uppercase tracking-[0.2em] italic">"A community is only as strong as its willingness to protect one another."</p>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Profile;