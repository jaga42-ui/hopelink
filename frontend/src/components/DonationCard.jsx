import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaUser, FaClock, FaTint, FaUtensils, FaTshirt, FaBook, FaBoxOpen } from 'react-icons/fa';

const DonationCard = ({ d, onClaim, userRole }) => {
  // Mapping categories to dynamic colors to match the new dark aesthetic
  const getIconConfig = (type) => {
    switch(type?.toLowerCase()) {
      case 'blood': return { icon: <FaTint />, color: 'text-red-500', border: 'border-red-500/30' };
      case 'food': return { icon: <FaUtensils />, color: 'text-orange-400', border: 'border-orange-400/30' };
      case 'clothes': return { icon: <FaTshirt />, color: 'text-purple-400', border: 'border-purple-400/30' };
      case 'books': return { icon: <FaBook />, color: 'text-blue-400', border: 'border-blue-400/30' };
      default: return { icon: <FaBoxOpen />, color: 'text-teal-400', border: 'border-teal-400/30' };
    }
  };

  // Support both 'type' (old schema) and 'category' (new schema)
  const config = getIconConfig(d.type || d.category);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#111] border border-white/10 rounded-3xl md:rounded-[2rem] overflow-hidden shadow-xl hover:border-white/20 transition-all group flex flex-col`}
    >
      {/* Image Section */}
      <div className={`h-40 md:h-48 relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-b ${config.border} shrink-0`}>
        {d.photo || d.image ? (
          <img 
            src={d.photo || d.image} 
            alt={d.title || d.description} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-700">
            <div className={`text-7xl md:text-8xl ${config.color}`}>
              {config.icon}
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-[#0a0a0a]/90 backdrop-blur-md px-3 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase text-white tracking-widest border border-white/10 shadow-lg">
          {d.type || d.category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 md:p-6 flex flex-col flex-1">
        <h3 className="text-lg md:text-xl font-black text-white mb-3 leading-tight line-clamp-2">
          {d.title || d.description}
        </h3>
        
        <div className="space-y-2 mb-5 md:mb-6 flex-1">
          <p className="text-white/60 text-xs md:text-sm flex items-center gap-2 font-bold truncate">
            <FaUser className={config.color} /> 
            <span className="truncate">{d.donor?.name || 'Unknown Operator'}</span>
          </p>
          <p className="text-white/60 text-xs md:text-sm flex items-center gap-2 font-bold truncate">
            <FaMapMarkerAlt className={config.color} /> 
            <span className="truncate">{d.location?.formattedAddress || d.addressText || 'Location Unknown'}</span>
          </p>
          <p className="text-white/60 text-xs md:text-sm flex items-center gap-2 font-bold">
            <FaClock className={config.color} /> 
            {new Date(d.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Button Area */}
        <div className="mt-auto pt-4 border-t border-white/10">
          {userRole === 'receiver' ? (
            <button 
              onClick={() => onClaim(d._id)}
              className="w-full bg-teal-500 hover:bg-teal-400 text-[#050505] font-black uppercase tracking-widest text-[10px] md:text-xs py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] active:scale-95"
            >
              Claim Directive
            </button>
          ) : (
            <div className="w-full bg-white/5 text-white/40 text-center py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/5">
              Active Listing
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DonationCard;