import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaShieldAlt, FaChartPie, FaUsers, FaBoxOpen, FaTrash, FaSpinner, FaBan, FaUserShield, FaUserTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
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
        // 👉 NO MORE HEADERS OR LOCALHOST! Clean, simple API calls.
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
        // 👉 CLEAN DELETE
        await api.delete(`/admin/users/${id}`);
        setUsersList(usersList.filter(u => u._id !== id));
        toast.success("User banished.");
      } catch (error) { 
        toast.error("Failed to delete user"); 
      }
    }
  };

  const handleToggleRole = async (id, name, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'REVOKE Admin rights from' : 'PROMOTE'} ${name}?`)) {
      try {
        // 👉 CLEAN PATCH
        const { data } = await api.patch(`/admin/users/${id}/role`);
        
        // Update UI instantly
        setUsersList(usersList.map(u => u._id === id ? { ...u, isAdmin: data.isAdmin } : u));
        toast.success(data.message);
      } catch (error) { 
        toast.error(error.response?.data?.message || "Failed to update user role"); 
      }
    }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm(`Force delete this listing from the database?`)) {
      try {
        // 👉 CLEAN DELETE
        await api.delete(`/admin/listings/${id}`);
        setListings(listings.filter(l => l._id !== id));
        toast.success("Listing obliterated.");
      } catch (error) { 
        toast.error("Failed to delete listing"); 
      }
    }
  };

  if (!user || !user.isAdmin) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-20">
        <header className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-red-500">
            <FaShieldAlt className="text-5xl drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">COMMAND <span className="text-red-500">CENTER</span></h1>
              <p className="text-red-400/50 text-[10px] uppercase font-black tracking-[0.3em]">System Administrator Access</p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex bg-[#111] p-1.5 rounded-2xl border border-white/10">
            {[
              { id: 'overview', label: 'Overview', icon: <FaChartPie /> },
              { id: 'users', label: 'Manage Users', icon: <FaUsers /> },
              { id: 'listings', label: 'Content Moderation', icon: <FaBoxOpen /> }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-white/40 hover:text-white'}`}
              >
                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-red-500" /></div>
        ) : (
          <div className="space-y-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
                  { title: "Active Donations", value: stats.totalDonations, color: "text-teal-400" },
                  { title: "Active Requests", value: stats.totalRequests, color: "text-yellow-400" },
                  { title: "Items Fulfilled", value: stats.fulfilledItems, color: "text-green-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#111] border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group">
                    <h3 className={`text-6xl font-black ${stat.color} mb-2`}>{stat.value}</h3>
                    <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">{stat.title}</p>
                  </div>
                ))}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-black/40 text-white/40 text-[10px] uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4 font-black">User</th>
                        <th className="px-6 py-4 font-black">Email</th>
                        <th className="px-6 py-4 font-black">Points</th>
                        <th className="px-6 py-4 font-black">Joined</th>
                        <th className="px-6 py-4 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersList.map(u => (
                        <tr key={u._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-white">{u.name.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-white">{u.name}</p>
                              {u.isAdmin && <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-black uppercase">Admin</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white/60">{u.email}</td>
                          <td className="px-6 py-4 font-black text-yellow-400">{u.points} XP</td>
                          <td className="px-6 py-4 text-white/40">{new Date(u.createdAt).toLocaleDateString()}</td>
                          
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {u._id !== user._id && (
                              <>
                                <button 
                                  onClick={() => handleToggleRole(u._id, u.name, u.isAdmin)} 
                                  className={`p-2 rounded-lg transition-all ${u.isAdmin ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white'}`} 
                                  title={u.isAdmin ? "Revoke Admin" : "Make Admin"}
                                >
                                  {u.isAdmin ? <FaUserTimes /> : <FaUserShield />}
                                </button>
                                
                                <button 
                                  onClick={() => handleDeleteUser(u._id, u.name)} 
                                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all" 
                                  title="Ban User completely"
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
              </div>
            )}

            {/* LISTINGS TAB */}
            {activeTab === 'listings' && (
              <div className="bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-black/40 text-white/40 text-[10px] uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4 font-black">Type</th>
                        <th className="px-6 py-4 font-black">Title</th>
                        <th className="px-6 py-4 font-black">Owner</th>
                        <th className="px-6 py-4 font-black">Status</th>
                        <th className="px-6 py-4 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {listings.map(l => (
                        <tr key={l._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${l.listingType === 'request' ? 'bg-blue-500/20 text-blue-400' : 'bg-teal-500/20 text-teal-400'}`}>
                              {l.listingType}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">{l.title}</td>
                          <td className="px-6 py-4 text-white/60">{l.donorId?.name || 'Deleted User'}</td>
                          <td className="px-6 py-4">
                             <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${l.status === 'fulfilled' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteListing(l._id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all" title="Force Delete">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;