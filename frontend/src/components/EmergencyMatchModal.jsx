import { FaPhoneAlt, FaCommentDots, FaDirections, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const EmergencyMatchModal = ({ sosData, onClose }) => {
  const navigate = useNavigate();

  if (!sosData || !sosData.donorId) return null;

  // MongoDB stores coordinates as [longitude, latitude]
  const lng = sosData.location.coordinates[0];
  const lat = sosData.location.coordinates[1];
  
  // 👉 FIXED: Official Google Maps Universal Deep Link for routing directions
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    // Fixed wrapper to handle bottom-sheet on mobile and centered modal on desktop
    <div className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      
      {/* Blurred Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* The Tactical Bottom Sheet / Modal */}
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 25, stiffness: 200 }} 
        className="relative w-full max-w-md bg-[#0a0a0a] border-t sm:border border-red-500/30 rounded-t-[2.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(220,38,38,0.15)] overflow-hidden"
      >
        {/* Mobile Pull Tab */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
        
        {/* Desktop Close Button */}
        <button onClick={onClose} className="hidden sm:block absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-20">
          <FaTimes className="text-xl" />
        </button>

        {/* Glowing Radar Background Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-600/5 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 text-red-500 rounded-2xl sm:rounded-[2rem] mb-5 sm:mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <FaPhoneAlt className="text-2xl sm:text-3xl animate-bounce" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter mb-2 uppercase leading-tight">
            CRISIS <span className="text-red-500">MATCHED.</span>
          </h2>
          
          <p className="text-red-200/80 text-xs sm:text-sm font-medium mb-6 sm:mb-8 px-2">
            You are responding to <b className="text-white">{sosData.donorId.name}</b>. Every second counts. Establish contact immediately.
          </p>

          <div className="space-y-3 sm:space-y-4">
            {/* 👉 NATIVE PHONE CALL TRIGGER */}
            <a 
              href={`tel:${sosData.donorId.phone}`} 
              className="w-full py-4 sm:py-5 bg-red-600 active:bg-red-700 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-95 flex items-center justify-center gap-3"
            >
              <FaPhoneAlt className="text-lg" /> Call {sosData.donorId.name.split(' ')[0]} Now
            </a>

            {/* 👉 GOOGLE MAPS ROUTING */}
            <a 
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 sm:py-4 bg-[#111] active:bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <FaDirections className="text-lg text-blue-400" /> GPS Routing
            </a>

            {/* IN-APP CHAT FALLBACK */}
            <button 
              onClick={() => {
                onClose();
                // Pass state so the chat header renders the name correctly
                navigate(`/chat/${sosData._id}`, {
                  state: { otherUserId: sosData.donorId._id, otherUserName: sosData.donorId.name, itemTitle: "Emergency SOS" }
                });
              }}
              className="w-full pt-4 pb-2 text-white/40 hover:text-white/80 rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <FaCommentDots className="text-sm" /> Open Secure Chat
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmergencyMatchModal;