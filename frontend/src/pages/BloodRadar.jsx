import { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import { FaHeartbeat, FaLocationArrow, FaSpinner, FaBullhorn, FaExclamationTriangle, FaRunning, FaFilter, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import api from '../utils/api';
import EmergencyMatchModal from '../components/EmergencyMatchModal';

// Slightly larger icons for better touch targets
const donorIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/8155/8155451.png', 
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const myIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1183/1183783.png', 
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const FlyToLocation = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
};

const BloodRadar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const blastId = searchParams.get('blastId');

  const [myLocation, setMyLocation] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(15000); 
  const [bloodGroup, setBloodGroup] = useState('All');

  const [showBlastModal, setShowBlastModal] = useState(false);
  const [emotionalMessage, setEmotionalMessage] = useState("");
  const [isBlasting, setIsBlasting] = useState(false);
  const [activeSOS, setActiveSOS] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return toast.error("GPS not supported by your browser.");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation([latitude, longitude]);
        try {
          await api.put('/auth/location', { lat: latitude, lng: longitude });
        } catch(e) { console.error("Location update failed"); }
      },
      () => {
        setLoading(false);
        toast.error("Please allow location access to use the radar.");
      },
      { enableHighAccuracy: true }
    );
  }, [user]);

  useEffect(() => {
    if (!myLocation) return;
    const fetchDonors = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/auth/nearby-donors?lat=${myLocation[0]}&lng=${myLocation[1]}&distance=${radius}&bloodGroup=${bloodGroup}`);
        setDonors(data);
        setLoading(false);
      } catch (error) { setLoading(false); }
    };
    fetchDonors();
  }, [myLocation, radius, bloodGroup]);

  const handleEmergencyBlast = async () => {
    if (!emotionalMessage.trim()) return toast.error("Please write your message.");
    setIsBlasting(true);
    try {
      const { data } = await api.post('/auth/emergency-blast', {
        lat: myLocation[0], lng: myLocation[1],
        message: emotionalMessage, bloodGroup: user.bloodGroup || "Blood"
      });
      toast.success(`SOS broadcasted to ${data.recipients} donors! 🚀`, { 
        duration: 6000,
        style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' }
      });
      setShowBlastModal(false);
      setEmotionalMessage("");
    } catch (error) { toast.error("Failed to send SOS broadcast."); } 
    finally { setIsBlasting(false); }
  };

  const handleIAmComing = async () => {
    try {
      const { data } = await api.patch(`/donations/${blastId}/sos-accept`);
      toast.success("Emergency locked! Establish contact immediately.", { 
        duration: 5000,
        style: { background: '#0f172a', color: '#14b8a6', border: '1px solid #134e4a' }
      });
      setActiveSOS(data);
      navigate('/radar', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Someone else already responded or an error occurred.");
    }
  };

  if (!user) return null;

  return (
    <Layout>
      {/* Dynamic Viewport Height container */}
      <div className="relative w-full h-[calc(100dvh-70px)] md:h-[85vh] md:max-w-6xl md:mx-auto md:mt-4 md:rounded-[2rem] overflow-hidden text-white bg-slate-950">
        
        {/* FLOATING TOP BAR (Solid Dark) */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          
          {/* Live Status Card */}
          <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg pointer-events-auto">
            <div className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-teal-500 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.8)]'}`} />
            <span className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest">
              {donors.length} Nearby
            </span>
          </div>

          {/* Floating Filters Cards */}
          <div className="flex gap-2 pointer-events-auto">
            <select 
              value={bloodGroup} 
              onChange={e => setBloodGroup(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs font-black outline-none appearance-none text-center shadow-lg focus:border-teal-500 transition-all cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">ALL TYPE</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg} className="bg-slate-900 text-white">{bg}</option>)}
            </select>

            <select 
              value={radius} 
              onChange={e => setRadius(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs font-black outline-none appearance-none text-center shadow-lg focus:border-teal-500 transition-all cursor-pointer"
            >
              <option value={5000} className="bg-slate-900 text-white">5 KM</option>
              <option value={15000} className="bg-slate-900 text-white">15 KM</option>
              <option value={50000} className="bg-slate-900 text-white">50 KM</option>
            </select>
          </div>
        </div>

        {/* MISSION DETECTED BANNER (Solid Warning) */}
        <AnimatePresence>
          {blastId && (
            <motion.div 
              initial={{ y: -100, x: '-50%', opacity: 0 }} 
              animate={{ y: 80, x: '-50%', opacity: 1 }} 
              exit={{ y: -100, x: '-50%', opacity: 0 }}
              className="absolute top-0 left-1/2 z-[2000] bg-slate-900 border-2 border-red-900/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center gap-4 w-[90%] max-w-lg pointer-events-auto"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-950 text-red-500 border border-red-900 rounded-full flex items-center justify-center text-xl shrink-0">
                  <FaExclamationTriangle className="animate-pulse" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-black tracking-tighter leading-tight text-sm md:text-base">EMERGENCY DETECTED</h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Help needed nearby.</p>
                </div>
              </div>
              <button 
                onClick={handleIAmComing} 
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white border border-red-500 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shrink-0"
              >
                <FaRunning className="text-lg" /> I'M COMING
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* THE MAP */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          {!myLocation ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4 text-slate-500">
              <FaSpinner className="animate-spin text-4xl text-teal-600" />
              <p className="font-bold tracking-[0.2em] uppercase text-xs">Acquiring GPS Lock...</p>
            </div>
          ) : (
            <MapContainer 
              center={myLocation} 
              zoom={13} 
              zoomControl={false} 
              scrollWheelZoom={true} 
              className="w-full h-full bg-slate-950"
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <FlyToLocation center={myLocation} />
              <Circle center={myLocation} radius={radius} pathOptions={{ color: '#0d9488', fillColor: '#14b8a6', fillOpacity: 0.1, weight: 1.5 }} />
              
              <Marker position={myLocation} icon={myIcon}>
                <Popup className="custom-popup border-none"><b className="text-xs text-white">Your Location</b></Popup>
              </Marker>

              {donors.map(donor => (
                <Marker key={donor._id} position={[donor.location.coordinates[1], donor.location.coordinates[0]]} icon={donorIcon}>
                  <Popup className="rounded-2xl overflow-hidden border-0 p-0 shadow-2xl">
                    <div className="text-center p-4 w-48 bg-slate-900 border border-slate-800 rounded-2xl">
                      <img src={donor.profilePic || `https://ui-avatars.com/api/?name=${donor.name}&background=0f172a&color=fff`} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-slate-700 shadow-md" />
                      <h3 className="font-black text-white truncate text-sm">{donor.name}</h3>
                      <div className="flex justify-center items-center gap-1 mt-1 mb-4">
                        <FaHeartbeat className="text-red-500 text-xs" />
                        <span className="bg-red-950 border border-red-900 text-red-500 font-black px-2 py-0.5 rounded text-[10px]">{donor.bloodGroup}</span>
                      </div>
                      <button 
                        onClick={() => navigate(`/chat/direct_${donor._id}`, { state: { otherUserId: donor._id, otherUserName: donor.name } })}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl text-xs font-black tracking-wider transition-colors shadow-md"
                      >
                        MESSAGE
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* FLOATING SOS BUTTON */}
        <div className="absolute bottom-24 md:bottom-8 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
          <button 
            onClick={() => setShowBlastModal(true)}
            className="group relative flex items-center justify-center pointer-events-auto"
          >
            <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-30" />
            <div className="relative bg-red-600 border border-red-500 text-white px-8 py-4 md:px-10 md:py-5 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-transform active:scale-95 hover:bg-red-500">
              <FaBullhorn className="text-xl animate-bounce" />
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-shadow-sm">Send SOS Blast</span>
            </div>
          </button>
        </div>

        {/* EMERGENCY BLAST MODAL (Solid Dark) */}
        <AnimatePresence>
          {showBlastModal && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80" onClick={() => setShowBlastModal(false)} />
              
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-white"
              >
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 sm:hidden" />
                <button type="button" onClick={() => setShowBlastModal(false)} className="hidden sm:block absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full"><FaTimes className="text-sm" /></button>
                
                <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter mb-1 text-red-500">SOS BROADCAST</h2>
                <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6">Alert all {bloodGroup === 'All' ? 'donors' : bloodGroup + ' donors'} within {radius/1000}km</p>
                
                <textarea 
                  value={emotionalMessage}
                  onChange={(e) => setEmotionalMessage(e.target.value)}
                  placeholder="Explain the emergency... e.g. 'Critical surgery at Apollo Hospital. Need O+ blood immediately.'"
                  className="w-full h-32 sm:h-40 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-red-500 transition-all resize-none mb-6 shadow-inner placeholder-slate-600"
                />

                <div className="flex gap-3 sm:gap-4 pb-4 sm:pb-0">
                  <button onClick={() => setShowBlastModal(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-300 font-black uppercase tracking-widest text-[10px] transition-colors">Cancel</button>
                  <button 
                    onClick={handleEmergencyBlast}
                    disabled={isBlasting}
                    className="flex-[2] bg-red-600 active:bg-red-700 hover:bg-red-500 border border-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 transition-all disabled:opacity-50"
                  >
                    {isBlasting ? <FaSpinner className="animate-spin text-lg" /> : "Broadcast Now"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {activeSOS && (
          <EmergencyMatchModal sosData={activeSOS} onClose={() => setActiveSOS(null)} />
        )}

      </div>
    </Layout>
  );
};

export default BloodRadar;