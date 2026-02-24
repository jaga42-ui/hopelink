import { FaPhoneAlt, FaCommentDots, FaDirections, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const EmergencyMatchModal = ({ sosData, onClose }) => {
  const navigate = useNavigate();

  if (!sosData || !sosData.donorId) return null;

  // MongoDB stores coordinates as [longitude, latitude]
  const lng = sosData.location.coordinates[0];
  const lat = sosData.location.coordinates[1];
  
  // Universal Google Maps Deep Link for exact driving directions
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      <div className="bg-red-900/20 border border-red-500/30 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] relative overflow-hidden">
        
        {/* Glowing Radar Background Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-red-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-10">
          <FaTimes size={24} />
        </button>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 text-red-400 rounded-full mb-6 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
            <FaPhoneAlt size={32} className="animate-bounce" />
          </div>
          
          <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">CRISIS MATCHED.</h2>
          <p className="text-red-200 font-medium mb-8">
            You are responding to <b className="text-white">{sosData.donorId.name}</b>. Every second counts. Please establish contact immediately.
          </p>

          <div className="space-y-4">
            {/* 👉 NATIVE PHONE CALL TRIGGER */}
            <a 
              href={`tel:${sosData.donorId.phone}`} 
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              <FaPhoneAlt /> Call {sosData.donorId.name} Now
            </a>

            {/* 👉 GOOGLE MAPS ROUTING */}
            <a 
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all backdrop-blur-md hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              <FaDirections /> Get GPS Directions
            </a>

            {/* IN-APP CHAT FALLBACK */}
            <button 
              onClick={() => {
                onClose();
                navigate(`/chat/${sosData._id}`);
              }}
              className="w-full py-4 text-white/50 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <FaCommentDots /> Open In-App Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyMatchModal;