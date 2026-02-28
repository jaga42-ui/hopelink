import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaShieldAlt,
  FaChartPie,
  FaUsers,
  FaBoxOpen,
  FaTrash,
  FaSpinner,
  FaBan,
  FaUserShield,
  FaUserTimes,
  FaEnvelope,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaBullhorn,
  FaFlag,
  FaCheck
} from "react-icons/fa";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const Admin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [listings, setListings] = useState([]);
  const [eventsList, setEventsList] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 👉 MISSION CONTROL STATES
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastLevel, setBroadcastLevel] = useState("info");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Security Check
  useEffect(() => {
    if (user && !user.isAdmin) {
      toast.error("Unauthorized Area");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes, listingsRes, eventsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/listings"),
          api.get("/events"),
        ]);

        setStats(statsRes.data);
        setUsersList(usersRes.data);
        setListings(listingsRes.data);
        setEventsList(eventsRes.data);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load admin data");
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user]);

  // 👉 THE RED BUTTON: Global Broadcast
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setIsBroadcasting(true);
    try {
      await api.post("/admin/broadcast", { message: broadcastMsg, level: broadcastLevel });
      toast.success("Broadcast deployed globally!");
      setBroadcastMsg("");
    } catch (error) {
      toast.error("Broadcast failed.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  // 👉 MODERATION QUEUE: Whitelist or Purge
  const handleReportAction = async (id, action) => {
    try {
      await api.patch(`/admin/resolve-report/${id}`, { action });
      toast.success(action === 'delete' ? "Hostile post purged." : "Post whitelisted.");
      
      // Instantly remove it from the local moderation queue UI
      setStats(prev => ({
        ...prev,
        reportedPosts: prev.reportedPosts.filter(p => p._id !== id)
      }));
      
      // Also remove it from the master listings tab if we deleted it
      if (action === 'delete') {
        setListings(prev => prev.filter(l => l._id !== id));
      }

    } catch (error) {
      toast.error("Moderation action failed.");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY BAN ${name} and delete all their posts?`,
      )
    ) {
      try {
        await api.delete(`/admin/users/${id}`);
        setUsersList(usersList.filter((u) => u._id !== id));
        toast.success("User banished.");
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleToggleRole = async (id, name, currentStatus) => {
    if (
      window.confirm(
        `Are you sure you want to ${currentStatus ? "REVOKE Admin rights from" : "PROMOTE"} ${name}?`,
      )
    ) {
      try {
        const { data } = await api.patch(`/admin/users/${id}/role`);
        setUsersList(
          usersList.map((u) =>
            u._id === id ? { ...u, isAdmin: data.isAdmin } : u,
          ),
        );
        toast.success(data.message);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to update user role",
        );
      }
    }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm(`Force delete this listing from the database?`)) {
      try {
        await api.delete(`/admin/listings/${id}`);
        setListings(listings.filter((l) => l._id !== id));
        toast.success("Listing obliterated.");
      } catch (error) {
        toast.error("Failed to delete listing");
      }
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (window.confirm(`Force delete the event: "${title}"?`)) {
      try {
        await api.delete(`/events/${id}`);
        setEventsList(eventsList.filter((e) => e._id !== id));
        toast.success("Event permanently removed.");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };

  if (!user || !user.isAdmin) return null;

  // Pie Chart Colors
  const COLORS = ["#14b8a6", "#3b82f6", "#ef4444"];
  const pieData = stats
    ? [
        { name: "Donations", value: stats.totalDonations },
        { name: "Requests", value: stats.totalRequests },
        { name: "Active SOS", value: stats.activeSOS || 0 },
      ]
    : [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pb-32 min-h-screen text-white relative">
        {/* HEADER */}
        <header className="mb-8 border-b border-slate-800 pt-6 pb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-red-500 w-full md:w-auto justify-center md:justify-start">
            <FaShieldAlt className="text-4xl md:text-5xl drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter drop-shadow-md">
                COMMAND <span className="text-red-500">CENTER</span>
              </h1>
              <p className="text-red-400 text-[10px] uppercase font-black tracking-[0.3em]">
                System Administrator
              </p>
            </div>
          </div>

          {/* SOLID DARK NAVIGATION TABS */}
          <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 min-w-max shadow-inner">
              {[
                { id: "overview", label: "Overview", icon: <FaChartPie /> },
                { id: "users", label: "Users", icon: <FaUsers /> },
                { id: "listings", label: "Content", icon: <FaBoxOpen /> },
                { id: "events", label: "Events", icon: <FaCalendarAlt /> },
                { id: "moderation", label: "Moderation", icon: <FaFlag /> }, // 👉 NEW MODERATION TAB
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 flex-1 md:flex-none ${
                    activeTab === tab.id 
                      ? "bg-red-600 text-white shadow-md" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  } ${tab.id === 'moderation' && stats?.reportedPosts?.length > 0 ? "text-orange-400 animate-pulse" : ""}`}
                >
                  {tab.icon} <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-red-500" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { title: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
                    { title: "Active SOS", value: stats.activeSOS || 0, color: "text-red-500", icon: <FaExclamationTriangle className="animate-pulse" /> },
                    { title: "Missions Fulfilled", value: stats.fulfilledItems, color: "text-green-400" },
                    { title: "Total Hub Content", value: stats.totalDonations + stats.totalRequests, color: "text-white" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-8 relative overflow-hidden group shadow-lg flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {stat.icon && (
                          <span className={stat.color}>{stat.icon}</span>
                        )}
                        <p className="text-slate-400 text-[8px] md:text-[10px] uppercase font-black tracking-widest">
                          {stat.title}
                        </p>
                      </div>
                      <h3 className={`text-4xl md:text-6xl font-black ${stat.color} drop-shadow-md`}>
                        {stat.value}
                      </h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Left: Graphs */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-lg h-[350px] flex flex-col">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-6 drop-shadow-sm">
                        30-Day Community Growth
                      </h3>
                      <div className="flex-1 w-full h-full">
                        {stats.growthData && stats.growthData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={stats.growthData}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="date"
                                stroke="#475569"
                                tick={{ fontSize: 10, fill: "#94a3b8" }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                stroke="#475569"
                                tick={{ fontSize: 10, fill: "#94a3b8" }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#0f172a",
                                  border: "1px solid #1e293b",
                                  borderRadius: "12px",
                                  color: "#f8fafc",
                                }}
                                itemStyle={{ color: "#14b8a6", fontWeight: "bold" }}
                              />
                              <Area
                                type="monotone"
                                dataKey="Users"
                                stroke="#14b8a6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                            Awaiting Intel...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: The Red Button & Pie Chart */}
                  <div className="space-y-6">
                    {/* The Red Button */}
                    <div className="bg-slate-900 border border-red-900/50 rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(220,38,38,0.1)] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500" />
                      <h2 className="text-sm font-black uppercase tracking-widest text-red-400 mb-6 flex items-center gap-2">
                        <FaBullhorn /> Global Override
                      </h2>
                      <form onSubmit={handleBroadcast} className="space-y-4">
                        <select 
                          value={broadcastLevel} 
                          onChange={(e) => setBroadcastLevel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl p-3 outline-none focus:border-red-500"
                        >
                          <option value="info">Standard Info Update</option>
                          <option value="critical">CRITICAL EMERGENCY</option>
                        </select>
                        <textarea
                          required
                          rows="2"
                          placeholder="Type message to blast to all screens..."
                          value={broadcastMsg}
                          onChange={(e) => setBroadcastMsg(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-red-500"
                        />
                        <button 
                          disabled={isBroadcasting}
                          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isBroadcasting ? "Transmitting..." : "Initiate Broadcast"}
                        </button>
                      </form>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-lg h-[250px] flex flex-col">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2 drop-shadow-sm text-center">
                        Activity Distribution
                      </h3>
                      <div className="flex-1 w-full h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                border: "1px solid #1e293b",
                                borderRadius: "8px",
                                color: "#f8fafc",
                              }}
                              itemStyle={{ fontWeight: "bold" }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={20}
                              iconType="circle"
                              wrapperStyle={{
                                fontSize: "10px",
                                fontWeight: "bold",
                                color: "#cbd5e1",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODERATION QUEUE TAB */}
            {activeTab === "moderation" && (
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl min-h-[60vh]">
                <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                    <FaFlag /> Community Reports
                  </h2>
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-lg text-xs font-bold">
                    {stats?.reportedPosts?.length || 0} Flags
                  </span>
                </div>
                
                <div className="space-y-4">
                  {!stats?.reportedPosts || stats.reportedPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-60">
                      <FaCheckCircle className="text-6xl mb-4 text-green-900" />
                      <p className="font-bold tracking-widest uppercase text-xs">Grid is Secure. No active reports.</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {stats.reportedPosts.map((post) => (
                        <motion.div 
                          key={post._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-md"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-red-950 text-red-500 border border-red-900 rounded-[4px] text-[8px] font-black uppercase tracking-widest animate-pulse">
                                {post.reports.length} Reports
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Author: {post.donorId?.name || "Unknown"}</span>
                            </div>
                            <h3 className="font-bold text-white text-base mb-1">{post.title}</h3>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{post.description}</p>
                          </div>
                          
                          <div className="flex w-full md:w-auto gap-3 shrink-0 mt-2 md:mt-0">
                            <button 
                              onClick={() => handleReportAction(post._id, 'whitelist')}
                              className="flex-1 md:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <FaCheck /> Whitelist
                            </button>
                            <button 
                              onClick={() => handleReportAction(post._id, 'delete')}
                              className="flex-1 md:flex-none px-6 py-3 bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-red-900/50 shadow-sm"
                            >
                              <FaTrash /> Purge
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <>
                <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-black">User</th>
                        <th className="px-6 py-4 font-black">Email</th>
                        <th className="px-6 py-4 font-black">Points</th>
                        <th className="px-6 py-4 font-black">Joined</th>
                        <th className="px-6 py-4 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {usersList.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-300">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white">{u.name}</p>
                              {u.isAdmin && (
                                <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase shadow-sm">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{u.email}</td>
                          <td className="px-6 py-4 font-black text-yellow-500 drop-shadow-sm">
                            {u.points} XP
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {u._id !== user._id && (
                              <>
                                <button
                                  onClick={() => handleToggleRole(u._id, u.name, u.isAdmin)}
                                  className={`p-2 rounded-xl transition-all border ${u.isAdmin ? "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-600 hover:text-white" : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white"}`}
                                  title={u.isAdmin ? "Revoke Admin" : "Make Admin"}
                                >
                                  {u.isAdmin ? <FaUserTimes /> : <FaUserShield />}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id, u.name)}
                                  className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white p-2 rounded-xl transition-all"
                                  title="Ban User"
                                >
                                  <FaBan />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Cards */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {usersList.map((u) => (
                    <div key={u._id} className="bg-slate-900 border border-slate-800 rounded-[1.5rem] p-5 flex flex-col gap-4 shadow-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-300 text-lg">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight">{u.name}</p>
                            <p className="text-slate-400 text-[10px] flex items-center gap-1 mt-1">
                              <FaEnvelope /> {u.email}
                            </p>
                          </div>
                        </div>
                        {u.isAdmin && (
                          <span className="text-[8px] bg-red-600 text-white px-2 py-1 rounded font-black uppercase shadow-sm">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-2 border-y border-slate-800">
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-black">Points</p>
                          <p className="text-yellow-500 font-black text-xs drop-shadow-sm">{u.points} XP</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-500 uppercase font-black">Joined</p>
                          <p className="text-slate-300 font-bold text-xs">{new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {u._id !== user._id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleRole(u._id, u.name, u.isAdmin)}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 border ${u.isAdmin ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}
                          >
                            {u.isAdmin ? <><FaUserTimes /> Demote</> : <><FaUserShield /> Promote</>}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
                          >
                            <FaBan /> Banish
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* LISTINGS TAB */}
            {activeTab === "listings" && (
              <>
                <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-black">Type</th>
                        <th className="px-6 py-4 font-black">Title</th>
                        <th className="px-6 py-4 font-black">Owner</th>
                        <th className="px-6 py-4 font-black">Status</th>
                        <th className="px-6 py-4 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {listings.map((l) => (
                        <tr key={l._id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            {l.isEmergency ? (
                              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-red-900/30 text-red-400 border-red-500/30">
                                SOS
                              </span>
                            ) : (
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${l.listingType === "request" ? "bg-blue-900/30 text-blue-400 border-blue-500/30" : "bg-teal-900/30 text-teal-400 border-teal-500/30"}`}>
                                {l.listingType}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">{l.title}</td>
                          <td className="px-6 py-4 text-slate-300">{l.donorId?.name || "Deleted User"}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${l.status === "fulfilled" ? "bg-green-900/30 text-green-400 border-green-500/30" : l.status === "hidden" ? "bg-orange-900/30 text-orange-400 border-orange-500/30" : "bg-yellow-900/30 text-yellow-400 border-yellow-500/30"}`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteListing(l._id)}
                              className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white p-2 rounded-xl transition-all"
                              title="Force Delete"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {listings.map((l) => (
                    <div key={l._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
                      <div className="flex justify-between items-center">
                        {l.isEmergency ? (
                          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-red-900/30 text-red-400 border-red-500/30">SOS</span>
                        ) : (
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${l.listingType === "request" ? "bg-blue-900/30 text-blue-400 border-blue-500/30" : "bg-teal-900/30 text-teal-400 border-teal-500/30"}`}>
                            {l.listingType}
                          </span>
                        )}
                        <span className={`text-[9px] font-black uppercase ${l.status === "fulfilled" ? "text-green-400" : l.status === "hidden" ? "text-orange-400" : "text-yellow-400"}`}>
                          {l.status}
                        </span>
                      </div>
                      <h4 className="text-white font-bold leading-snug drop-shadow-sm">{l.title}</h4>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-black">Owner</p>
                          <p className="text-slate-300 text-xs font-bold">{l.donorId?.name || "Deleted User"}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteListing(l._id)}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl active:bg-red-600 active:text-white transition-all active:scale-95"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* EVENTS TAB */}
            {activeTab === "events" && (
              <>
                {eventsList.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-md">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                      No Active Events
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-800">
                          <tr>
                            <th className="px-6 py-4 font-black">Category</th>
                            <th className="px-6 py-4 font-black">Event Title</th>
                            <th className="px-6 py-4 font-black">Organizer</th>
                            <th className="px-6 py-4 font-black">Date</th>
                            <th className="px-6 py-4 font-black text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {eventsList.map((e) => (
                            <tr key={e._id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-purple-500/10 text-purple-400 border-purple-500/20">
                                  {e.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">{e.title}</td>
                              <td className="px-6 py-4 text-slate-300">{e.organizationId?.name || "Unknown"}</td>
                              <td className="px-6 py-4 text-slate-400">{new Date(e.eventDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteEvent(e._id, e.title)}
                                  className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white p-2 rounded-xl transition-all"
                                  title="Delete Event"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {eventsList.map((e) => (
                        <div key={e._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-purple-500/10 text-purple-400 border-purple-500/20">
                              {e.category}
                            </span>
                          </div>
                          <h4 className="text-white font-bold leading-snug drop-shadow-sm">{e.title}</h4>
                          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                            <div>
                              <p className="text-[8px] text-slate-500 uppercase font-black">Date</p>
                              <p className="text-slate-300 text-xs font-bold">{new Date(e.eventDate).toLocaleDateString()}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteEvent(e._id, e.title)}
                              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl active:bg-red-600 active:text-white transition-all active:scale-95"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;