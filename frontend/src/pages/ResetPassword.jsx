import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaKey, FaSpinner, FaShieldAlt } from 'react-icons/fa';

import api from '../utils/api';

const ResetPassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Security mismatch: Passwords do not align.", {
        style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
      });
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters.", {
        style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
      });
    }

    setLoading(true);
    const toastId = toast.loading('Encrypting new credentials...', {
      style: { background: '#ffffff', color: '#29524a' }
    });

    try {
      await api.post(`/auth/resetpassword/${id}/${token}`, { password });
      toast.success('Override successful. New credentials locked in.', { 
        id: toastId,
        icon: '🔒',
        style: { background: '#ffffff', color: '#29524a', border: '1px solid #846b8a' }
      });
      navigate('/login');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Invalid or expired recovery link.', 
        { 
          id: toastId,
          style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex items-center justify-center p-4 relative selection:bg-dark-raspberry selection:text-white overflow-hidden font-sans">
      {/* VIBRANT BACKGROUND GLOWS */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] max-w-[600px] h-[50vh] bg-dark-raspberry/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] max-w-[600px] h-[50vh] bg-pine-teal/10 blur-[100px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white/70 backdrop-blur-lg border border-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_40px_rgba(41,82,74,0.08)] relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white border border-dusty-lavender/30 rounded-2xl flex items-center justify-center text-3xl text-pine-teal mx-auto mb-4 shadow-sm">
            <FaShieldAlt />
          </div>
          <h2 className="text-3xl font-black text-pine-teal tracking-tight uppercase">
            NEW <span className="text-dark-raspberry">CREDENTIALS.</span>
          </h2>
          <p className="text-dusty-lavender text-xs font-bold uppercase tracking-widest mt-1">
            Establish a new encryption key.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="text-dusty-lavender text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
              <FaKey className="text-dark-raspberry" /> New Passcode
            </label>
            <input 
              id="newPassword"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="w-full bg-white border border-dusty-lavender/40 rounded-2xl px-5 py-4 text-pine-teal text-base md:text-sm placeholder-dusty-lavender/70 focus:border-dark-raspberry focus:ring-4 focus:ring-dark-raspberry/10 outline-none transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-dusty-lavender text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
              <FaKey className="text-dark-raspberry" /> Verify Passcode
            </label>
            <input 
              id="confirmPassword"
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required
              className="w-full bg-white border border-dusty-lavender/40 rounded-2xl px-5 py-4 text-pine-teal text-base md:text-sm placeholder-dusty-lavender/70 focus:border-dark-raspberry focus:ring-4 focus:ring-dark-raspberry/10 outline-none transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-dark-raspberry hover:bg-[#850e53] text-white font-black tracking-widest uppercase text-xs sm:text-sm py-4 rounded-2xl transition-all shadow-[0_10px_25px_rgba(159,17,100,0.3)] active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin text-xl" /> : 'Confirm Override'}
          </button>
        </form>

        <div className="mt-8 text-center bg-white/50 py-4 rounded-2xl border border-white shadow-sm">
          <Link to="/login" className="text-dusty-lavender hover:text-dark-raspberry text-[10px] font-bold uppercase tracking-widest transition-colors">
            Abort & Return to Login
          </Link>
        </div>
      </motion.div>
    </main>
  );
};

export default ResetPassword;