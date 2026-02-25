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

  // 👉 SOLID DARK THEME VARIABLES
  const isDonor = user?.activeRole === "donor"; 
  const themeTextAccent = isDonor ? 'text-teal-400' : 'text-blue-400';
  const themeBgAccent = isDonor ? 'bg-teal-500' : 'bg-blue-500';

  const menuItems = [
    { name: "Feed", path: "/dashboard", icon: <FaHome /> },
    { name: "Radar", path: "/radar", icon: <FaMapMarkerAlt />, isSpecial: true },
    { name: isDonor ? "Post" : "Request", path: "/donations", icon: <FaBoxOpen />, hideOnMobileBottom: true },
    { name: "Ranks", path: "/leaderboard", icon: <FaTrophy />, hideOnMobileBottom: true },
    { name: "Inbox", path: "/chat/inbox", icon: <FaEnvelope /> },
    { name: "Profile", path: "/profile", icon: <FaUser /> },
  ];

  return (
    // 👉 APPLIED SOLID DARK BASE (No more gradient)
    <div className="h-screen bg-slate-950 flex flex-col md:flex-row font-sans selection:bg-teal-500 selection:text-white overflow-hidden">
      
      {/* ---------------- MOBILE TOP BAR (Solid Dark) ---------------- */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center z-50 shrink-0 shadow-md">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="HopeLink Logo" className="h-8 w-auto object-contain" />
          <span className="text-xl font-black text-white italic tracking-tighter">
            HOPE<span className={themeTextAccent}>LINK.</span>
          </span>
        </Link>
        
        {/* Quick Role Switcher for Mobile Header */}
        {user && !user.isAdmin && (
          <button
            onClick={switchRole}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all active:scale-90 shadow-sm"
            title={`Switch to ${isDonor ? "Receiver" : "Donor"}`}
          >
            <FaExchangeAlt className="text-xs" />
          </button>
        )}
      </div>

      {/* ---------------- DESKTOP SIDEBAR (Solid Dark) ---------------- */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 border-r border-slate-800 shrink-0 relative z-40 shadow-xl">
        <div className="h-full flex flex-col pt-8 pb-8 px-6">
          
          <div className="mb-10 flex justify-center">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img src={logo} alt="HopeLink Logo" className="h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-500" />
              <span className="text-3xl font-black text-white italic tracking-tighter">
                HOPE<span className={themeTextAccent}>LINK.</span>
              </span>
            </Link>
          </div>

          {user && (
            <div 
              className="mb-8 bg-slate-950 border border-slate-800 rounded-[2rem] p-4 flex items-center gap-4 hover:bg-slate-800 transition-all cursor-pointer shadow-inner" 
              onClick={() => navigate('/profile')}
            >
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer" className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-sm" />
              ) : (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl uppercase shadow-sm border border-slate-700 ${isDonor ? "bg-teal-600" : "bg-blue-600"}`}>
                  {user.name ? user.name.charAt(0) : "?"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white font-bold truncate text-sm">{user.name}</p>
                <p className={`text-[9px] uppercase font-black tracking-widest mt-0.5 ${themeTextAccent}`}>
                  {user.activeRole} Mode 
                </p>
              </div>
            </div>
          )}

          {/* Desktop Nav Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar pb-6">
            {user?.isAdmin && (
              <div className="mb-6 pb-6 border-b border-slate-800">
                <Link to="/admin" className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 border ${location.pathname === "/admin" ? "bg-red-900/40 text-red-400 border-red-800 shadow-inner" : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800 hover:text-white"}`}>
                  <span className={location.pathname === "/admin" ? "text-red-400" : "text-slate-500"}><FaShieldAlt /></span>
                  Command Center 
                </Link>
              </div>
            )}

            {menuItems.map((item) => {
              const isActive = location.pathname === item.path; 
              const isRadar = item.path === "/radar";
              
              // Dynamic Active Styling based on solid theme
              let linkClass = "bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-white";
              if (isActive) {
                if (isRadar) {
                  linkClass = "bg-red-900/30 border-red-800 text-red-400 shadow-inner";
                } else {
                  linkClass = `bg-slate-800 text-white border-slate-700 shadow-md`;
                }
              } else if (isRadar) {
                linkClass = "bg-transparent border-transparent text-red-400/70 hover:bg-slate-800 hover:text-red-400";
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 border ${linkClass}`}
                >
                  <span className={`text-lg ${isActive && !isRadar ? themeTextAccent : isActive ? "text-red-400" : isRadar ? "text-red-500/70" : "text-slate-500"} ${isRadar && !isActive ? "animate-pulse" : ""}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-all">
            <FaSignOutAlt /> Logout 
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full bg-slate-950">
        <div className="h-full">
           {children}
        </div>
      </main>

      {/* ---------------- MOBILE BOTTOM NAVIGATION (Solid Dark) ---------------- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
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
                  <motion.div layoutId="mobileNavIndicator" className={`absolute -top-px w-8 h-1 rounded-b-full ${themeBgAccent} shadow-[0_0_10px_currentColor]`} />
                )}

                <div className={`text-xl transition-transform duration-300 ${
                  isActive 
                    ? isRadar ? 'text-red-500 scale-110' : `${themeTextAccent} scale-110` 
                    : isRadar ? 'text-red-500/70 animate-pulse' : 'text-slate-500'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? (isRadar ? 'text-red-400' : 'text-white') : 'text-slate-500'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Admin Button strictly for Mobile Nav */}
          {user?.isAdmin && (
            <Link 
              to="/admin" 
              className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
            >
              {location.pathname === "/admin" && (
                <motion.div layoutId="mobileNavIndicator" className="absolute -top-px w-8 h-1 rounded-b-full bg-red-500 shadow-[0_0_10px_currentColor]" />
              )}
              <div className={`text-xl transition-transform duration-300 ${location.pathname === "/admin" ? 'text-red-400 scale-110' : 'text-slate-500'}`}>
                <FaShieldAlt />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider ${location.pathname === "/admin" ? 'text-white' : 'text-slate-500'}`}>
                Admin
              </span>
            </Link>
          )}

        </nav>
      </div>

    </div>
  );
};

export default Layout;