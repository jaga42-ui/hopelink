import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaUser, FaClock, FaTint, FaUtensils, FaTshirt, FaBook, FaBoxOpen } from 'react-icons/fa';

const DonationCard = ({ d, onClaim, userRole }) => {
  // Mapping categories to dynamic colors to match the new dark aesthetic
  const getIconConfig = (type) => {
    switch(type?.toLowerCase()) {
      case 'blood': return { icon: <FaTint />, color: 'text-red-500', border: 'border-red-900/50' };
      case 'food': return { icon: <FaUtensils />, color: 'text-orange-500', border: 'border-orange-900/50' };
      case 'clothes': return { icon: <FaTshirt />, color: 'text-purple-500', border: 'border-purple-900/50' };
      case 'books': 
      case 'book': return { icon: <FaBook />, color: 'text-blue-500', border: 'border-blue-900/50' };
      default: return { icon: <FaBoxOpen />, color: 'text-teal-500', border: 'border-teal-900/50' };
    }
  };

  // Support both 'type' (old schema) and 'category' (new schema)
  const config = getIconConfig(d.type || d.category);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900 border border-slate-800 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-lg hover:border-slate-700 transition-all group flex flex-col`}
    >
      {/* Image Section */}
      <div className={`h-40 md:h-48 relative overflow-hidden bg-slate-950 border-b ${config.border} shrink-0`}>
        {d.photo || d.image ? (
          <img 
            src={d.photo || d.image} 
            alt={d.title || d.description} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform duration-700 bg-slate-950">
            <div className={`text-7xl md:text-8xl ${config.color}`}>
              {config.icon}
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-slate-900 px-3 py-1 md:py-1.5 rounded-md text-[9px] md:text-[10px] font-black uppercase text-slate-300 tracking-widest border border-slate-700 shadow-md">
          {d.type || d.category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 md:p-6 flex flex-col flex-1">
        <h3 className="text-lg md:text-xl font-black text-white mb-3 leading-tight line-clamp-2">
          {d.title || d.description}
        </h3>
        
        <div className="space-y-2 mb-5 md:mb-6 flex-1">
          <p className="text-slate-400 text-xs md:text-sm flex items-center gap-2 font-bold truncate">
            <FaUser className={config.color} /> 
            <span className="truncate">{d.donor?.name || 'Unknown Operator'}</span>
          </p>
          <p className="text-slate-400 text-xs md:text-sm flex items-center gap-2 font-bold truncate">
            <FaMapMarkerAlt className={config.color} /> 
            <span className="truncate">{d.location?.formattedAddress || d.addressText || 'Location Unknown'}</span>
          </p>
          <p className="text-slate-400 text-xs md:text-sm flex items-center gap-2 font-bold">
            <FaClock className={config.color} /> 
            {new Date(d.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Button Area */}
        <div className="mt-auto pt-4 border-t border-slate-800">
          {userRole === 'receiver' ? (
            <button 
              onClick={() => onClaim(d._id)}
              // 👉 NEW: Receiver actions use the Blue theme
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-blue-900/50 active:scale-95"
            >
              Claim Directive
            </button>
          ) : (
            <div className="w-full bg-slate-950 text-slate-500 text-center py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-slate-800 shadow-inner">
              Active Listing
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DonationCard;