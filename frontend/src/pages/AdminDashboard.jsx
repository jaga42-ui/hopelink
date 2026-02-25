import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaShieldAlt, FaChartPie, FaUsers, FaBoxOpen, FaTrash, FaSpinner, FaBan, FaUserShield, FaUserTimes, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Admin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Security Check
  useEffect(() => {
    if (user && !user.isAdmin) {
      toast.error("Unauthorized Area");
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes, listingsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/listings')
        ]);
        
        setStats(statsRes.data);
        setUsersList(usersRes.data);
        setListings(listingsRes.data);
        setLoading(false);
      } catch (error) { 
        toast.error("Failed to load admin data"); 
        setLoading(false); 
      }
    };
    fetchAdminData();
  }, [user]);

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY BAN ${name} and delete all their posts?`)) {
      try {
        await api.delete(`/admin/users/${id}`);
        setUsersList(usersList.filter(u => u._id !== id));
        toast.success("User banished.");
      } catch (error) { toast.error("Failed to delete user"); }
    }
  };

  const handleToggleRole = async (id, name, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'REVOKE Admin rights from' : 'PROMOTE'} ${name}?`)) {
      try {
        const { data } = await api.patch(`/admin/users/${id}/role`);
        setUsersList(usersList.map(u => u._id === id ? { ...u, isAdmin: data.isAdmin } : u));
        toast.success(data.message);
      } catch (error) { toast.error(error.response?.data?.message || "Failed to update user role"); }
    }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm(`Force delete this listing from the database?`)) {
      try {
        await api.delete(`/admin/listings/${id}`);
        setListings(listings.filter(l => l._id !== id));
        toast.success("Listing obliterated.");
      } catch (error) { toast.error("Failed to delete listing"); }
    }
  };

  if (!user || !user.isAdmin) return null;

  // Pie Chart Colors
  const COLORS = ['#14b8a6', '#3b82f6', '#ef4444'];
  const pieData = stats ? [
    { name: 'Donations', value: stats.totalDonations },
    { name: 'Requests', value: stats.totalRequests },
    { name: 'Active SOS', value: stats.activeSOS || 0 },
  ] : [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pb-32 min-h-screen text-white relative"> 
        
        {/* HEADER */}
        <header className="mb-8 border-b border-white/10 pt-6 pb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-red-500 w-full md:w-auto justify-center md:justify-start">
            <FaShieldAlt className="text-4xl md:text-5xl drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter drop-shadow-md">COMMAND <span className="text-red-500">CENTER</span></h1>
              <p className="text-red-300 text-[10px] uppercase font-black tracking-[0.3em]">System Administrator</p>
            </div>
          </div>
          
          {/* NAVIGATION TABS (Glassmorphism) */}
          <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex bg-black/30 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20 min-w-max shadow-lg">
              {[
                { id: 'overview', label: 'Overview', icon: <FaChartPie /> },
                { id: 'users', label: 'Users', icon: <FaUsers /> },
                { id: 'listings', label: 'Content', icon: <FaBoxOpen /> }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 flex-1 md:flex-none ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  {tab.icon} <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-red-500" /></div>
        ) : (
          <div className="space-y-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                
                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { title: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
                    { title: "Active SOS", value: stats.activeSOS || 0, color: "text-red-500", icon: <FaExclamationTriangle className="animate-pulse" /> },
                    { title: "Missions Fulfilled", value: stats.fulfilledItems, color: "text-green-400" },
                    { title: "Total Hub Content", value: stats.totalDonations + stats.totalRequests, color: "text-white" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-[2rem] p-5 md:p-8 relative overflow-hidden group shadow-xl flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-2">
                        {stat.icon && <span className={stat.color}>{stat.icon}</span>}
                        <p className="text-white/70 text-[8px] md:text-[10px] uppercase font-black tracking-widest">{stat.title}</p>
                      </div>
                      <h3 className={`text-4xl md:text-6xl font-black ${stat.color} drop-shadow-md`}>{stat.value}</h3>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  
                  {/* Growth Graph (Spans 2 columns) */}
                  <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl h-[400px] flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/80 mb-6 drop-shadow-sm">30-Day Community Growth</h3>
                    <div className="flex-1 w-full h-full">
                      {stats.growthData && stats.growthData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{fontSize: 10, fill: 'rgba(255,255,255,0.6)'}} tickLine={false} axisLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.3)" tick={{fontSize: 10, fill: 'rgba(255,255,255,0.6)'}} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff' }}
                              itemStyle={{ color: '#14b8a6', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="Users" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold uppercase tracking-widest">Awaiting Intel...</div>
                      )}
                    </div>
                  </div>

                  {/* Activity Distribution Pie Chart */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl h-[400px] flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/80 mb-2 drop-shadow-sm">Activity Distribution</h3>
                    <div className="flex-1 w-full h-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }} itemStyle={{ fontWeight: 'bold' }}/>
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <>
                {/* Desktop Table View (Glassmorphism) */}
                <div className="hidden md:block bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-black/30 text-white/70 text-[10px] uppercase tracking-widest border-b border-white/20">
                      <tr>
                        <th className="px-6 py-4 font-black">User</th>
                        <th className="px-6 py-4 font-black">Email</th>
                        <th className="px-6 py-4 font-black">Points</th>
                        <th className="px-6 py-4 font-black">Joined</th>
                        <th className="px-6 py-4 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {usersList.map(u => (
                        <tr key={u._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-white border border-white/10">{u.name.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-white">{u.name}</p>
                              {u.isAdmin && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase shadow-sm">Admin</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white/80">{u.email}</td>
                          <td className="px-6 py-4 font-black text-yellow-400 drop-shadow-sm">{u.points} XP</td>
                          <td className="px-6 py-4 text-white/60">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {u._id !== user._id && (
                              <>
                                <button onClick={() => handleToggleRole(u._id, u.name, u.isAdmin)} className={`p-2 rounded-lg transition-all border ${u.isAdmin ? 'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500 hover:text-white' : 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500 hover:text-white'}`} title={u.isAdmin ? "Revoke Admin" : "Make Admin"}>
                                  {u.isAdmin ? <FaUserTimes /> : <FaUserShield />}
                                </button>
                                <button onClick={() => handleDeleteUser(u._id, u.name)} className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all" title="Ban User">
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

                {/* Mobile Card View (Glassmorphism) */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {usersList.map(u => (
                    <div key={u._id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/10 flex items-center justify-center font-black text-white text-lg">{u.name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-white leading-tight">{u.name}</p>
                            <p className="text-white/60 text-[10px] flex items-center gap-1 mt-1"><FaEnvelope /> {u.email}</p>
                          </div>
                        </div>
                        {u.isAdmin && <span className="text-[8px] bg-red-600 text-white px-2 py-1 rounded font-black uppercase shadow-sm">Admin</span>}
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-y border-white/10">
                        <div>
                          <p className="text-[8px] text-white/50 uppercase font-black">Points</p>
                          <p className="text-yellow-400 font-black text-xs drop-shadow-sm">{u.points} XP</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-white/50 uppercase font-black">Joined</p>
                          <p className="text-white/80 font-bold text-xs">{new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {u._id !== user._id && (
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleRole(u._id, u.name, u.isAdmin)} className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 border ${u.isAdmin ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                            {u.isAdmin ? <><FaUserTimes /> Demote</> : <><FaUserShield /> Promote</>}
                          </button>
                          <button onClick={() => handleDeleteUser(u._id, u.name)} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95">
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
            {activeTab === 'listings' && (
              <>
                {/* Desktop Table View (Glassmorphism) */}
                <div className="hidden md:block bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-black/30 text-white/70 text-[10px] uppercase tracking-widest border-b border-white/20">
                      <tr>
                        <th className="px-6 py-4 font-black">Type</th>
                        <th className="px-6 py-4 font-black">Title</th>
                        <th className="px-6 py-4 font-black">Owner</th>
                        <th className="px-6 py-4 font-black">Status</th>
                        <th className="px-6 py-4 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {listings.map(l => (
                        <tr key={l._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            {l.isEmergency ? (
                               <span className="text-[9px] font-black uppercase px-2 py-1 rounded border bg-red-900/40 text-red-400 border-red-500/30">SOS</span>
                            ) : (
                               <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${l.listingType === 'request' ? 'bg-blue-900/40 text-blue-300 border-blue-500/30' : 'bg-teal-900/40 text-teal-300 border-teal-500/30'}`}>{l.listingType}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">{l.title}</td>
                          <td className="px-6 py-4 text-white/80">{l.donorId?.name || 'Deleted User'}</td>
                          <td className="px-6 py-4">
                             <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${l.status === 'fulfilled' ? 'bg-green-900/40 text-green-400 border-green-500/30' : 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30'}`}>{l.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteListing(l._id)} className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all" title="Force Delete">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View (Glassmorphism) */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {listings.map(l => (
                    <div key={l._id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 space-y-3 shadow-lg">
                       <div className="flex justify-between items-center">
                          {l.isEmergency ? (
                             <span className="text-[9px] font-black uppercase px-2 py-1 rounded border bg-red-900/40 text-red-400 border-red-500/30">SOS</span>
                          ) : (
                             <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${l.listingType === 'request' ? 'bg-blue-900/40 text-blue-300 border-blue-500/30' : 'bg-teal-900/40 text-teal-300 border-teal-500/30'}`}>{l.listingType}</span>
                          )}
                         <span className={`text-[9px] font-black uppercase ${l.status === 'fulfilled' ? 'text-green-400' : 'text-yellow-400'}`}>{l.status}</span>
                       </div>
                       <h4 className="text-white font-bold leading-snug drop-shadow-sm">{l.title}</h4>
                       <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <div>
                            <p className="text-[8px] text-white/50 uppercase font-black">Owner</p>
                            <p className="text-white/90 text-xs font-bold">{l.donorId?.name || 'Deleted User'}</p>
                          </div>
                          <button onClick={() => handleDeleteListing(l._id)} className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-xl active:bg-red-600 active:text-white transition-all active:scale-95">
                            <FaTrash size={14} />
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;