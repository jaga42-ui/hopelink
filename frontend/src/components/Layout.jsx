import { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaExchangeAlt,
  FaShieldAlt,
  FaTrophy,
  FaBoxOpen,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

import logo from '../assets/logo.png';

const Layout = ({ children }) => {
  const { user, logout, switchRole } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isDonor = user?.activeRole === "donor"; 
  const themeAccent = isDonor ? 'text-teal-400' : 'text-blue-400';

  const menuItems = [
    { name: "Feed", path: "/dashboard", icon: <FaHome /> },
    { name: "Radar", path: "/radar", icon: <FaMapMarkerAlt />, isSpecial: true },
    { name: isDonor ? "Post" : "Request", path: "/donations", icon: <FaBoxOpen />, hideOnMobileBottom: true },
    { name: "Ranks", path: "/leaderboard", icon: <FaTrophy />, hideOnMobileBottom: true },
    { name: "Inbox", path: "/chat/inbox", icon: <FaEnvelope /> },
    { name: "Profile", path: "/profile", icon: <FaUser /> },
  ];

  return (
    <div className="h-screen bg-[#050505] flex flex-col md:flex-row font-sans selection:bg-teal-500 selection:text-white overflow-hidden">
      
      {/* ---------------- MOBILE TOP BAR ---------------- */}
      <div className="md:hidden bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex justify-between items-center z-50 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="HopeLink Logo" className="h-8 w-auto object-contain drop-shadow-md" />
          <span className="text-xl font-black text-white italic tracking-tighter">
            HOPE<span className={themeAccent}>LINK.</span>
          </span>
        </Link>
        
        {/* Quick Role Switcher for Mobile Header */}
        {user && !user.isAdmin && (
          <button
            onClick={switchRole}
            className={`p-2 rounded-xl text-xs font-black uppercase transition-all active:scale-95 border ${isDonor ? "bg-teal-500/10 text-teal-400 border-teal-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"}`}
            title={`Switch to ${isDonor ? "Receiver" : "Donor"}`}
          >
            <FaExchangeAlt />
          </button>
        )}
      </div>

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <aside className="hidden md:flex flex-col w-72 bg-[#0a0a0a] border-r border-white/5 shrink-0 relative z-40">
        <div className="h-full flex flex-col pt-8 pb-8 px-6">
          
          <div className="mb-10 flex justify-center">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img src={logo} alt="HopeLink Logo" className="h-12 w-auto object-contain drop-shadow-xl group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-black text-white italic tracking-tighter">
                HOPE<span className={themeAccent}>LINK.</span>
              </span>
            </Link>
          </div>

          {user && (
            <div className="mb-8 bg-white/5 border border-white/5 rounded-3xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer" className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
              ) : (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl uppercase ${isDonor ? "bg-teal-500/20 text-teal-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {user.name ? user.name.charAt(0) : "?"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white font-bold truncate text-sm">{user.name}</p>
                <p className={`text-[9px] uppercase font-black tracking-widest mt-0.5 ${themeAccent}`}>
                  {user.activeRole} Mode 
                </p>
              </div>
            </div>
          )}

          {/* Desktop Nav Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar pb-6">
            {user?.isAdmin && (
              <div className="mb-6 pb-6 border-b border-white/10">
                <Link to="/admin" className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 border ${location.pathname === "/admin" ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20" : "bg-red-500/5 text-red-400 border-red-500/10 hover:bg-red-500/10"}`}>
                  <span className={location.pathname === "/admin" ? "text-white" : "text-red-400"}><FaShieldAlt /></span>
                  Command Center 
                </Link>
              </div>
            )}

            {menuItems.map((item) => {
              const isActive = location.pathname === item.path; 
              const isRadar = item.path === "/radar";
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
                    isActive
                      ? isRadar
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : isDonor
                          ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20"
                          : "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : isRadar
                        ? "bg-red-500/5 text-red-400 border border-red-500/10 hover:bg-red-500/20"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={`text-lg ${isActive && isDonor && !isRadar ? "text-black" : isActive ? "text-white" : isRadar ? "text-red-500" : "text-white/30"} ${isRadar && !isActive ? "animate-pulse" : ""}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <FaSignOutAlt /> Logout 
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full bg-[#050505]">
        {/* Subtle Background Glows matching Login/Landing */}
        <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none -z-10 ${isDonor ? "bg-teal-600/10" : "bg-blue-600/10"}`} />
        <div className="h-full">
           {children}
        </div>
      </main>

      {/* ---------------- MOBILE BOTTOM NAVIGATION ---------------- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 z-50 px-2 pb-safe">
        <nav className="flex justify-around items-center h-16">
          {menuItems.filter(item => !item.hideOnMobileBottom).map((item) => {
            const isActive = location.pathname === item.path;
            const isRadar = item.path === "/radar";
            
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
              >
                {/* Active Indicator Dot */}
                {isActive && !isRadar && (
                  <motion.div layoutId="mobileNavIndicator" className={`absolute -top-px w-8 h-1 rounded-b-full ${isDonor ? 'bg-teal-400' : 'bg-blue-400'}`} />
                )}

                <div className={`text-xl transition-transform duration-300 ${
                  isActive 
                    ? isRadar ? 'text-red-500 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : isDonor ? 'text-teal-400 scale-110' : 'text-blue-400 scale-110' 
                    : isRadar ? 'text-red-500/60 animate-pulse' : 'text-white/40'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? (isRadar ? 'text-red-500' : isDonor ? 'text-teal-400' : 'text-blue-400') : 'text-white/40'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

    </div>
  );
};

export default Layout;