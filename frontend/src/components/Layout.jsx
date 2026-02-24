import { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaExchangeAlt,
  FaShieldAlt,
  FaTrophy,
  FaBoxOpen,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

// 👉 Importing your custom logo
import logo from '../assets/logo.png';

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, switchRole } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isDonor = user?.activeRole === "donor"; 

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Live Radar", path: "/radar", icon: <FaMapMarkerAlt />, isSpecial: true },
    { name: isDonor ? "Post Item" : "Request Item", path: "/donations", icon: <FaBoxOpen /> },
    { name: "Leaderboard", path: "/leaderboard", icon: <FaTrophy /> },
    { name: "Inbox", path: "/chat/inbox", icon: <FaEnvelope /> },
    { name: "My Profile", path: "/profile", icon: <FaUser /> },
  ];

  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col md:flex-row font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Mobile Navbar */}
      <div className="md:hidden bg-white/5 backdrop-blur-2xl border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-50">
        {/* 👉 LOGO + TEXT COMBINED FOR MOBILE */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="HopeLink Logo" className="h-14 w-auto drop-shadow-md" />
          <span className="text-2xl font-black text-white italic tracking-tighter">
            HOPE<span className={isDonor ? "text-teal-400" : "text-blue-400"}>LINK.</span>
          </span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-black/40 backdrop-blur-3xl border-r border-white/10 transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full flex flex-col pt-20 md:pt-10 pb-8 px-6">
          
          {/* Desktop Sidebar Header */}
          <div className="mb-10 hidden md:flex justify-center">
            {/* 👉 LOGO + TEXT COMBINED FOR DESKTOP */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img src={logo} alt="HopeLink Logo" className="h-20 w-auto drop-shadow-xl group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-black text-white italic tracking-tighter">
                HOPE<span className={isDonor ? "text-teal-400" : "text-blue-400"}>LINK.</span>
              </span>
            </Link>
          </div>

          {/* User Profile Badge */}
          {user && (
            <div className="mb-8 bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center gap-4">
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-white/20"
                />
              ) : (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg uppercase ${isDonor ? "bg-gradient-to-tr from-teal-400 to-emerald-600" : "bg-gradient-to-tr from-blue-400 to-indigo-600"}`}>
                  {user.name ? user.name.charAt(0) : "?"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white font-bold truncate">{user.name}</p>
                <p className={`text-[10px] uppercase font-black tracking-widest mt-1 ${isDonor ? "text-teal-400" : "text-blue-400"}`}>
                  {user.activeRole} Mode 
                </p>
              </div>
            </div>
          )}

          {/* THE ROLE SWITCHER */}
          {user && !user.isAdmin && (
            <button
              onClick={switchRole}
              className={`mb-8 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${isDonor ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500 hover:text-white" : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white"}`}
            >
              <FaExchangeAlt /> Switch to {isDonor ? "Receiver" : "Donor"}
            </button>
          )}

          {/* Nav Links */}
          <nav className="flex-1 space-y-2 no-scrollbar overflow-y-auto">
            {/* Admin Command Center */}
            {user?.isAdmin && (
              <div className="mb-6 pb-6 border-b border-white/10">
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 border ${location.pathname === "/admin" ? "bg-red-500 text-white border-red-400 shadow-xl shadow-red-500/20 scale-105" : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:text-red-300"}`}
                >
                  <span className={location.pathname === "/admin" ? "text-white" : "text-red-400"}>
                    <FaShieldAlt />
                  </span>
                  Command Center 
                </Link>
              </div>
            )}

            {/* Standard Menu Items */}
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path; 
              const isRadar = item.path === "/radar";
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${
                    isActive
                      ? isRadar
                        ? "bg-red-600 text-white shadow-xl shadow-red-600/30"
                        : isDonor
                          ? "bg-teal-500 text-white shadow-xl shadow-teal-500/20 scale-105"
                          : "bg-blue-500 text-white shadow-xl shadow-blue-500/20 scale-105"
                      : isRadar
                        ? "bg-red-500/5 text-red-400/70 border border-red-500/10 hover:bg-red-500/20 hover:text-red-400"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={`${isActive ? "text-white" : isRadar ? "text-red-500" : "text-white/30"} ${isRadar && !isActive ? "animate-pulse" : ""}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-500/10 transition-all"
          >
            <FaSignOutAlt /> Logout 
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar relative p-4 md:p-8">
        <div
          className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none -z-10 ${isDonor ? "bg-teal-500/10" : "bg-blue-500/10"}`}
        />
        {children}
      </main>
    </div>
  );
};

export default Layout;