import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaTrophy, FaMedal, FaStar, FaSpinner, FaCrown } from 'react-icons/fa';

import api from '../utils/api';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
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
      <div className="max-w-4xl mx-auto px-4 pb-32 md:pb-24">
        
        <header className="text-center pt-6 mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-2 md:mb-4">
            COMMUNITY <span className={user?.activeRole === 'donor' ? 'text-teal-400' : 'text-blue-400'}>LEADERS.</span>
          </h1>
          <p className="text-white/40 uppercase font-black tracking-widest text-[10px] md:text-xs">Top contributors making an impact</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-teal-400" /></div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {leaders.map((leader, index) => {
              const isTop3 = index < 3;
              const isMe = leader._id === user._id;

              return (
                <div 
                  key={leader._id} 
                  className={`relative flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-[2rem] border transition-all ${
                    isMe 
                      ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/10' 
                      : isTop3 
                        ? 'bg-[#1a1a1a] border-white/20' 
                        : 'bg-[#111] border-white/5'
                  } ${isTop3 ? 'md:scale-105 z-10 shadow-xl' : 'scale-100'}`}
                >
                  
                  <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
                    <div className="text-xl md:text-2xl font-black italic text-white/20 w-6 md:w-8 text-center shrink-0">
                      {index === 0 ? <FaCrown className="text-yellow-400 mx-auto" /> : index + 1}
                    </div>
                    
                    <div className="relative shrink-0">
                      {leader.profilePic ? (
                        <img src={leader.profilePic} alt={leader.name} className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover border-2 border-white/10" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center font-black text-white/50 text-xl md:text-2xl uppercase">
                          {leader.name.charAt(0)}
                        </div>
                      )}
                      {index === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-black p-1 md:p-1.5 rounded-full text-[10px] md:text-xs shadow-lg shadow-yellow-400/20"><FaStar /></div>}
                    </div>

                    <div className="min-w-0 pr-2">
                      <h3 className="text-base md:text-xl font-black text-white flex items-center gap-2 truncate">
                        <span className="truncate">{leader.name}</span>
                        {isMe && <span className="text-[9px] md:text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">You</span>}
                      </h3>
                      <p className="text-teal-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate">{leader.rank || 'Member'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl md:text-3xl font-black text-white">{leader.points}</p>
                    <p className="text-[8px] md:text-[10px] text-white/40 font-black uppercase tracking-widest">XP</p>
                  </div>
                </div>
              );
            })}
            
            {leaders.length === 0 && (
              <div className="text-center py-10 text-white/40 font-bold uppercase tracking-widest text-xs md:text-sm">
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