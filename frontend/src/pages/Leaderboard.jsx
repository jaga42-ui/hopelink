import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaTrophy, FaMedal, FaStar, FaSpinner, FaCrown } from 'react-icons/fa';

// 👉 IMPORT YOUR API MANAGER
import api from '../utils/api';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        // 👉 CLEAN REQUEST: No localhost, no manual token config!
        const { data } = await api.get('/donations/leaderboard');
        
        setLeaders(data);
        setLoading(false);
      } catch (error) { 
        setLoading(false); 
      }
    };
    
    fetchLeaders();
  }, [user]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4">
            COMMUNITY <span className={user?.activeRole === 'donor' ? 'text-teal-400' : 'text-blue-400'}>LEADERS.</span>
          </h1>
          <p className="text-white/40 uppercase font-black tracking-widest text-xs">Top contributors making an impact</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-teal-400" /></div>
        ) : (
          <div className="space-y-4">
            {leaders.map((leader, index) => {
              const isTop3 = index < 3;
              const isMe = leader._id === user._id;

              return (
                <div key={leader._id} className={`relative flex items-center justify-between p-6 rounded-[2rem] border transition-all ${
                  isMe ? 'bg-teal-500/10 border-teal-500/50' : 'bg-[#111] border-white/10'
                } ${isTop3 ? 'scale-105 z-10 shadow-2xl' : 'scale-100'}`}>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-2xl font-black italic text-white/20 w-8 text-center">
                      {index === 0 ? <FaCrown className="text-yellow-400 mx-auto" /> : index + 1}
                    </div>
                    
                    <div className="relative">
                      {leader.profilePic ? (
                        <img src={leader.profilePic} alt={leader.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white/50 text-2xl uppercase">
                          {leader.name.charAt(0)}
                        </div>
                      )}
                      {index === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-black p-1.5 rounded-full text-xs shadow-lg shadow-yellow-400/20"><FaStar /></div>}
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white flex items-center gap-2">
                        {leader.name} {isMe && <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">You</span>}
                      </h3>
                      <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest">{leader.rank || 'Member'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black text-white">{leader.points}</p>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Experience Points</p>
                  </div>
                </div>
              );
            })}
            
            {leaders.length === 0 && (
              <div className="text-center py-10 text-white/40 font-bold uppercase tracking-widest text-sm">
                No leaders yet. Be the first to make an impact!
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;