import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBoxOpen, FaUser, FaSignOutAlt, FaTrophy, FaMapMarkerAlt, FaShieldAlt, FaExchangeAlt, FaEnvelope } from 'react-icons/fa'; 
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';

import logo from '../assets/logo.png'; 

const Sidebar = () => {
  const { user, logout, switchRole } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('System override successful. Session terminated.', {
      style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' }
    });
    navigate('/login');
  };

  // 👉 SOLID DARK THEME VARIABLES
  const isDonor = user?.activeRole === 'donor';
  const themeAccent = isDonor ? 'text-teal-400' : 'text-blue-400';
  const themeBg = isDonor ? 'bg-teal-600' : 'bg-blue-600';

  const getLinkClasses = (path, isRadar = false) => {
    const isActive = location.pathname === path;
    if (isRadar) {
      return `flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold ${
        isActive 
          ? "bg-red-600 text-white shadow-lg shadow-red-900/50" 
          : "bg-transparent text-red-500/70 hover:bg-slate-800 hover:text-red-400"
      }`;
    }
    return `flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold ${
      isActive 
        ? `${themeBg} text-white shadow-lg scale-[1.02]` 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;
  };

  return (
    // 👉 SOLID DARK BASE
    <div className="h-screen w-72 bg-slate-950 border-r border-slate-800 text-white flex flex-col fixed left-0 top-0 z-50 overflow-hidden">
      
      {/* SIDEBAR HEADER: Logo + Animated Role Switcher */}
      <div className="p-8 pb-6">
        <Link to="/dashboard" className="flex items-center gap-3 group mb-8">
          <img src={logo} alt="HopeLink" className="h-10 w-auto group-hover:rotate-12 transition-transform" />
          <span className="text-2xl font-black italic tracking-tighter uppercase">
            HOPE<span className={themeAccent}>LINK.</span>
          </span>
        </Link>

        {user && !user.isAdmin && (
          <button 
            onClick={switchRole}
            className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-2xl hover:border-slate-700 transition-all shadow-inner"
          >
            <span className={`text-[9px] font-black uppercase tracking-widest flex-1 text-center ${isDonor ? 'text-teal-400' : 'text-slate-500'}`}>Donor</span>
            <div className="w-10 h-5 bg-slate-950 rounded-full relative border border-slate-700">
              <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-300 ${isDonor ? 'bg-teal-500' : 'bg-blue-500 translate-x-5'}`} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest flex-1 text-center ${!isDonor ? 'text-blue-400' : 'text-slate-500'}`}>Receiver</span>
          </button>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {user?.isAdmin && (
          <Link to="/admin" className="flex items-center space-x-3 px-5 py-3.5 rounded-2xl font-bold bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-600 hover:text-white transition-all mb-6">
            <FaShieldAlt /> <span>Admin Console</span>
          </Link>
        )}

        <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
          <FaHome className="text-lg" /> <span>Feed</span>
        </Link>
        
        <Link to="/radar" className={getLinkClasses('/radar', true)}>
          <FaMapMarkerAlt className={`text-lg ${location.pathname === '/radar' ? '' : 'animate-pulse'}`} /> 
          <span>Crisis Radar</span>
        </Link>

        <Link to="/donations" className={getLinkClasses('/donations')}>
          <FaBoxOpen className="text-lg" /> <span>{isDonor ? 'Post Item' : 'Request Item'}</span>
        </Link>

        <Link to="/chat/inbox" className={getLinkClasses('/chat/inbox')}>
          <FaEnvelope className="text-lg" /> <span>Secure Inbox</span>
        </Link>
        
        <Link to="/leaderboard" className={getLinkClasses('/leaderboard')}>
          <FaTrophy className="text-lg" /> <span>Leaderboard</span>
        </Link>

        <Link to="/profile" className={getLinkClasses('/profile')}>
          <FaUser className="text-lg" /> <span>Profile</span>
        </Link>
      </nav>

      {/* USER PROFILE & LOGOUT SECTION */}
      <div className="p-4 mt-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-4 shadow-md">
          <div className="flex items-center gap-3">
            {user?.profilePic ? (
              <img src={user.profilePic} className="w-10 h-10 rounded-xl object-cover border border-slate-700" referrerPolicy="no-referrer" />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg uppercase ${isDonor ? "bg-teal-900/50 text-teal-400" : "bg-blue-900/50 text-blue-400"}`}>
                {user?.name?.charAt(0)}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate uppercase tracking-tighter">{user?.name}</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${themeAccent}`}>
                LVL {Math.floor((user?.points || 0) / 100)} {user?.rank || 'Operator'}
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="group flex items-center gap-3 w-full px-5 py-4 text-slate-500 hover:text-red-400 transition-all rounded-2xl hover:bg-slate-800 font-black uppercase tracking-widest text-[10px]"
        >
          <FaSignOutAlt className="text-lg group-hover:rotate-12 transition-transform" /> 
          <span>End Session</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;