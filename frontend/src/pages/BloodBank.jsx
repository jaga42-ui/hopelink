import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTint, FaExclamationTriangle, FaMapMarkerAlt, FaPhoneAlt, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

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
      let url = '/donations/blood-donors';
      if (lat && lng) url += `?lat=${lat}&lng=${lng}`;

      const { data } = await api.get(url);
      setBloodRequests(data);
    } catch (error) {
      toast.error("Failed to load the blood bank feed", {
        style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
      });
    } finally {
      setLoading(false);
      setLocating(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchBloodRequests(pos.coords.latitude, pos.coords.longitude),
        () => fetchBloodRequests() 
      );
    }
  }, [user]);

  const handleFindNearMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchBloodRequests(pos.coords.latitude, pos.coords.longitude);
        toast.success("Feed updated with nearest requests!", {
          style: { background: '#ffffff', color: '#29524a', border: '1px solid #846b8a' }
        });
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
        await api.put(`/donations/${id}`, { status: 'accepted' });
        toast.success("Thank you! Please check your Dashboard for contact details.");
        setBloodRequests(bloodRequests.filter(d => d._id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to respond to request");
      }
    }
  };

  const filtered = bloodRequests.filter(d => activeTab === 'All' ? true : d.bloodGroup === activeTab);

  if (loading && bloodRequests.length === 0) {
    return <Layout><div className="p-10 text-blazing-flame font-black animate-pulse italic text-center uppercase tracking-widest mt-20">Scanning Sahayam Network...</div></Layout>;
  }

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 pb-20 text-pine-teal min-h-screen">
        <header className="mb-10 pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-5xl md:text-6xl font-black text-pine-teal tracking-tighter italic flex items-center gap-4 uppercase"
            >
              <FaTint className="text-blazing-flame drop-shadow-md" /> SAHAYAM<span className="text-blazing-flame">BLOOD.</span>
            </motion.h1>
            <p className="text-dusty-lavender font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Emergency Transfusion Network</p>
          </div>

          <button 
            onClick={handleFindNearMe}
            disabled={locating}
            className="bg-white border border-dusty-lavender/30 text-blazing-flame px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pearl-beige transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
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
              className={`min-w-[70px] py-3 rounded-2xl font-black transition-all text-sm tracking-wide border ${
                activeTab === tab 
                ? 'bg-blazing-flame text-white border-blazing-flame shadow-[0_10px_25px_rgba(255,74,28,0.3)] scale-105' 
                : 'bg-white/60 text-dusty-lavender hover:bg-white hover:text-pine-teal border-white shadow-sm'
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
                  className={`bg-white/70 backdrop-blur-lg border rounded-[3rem] p-8 relative overflow-hidden flex flex-col transition-all group ${d.isEmergency ? 'border-blazing-flame/50 shadow-[0_10px_30px_rgba(255,74,28,0.15)] ring-1 ring-blazing-flame/30' : 'border-white shadow-[0_20px_40px_rgba(41,82,74,0.08)]'}`}
                >
                  {d.isEmergency && (
                    <div className="absolute top-0 right-0 px-6 py-2 bg-blazing-flame text-white font-black text-[10px] uppercase tracking-widest rounded-bl-[2rem] flex items-center gap-2 animate-pulse shadow-md">
                      <FaExclamationTriangle /> Urgent
                    </div>
                  )}

                  <div className="flex items-center gap-6 mb-6 mt-2">
                    <div className="w-20 h-20 rounded-3xl bg-blazing-flame/10 border border-blazing-flame/30 flex items-center justify-center text-blazing-flame font-black text-3xl shadow-inner">
                      {d.bloodGroup}
                    </div>
                    <div>
                      <p className="text-dusty-lavender font-bold uppercase tracking-widest text-[10px] mb-1">Required</p>
                      <h3 className="text-pine-teal font-black text-2xl leading-tight">{d.quantity}</h3>
                    </div>
                  </div>

                  <p className="text-pine-teal/80 font-medium text-sm mb-6 flex-1 line-clamp-3">
                    {d.description}
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-start gap-3 text-dusty-lavender text-xs font-medium">
                      <FaMapMarkerAlt className="mt-1 flex-shrink-0 text-dark-raspberry" />
                      <span className="leading-snug text-pine-teal font-bold">{d.location?.formattedAddress || 'Location hidden until accepted'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-dusty-lavender text-xs font-medium">
                      <FaPhoneAlt className="text-dark-raspberry" />
                      <span className="text-pine-teal font-bold">{d.donor?.name || 'Unknown Requestor'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRespond(d._id)}
                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md uppercase tracking-widest ${d.isEmergency ? 'bg-blazing-flame text-white hover:bg-[#e03a12] shadow-blazing-flame/30' : 'bg-pine-teal text-white hover:bg-[#1a3630]'}`}
                  >
                    <FaTint /> RESPOND NOW
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-24 bg-white/50 backdrop-blur-md rounded-[3rem] border border-dashed border-dusty-lavender/40 text-center flex flex-col items-center justify-center">
                <FaTint className="text-dusty-lavender/30 text-6xl mb-4" />
                <p className="text-dusty-lavender font-bold text-lg uppercase tracking-widest">No matching requests found.</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </Layout>
  );
};

export default BloodBank;