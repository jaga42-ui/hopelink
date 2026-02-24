import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTint, FaExclamationTriangle, FaMapMarkerAlt, FaPhoneAlt, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
import api from '../utils/api';

const BloodBank = () => {
  const { user } = useContext(AuthContext);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const fetchBloodRequests = async (lat = null, lng = null) => {
    try {
      setLoading(true);
      
      // 👉 CLEAN URL: No localhost!
      let url = '/donations/blood-donors';
      if (lat && lng) {
        url += `?lat=${lat}&lng=${lng}`;
      }

      // 👉 CLEAN REQUEST: No manual headers!
      const { data } = await api.get(url);
      setBloodRequests(data);
    } catch (error) {
      toast.error("Failed to load the blood bank feed");
    } finally {
      setLoading(false);
      setLocating(false);
    }
  };

  // On initial load, try to get location for proximity sorting
  useEffect(() => {
    if (user) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchBloodRequests(pos.coords.latitude, pos.coords.longitude),
        () => fetchBloodRequests() // Fallback without location if denied
      );
    }
  }, [user]);

  // Manual location refresh button
  const handleFindNearMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchBloodRequests(pos.coords.latitude, pos.coords.longitude);
        toast.success("Feed updated with nearest requests!");
      },
      () => {
        setLocating(false);
        toast.error("Location access denied.");
      }
    );
  };

  const handleRespond = async (id) => {
    if (window.confirm("Commit to this blood request? Your contact info will be shared.")) {
      try {
        // 👉 CLEAN REQUEST: Just api.put
        await api.put(`/donations/${id}`, { status: 'accepted' });
        
        toast.success("Thank you! Please check your Dashboard for contact details.");
        
        // Remove from public feed
        setBloodRequests(bloodRequests.filter(d => d._id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to respond to request");
      }
    }
  };

  const filtered = bloodRequests.filter(d => activeTab === 'All' ? true : d.bloodGroup === activeTab);

  if (loading && bloodRequests.length === 0) {
    return <Layout><div className="p-10 text-red-400 font-black animate-pulse italic">SCANNING FOR BLOOD REQUESTS...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <header className="mb-10 pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-6xl font-black text-white tracking-tighter italic flex items-center gap-4"
            >
              <FaTint className="text-red-500" /> BLOOD<span className="text-red-400">BANK.</span>
            </motion.h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Emergency Transfusion Network</p>
          </div>

          <button 
            onClick={handleFindNearMe}
            disabled={locating}
            className="bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-2"
          >
            {locating ? <FaSpinner className="animate-spin" /> : <><FaMapMarkerAlt /> Find Near Me</>}
          </button>
        </header>

        {/* Blood Group Filters */}
        <div className="flex gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
          {bloodGroups.map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`min-w-[70px] py-3 rounded-2xl font-black transition-all text-sm tracking-wide ${
                activeTab === tab 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filtered.length > 0 ? (
              filtered.map(d => (
                <motion.div 
                  key={d._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white/5 backdrop-blur-3xl border rounded-[3rem] p-8 relative overflow-hidden flex flex-col transition-all group ${d.isEmergency ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-white/10 hover:border-white/20'}`}
                >
                  {/* Emergency Pulse Indicator */}
                  {d.isEmergency && (
                    <div className="absolute top-0 right-0 px-6 py-2 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-bl-[2rem] flex items-center gap-2 animate-pulse">
                      <FaExclamationTriangle /> Urgent
                    </div>
                  )}

                  <div className="flex items-center gap-6 mb-6 mt-2">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 font-black text-3xl shadow-inner">
                      {d.bloodGroup}
                    </div>
                    <div>
                      <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-1">Required</p>
                      <h3 className="text-white font-bold text-xl leading-tight">{d.quantity} Units</h3>
                    </div>
                  </div>

                  <p className="text-white/80 font-medium text-sm mb-6 flex-1 line-clamp-3">
                    {d.description}
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-start gap-3 text-white/50 text-xs font-medium">
                      <FaMapMarkerAlt className="mt-1 flex-shrink-0 text-red-400" />
                      <span className="leading-snug">{d.location?.formattedAddress || 'Location hidden until accepted'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/50 text-xs font-medium">
                      <FaPhoneAlt className="text-red-400" />
                      <span>{d.donor?.name || 'Unknown Requestor'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRespond(d._id)}
                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${d.isEmergency ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-red-800 hover:bg-red-50'}`}
                  >
                    <FaTint /> RESPOND NOW
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10 text-center flex flex-col items-center justify-center">
                <FaTint className="text-white/10 text-6xl mb-4" />
                <p className="text-white/40 font-bold text-lg uppercase tracking-widest">No matching requests found.</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
};

export default BloodBank;