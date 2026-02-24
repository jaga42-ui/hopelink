import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaHandHoldingHeart, FaUser, FaSignOutAlt, FaUserCog, FaMapMarkerAlt } from 'react-icons/fa'; // 👉 Imported FaMapMarkerAlt
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getLinkClasses = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      isActive 
        ? "bg-white/20 text-white font-bold shadow-lg border border-white/10"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;
  };

  return (
    <div className="h-screen w-64 bg-black/30 backdrop-blur-xl border-r border-white/10 text-white flex flex-col fixed left-0 top-0 shadow-2xl z-50">
      
      <div className="p-8 text-3xl font-extrabold tracking-wide text-center border-b border-white/10">
        <span className="text-white">Hope</span>
        <span className="text-teal-400">Link</span>
      </div>

      <nav className="flex-1 mt-8 px-4 space-y-3">
        <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
          <FaHome className="text-xl" /> <span>Dashboard</span>
        </Link>
        
        {/* 👉 NEW: The Live Blood Radar Link */}
        <Link to="/radar" className={getLinkClasses('/radar')}>
          <FaMapMarkerAlt className={`text-xl ${location.pathname === '/radar' ? 'text-red-500 animate-pulse' : 'text-red-400/70'}`} /> 
          <span>Live Radar</span>
        </Link>

        <Link to="/donations" className={getLinkClasses('/donations')}>
          <FaHandHoldingHeart className="text-xl" /> <span>Donations</span>
        </Link>
        
        {/* Profile Link */}
        <Link to="/profile" className={getLinkClasses('/profile')}>
          <FaUserCog className="text-xl" /> <span>Profile</span>
        </Link>
        
        {user?.role === 'admin' && (
          <Link to="/users" className={getLinkClasses('/users')}>
            <FaUser className="text-xl" /> <span>Users</span>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-2 mb-4 bg-white/5 rounded-xl">
           <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-xs font-bold uppercase">
             {user?.name?.charAt(0)}
           </div>
           <div className="truncate">
             <p className="text-xs font-bold text-white truncate">{user?.name}</p>
             <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
           </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center space-x-3 text-white/50 hover:text-red-400 transition-all w-full px-4 py-2 cursor-pointer"
        >
          <FaSignOutAlt /> <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;