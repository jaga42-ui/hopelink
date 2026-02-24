import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaUser, FaClock, FaTint, FaUtensils, FaTshirt, FaBook } from 'react-icons/fa';

const DonationCard = ({ d, onClaim, userRole }) => {
  const getIcon = (type) => {
    switch(type) {
      case 'blood': return <FaTint className="text-red-500" />;
      case 'food': return <FaUtensils className="text-orange-500" />;
      case 'clothes': return <FaTshirt className="text-purple-500" />;
      case 'books': return <FaBook className="text-blue-500" />;
      default: return null;
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl hover:border-white/40 transition-all group"
    >
      {/* Image Section */}
      <div className="h-48 bg-black/20 relative overflow-hidden">
        {d.photo ? (
          <img src={d.photo} alt={d.description} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl opacity-20">
            {getIcon(d.type)}
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-white tracking-widest border border-white/20">
          {d.type}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-xl font-black text-white mb-2 truncate">{d.description}</h3>
        
        <div className="space-y-2 mb-6">
          <p className="text-white/60 text-sm flex items-center gap-2 font-medium">
            <FaUser className="text-teal-400" /> {d.donor?.name || 'Anonymous Donor'}
          </p>
          <p className="text-white/60 text-sm flex items-center gap-2 font-medium">
            <FaMapMarkerAlt className="text-red-400" /> {d.location.formattedAddress}
          </p>
          <p className="text-white/60 text-sm flex items-center gap-2 font-medium">
            <FaClock className="text-emerald-400" /> {new Date(d.createdAt).toLocaleDateString()}
          </p>
        </div>

        {userRole === 'receiver' ? (
          <button 
            onClick={() => onClaim(d._id)}
            className="w-full bg-white text-teal-700 font-black py-3 rounded-2xl hover:bg-teal-50 transition shadow-xl active:scale-95"
          >
            Claim Now
          </button>
        ) : (
          <div className="w-full bg-white/5 text-white/40 text-center py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10">
            My Listing
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DonationCard;