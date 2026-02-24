import { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import { FaHeartbeat, FaLocationArrow, FaSpinner, FaBullhorn, FaExclamationTriangle, FaRunning } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR NEW API MANAGER AND THE EMERGENCY MODAL
import api from '../utils/api';
import EmergencyMatchModal from '../components/EmergencyMatchModal';

// Custom Map Icons
const donorIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/8155/8155451.png', 
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const myIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1183/1183783.png', 
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const FlyToLocation = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 2 });
  }, [center, map]);
  return null;
};

const BloodRadar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Grab the blastId from the URL if they clicked a push notification
  const [searchParams] = useSearchParams();
  const blastId = searchParams.get('blastId');

  const [myLocation, setMyLocation] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(15000); 
  const [bloodGroup, setBloodGroup] = useState('All');

  // SOS Blast & Modal States
  const [showBlastModal, setShowBlastModal] = useState(false);
  const [emotionalMessage, setEmotionalMessage] = useState("");
  const [isBlasting, setIsBlasting] = useState(false);
  
  // 👉 NEW: State to trigger the emergency phone/map screen
  const [activeSOS, setActiveSOS] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return toast.error("GPS not supported by your browser.");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation([latitude, longitude]);
        try {
          // 👉 USING API MANAGER: No more localhost or manual headers!
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
        // 👉 USING API MANAGER
        const { data } = await api.get(`/auth/nearby-donors?lat=${myLocation[0]}&lng=${myLocation[1]}&distance=${radius}&bloodGroup=${bloodGroup}`);
        setDonors(data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchDonors();
  }, [myLocation, radius, bloodGroup]);

  // The Blast Handler (Creating an SOS)
  const handleEmergencyBlast = async () => {
    if (!emotionalMessage.trim()) return toast.error("Please write your message.");
    
    setIsBlasting(true);
    try {
      // 👉 USING API MANAGER
      const { data } = await api.post('/auth/emergency-blast', {
        lat: myLocation[0],
        lng: myLocation[1],
        message: emotionalMessage,
        bloodGroup: user.bloodGroup || "Blood"
      });

      toast.success(`SOS broadcasted to ${data.recipients} donors! 🚀`, { duration: 6000 });
      setShowBlastModal(false);
      setEmotionalMessage("");
    } catch (error) {
      toast.error("Failed to send SOS broadcast.");
    } finally {
      setIsBlasting(false);
    }
  };

  // 👉 UPDATED: The "I'm Coming" Handler connects to our new backend route and triggers the modal!
  const handleIAmComing = async () => {
    try {
      // Hit the new accept route we just built!
      const { data } = await api.patch(`/donations/${blastId}/sos-accept`);
      
      toast.success("Emergency locked! Establish contact immediately.", { duration: 5000 });
      
      // 👉 THIS POPS OPEN THE PHONE/MAP MODAL
      setActiveSOS(data);

      // Remove the blastId from the URL so the banner disappears
      navigate('/radar', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Someone else already responded or an error occurred.");
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-24 relative h-[85vh] flex flex-col">
        
        <header className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111] p-6 rounded-3xl border border-white/10 z-10 relative shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center text-2xl">
              <FaLocationArrow className={loading ? "animate-spin" : "animate-pulse"} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter">LIVE RADAR</h1>
              <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">
                {donors.length} {donors.length === 1 ? 'Donor' : 'Donors'} nearby
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <select 
              value={bloodGroup} 
              onChange={e => setBloodGroup(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-red-500"
            >
              <option value="All">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>

            <select 
              value={radius} 
              onChange={e => setRadius(Number(e.target.value))}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-red-500"
            >
              <option value={5000}>5 km Radius</option>
              <option value={15000}>15 km Radius</option>
              <option value={50000}>50 km Radius</option>
            </select>
          </div>
        </header>

        <div className="flex-1 rounded-[2rem] overflow-hidden border-2 border-white/5 relative bg-[#0a0a0a]">
          
          {/* MISSION ACCEPT PANEL */}
          <AnimatePresence>
            {blastId && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] bg-red-600/90 backdrop-blur-md border border-red-400 p-4 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.5)] flex flex-col sm:flex-row items-center gap-4 w-[90%] max-w-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white text-red-600 rounded-full flex items-center justify-center text-xl">
                    <FaExclamationTriangle className="animate-pulse" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-white font-black tracking-tighter leading-tight">EMERGENCY DETECTED</h3>
                    <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold">Someone nearby needs help now.</p>
                  </div>
                </div>
                <button 
                  onClick={handleIAmComing} 
                  className="w-full sm:w-auto bg-white text-red-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg"
                >
                  <FaRunning className="text-lg" /> I'M COMING
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!myLocation ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
              <FaSpinner className="animate-spin text-4xl mb-4 text-red-500" />
              <p className="font-bold tracking-widest uppercase text-xs">Acquiring GPS Signal...</p>
            </div>
          ) : (
            <>
              <MapContainer center={myLocation} zoom={13} scrollWheelZoom={true} className="w-full h-full z-0">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <FlyToLocation center={myLocation} />
                <Circle center={myLocation} radius={radius} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.05, weight: 1 }} />
                <Marker position={myLocation} icon={myIcon}>
                  <Popup><b>You are here</b></Popup>
                </Marker>

                {donors.map(donor => (
                  <Marker key={donor._id} position={[donor.location.coordinates[1], donor.location.coordinates[0]]} icon={donorIcon}>
                    <Popup>
                      <div className="text-center p-1 w-40">
                        <img src={donor.profilePic || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-red-500" />
                        <h3 className="font-black text-gray-900 truncate">{donor.name}</h3>
                        <div className="flex justify-center items-center gap-1 mt-1 mb-3">
                          <FaHeartbeat className="text-red-500" />
                          <span className="bg-red-100 text-red-600 font-black px-2 py-0.5 rounded text-[10px]">{donor.bloodGroup}</span>
                        </div>
                        <button 
                          onClick={() => navigate(`/chat/direct_${donor._id}`, { state: { otherUserId: donor._id, otherUserName: donor.name } })}
                          className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                        >
                          Message
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* FLOATING SOS BUTTON */}
              <button 
                onClick={() => setShowBlastModal(true)}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full shadow-[0_0_40px_rgba(220,38,38,0.5)] font-black uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
              >
                <FaBullhorn className="animate-bounce" /> SEND EMERGENCY BLAST
              </button>
            </>
          )}
        </div>

        {/* EMERGENCY BLAST MODAL */}
        <AnimatePresence>
          {showBlastModal && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBlastModal(false)} />
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-[#111] border-2 border-red-500/30 rounded-[2.5rem] p-8 shadow-2xl">
                <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">SOS BROADCAST</h2>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-6">Alert all donors within 20km</p>
                
                <textarea 
                  value={emotionalMessage}
                  onChange={(e) => setEmotionalMessage(e.target.value)}
                  placeholder="Explain the emergency... e.g. 'Critical surgery at Apollo Hospital. Need O+ blood immediately to save a life.'"
                  className="w-full h-40 bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-red-500 transition-all resize-none mb-6"
                />

                <div className="flex gap-4">
                  <button onClick={() => setShowBlastModal(false)} className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest text-[10px]">Cancel</button>
                  <button 
                    onClick={handleEmergencyBlast}
                    disabled={isBlasting}
                    className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                  >
                    {isBlasting ? <FaSpinner className="animate-spin" /> : "Broadcast SOS"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 👉 NEW: THE EMERGENCY CONTACT MODAL (Pops up when they click I'M COMING) */}
        {activeSOS && (
          <EmergencyMatchModal 
            sosData={activeSOS} 
            onClose={() => setActiveSOS(null)} 
          />
        )}

      </div>
    </Layout>
  );
};

export default BloodRadar;