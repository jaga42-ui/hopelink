import { useState, useContext } from "react";
import { motion, AnimatePresence } from 'framer-motion';
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
  const themeAccent = isDonor ? 'text-teal-100' : 'text-blue-100';

  const menuItems = [
    { name: "Feed", path: "/dashboard", icon: <FaHome /> },
    { name: "Radar", path: "/radar", icon: <FaMapMarkerAlt />, isSpecial: true },
    { name: isDonor ? "Post" : "Request", path: "/donations", icon: <FaBoxOpen />, hideOnMobileBottom: true },
    { name: "Ranks", path: "/leaderboard", icon: <FaTrophy />, hideOnMobileBottom: true },
    { name: "Inbox", path: "/chat/inbox", icon: <FaEnvelope /> },
    { name: "Profile", path: "/profile", icon: <FaUser /> },
  ];

  return (
    // 👉 APPLIED BRAND GRADIENT AS THE BASE
    <div className="h-screen bg-brand-gradient flex flex-col md:flex-row font-sans selection:bg-white selection:text-teal-900 overflow-hidden">
      
      {/* ---------------- MOBILE TOP BAR (Frosted Glass) ---------------- */}
      <div className="md:hidden bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 py-3 flex justify-between items-center z-50 shrink-0 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="HopeLink Logo" className="h-8 w-auto object-contain drop-shadow-md" />
          <span className="text-xl font-black text-white italic tracking-tighter drop-shadow-sm">
            HOPE<span className={themeAccent}>LINK.</span>
          </span>
        </Link>
        
        {/* Quick Role Switcher for Mobile Header */}
        {user && !user.isAdmin && (
          <button
            onClick={switchRole}
            className="p-2.5 rounded-xl bg-white/20 border border-white/30 text-white transition-all active:scale-90 shadow-md"
            title={`Switch to ${isDonor ? "Receiver" : "Donor"}`}
          >
            <FaExchangeAlt className="text-xs" />
          </button>
        )}
      </div>

      {/* ---------------- DESKTOP SIDEBAR (Frosted Dark Glass) ---------------- */}
      <aside className="hidden md:flex flex-col w-72 bg-black/10 backdrop-blur-2xl border-r border-white/20 shrink-0 relative z-40 shadow-2xl">
        <div className="h-full flex flex-col pt-8 pb-8 px-6">
          
          <div className="mb-10 flex justify-center">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img src={logo} alt="HopeLink Logo" className="h-12 w-auto object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
              <span className="text-3xl font-black text-white italic tracking-tighter drop-shadow-md">
                HOPE<span className={themeAccent}>LINK.</span>
              </span>
            </Link>
          </div>

          {user && (
            <div 
              className="mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-4 flex items-center gap-4 hover:bg-white/20 transition-all cursor-pointer shadow-lg" 
              onClick={() => navigate('/profile')}
            >
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer" className="w-12 h-12 rounded-2xl object-cover border border-white/30 shadow-sm" />
              ) : (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl uppercase shadow-sm border border-white/20 ${isDonor ? "bg-teal-500/40" : "bg-blue-500/40"}`}>
                  {user.name ? user.name.charAt(0) : "?"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white font-bold truncate text-sm drop-shadow-sm">{user.name}</p>
                <p className={`text-[9px] uppercase font-black tracking-widest mt-0.5 ${themeAccent}`}>
                  {user.activeRole} Mode 
                </p>
              </div>
            </div>
          )}

          {/* Desktop Nav Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar pb-6">
            {user?.isAdmin && (
              <div className="mb-6 pb-6 border-b border-white/20">
                <Link to="/admin" className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 border ${location.pathname === "/admin" ? "bg-red-500 text-white border-red-400 shadow-lg" : "bg-white/10 text-white border-white/10 hover:bg-white/20"}`}>
                  <span className={location.pathname === "/admin" ? "text-white" : "text-red-300"}><FaShieldAlt /></span>
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
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 border ${
                    isActive
                      ? isRadar
                        ? "bg-red-600 border-red-500 text-white shadow-lg"
                        : "bg-white text-teal-800 border-white shadow-xl"
                      : isRadar
                        ? "bg-white/5 border-transparent text-red-200 hover:bg-white/10"
                        : "bg-transparent border-transparent text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className={`text-lg ${isActive && !isRadar ? "text-teal-600" : isActive ? "text-white" : isRadar ? "text-red-400" : "text-white/50"} ${isRadar && !isActive ? "animate-pulse" : ""}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-white/50 hover:bg-white/10 hover:text-white transition-all">
            <FaSignOutAlt /> Logout 
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full">
        {/* The main content area sits directly on top of the brand gradient now. No black backgrounds. */}
        <div className="h-full">
           {children}
        </div>
      </main>

      {/* ---------------- MOBILE BOTTOM NAVIGATION (Frosted Glass) ---------------- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-2xl border-t border-white/20 z-50 px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
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
                {/* Active Indicator Dot (White to pop against gradient) */}
                {isActive && !isRadar && (
                  <motion.div layoutId="mobileNavIndicator" className="absolute -top-px w-8 h-1 rounded-b-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                )}

                <div className={`text-xl transition-transform duration-300 ${
                  isActive 
                    ? isRadar ? 'text-red-400 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-white scale-110 drop-shadow-md' 
                    : isRadar ? 'text-red-300/80 animate-pulse' : 'text-white/50'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? (isRadar ? 'text-red-400' : 'text-white') : 'text-white/50'}`}>
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