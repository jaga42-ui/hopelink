import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaLock, FaSpinner, FaShieldAlt } from 'react-icons/fa';

import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { id, token } = useParams(); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passcodes do not match.");
    }

    setLoading(true);
    const toastId = toast.loading('Re-encrypting passcode...');
    
    try {
      await api.post(`/auth/resetpassword/${id}/${token}`, { password });
      toast.success('Passcode updated securely. You may now access the network.', { 
        id: toastId,
        style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' } // matches slate-900 and slate-800
      });
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired override link', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="SECURE ENCRYPTION." 
      subtitle="Establish a new network passcode"
      icon={FaShieldAlt}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
            <FaLock className="text-teal-500" /> New Passcode
          </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-base md:text-sm placeholder-slate-600 focus:border-teal-500 focus:bg-slate-900 outline-none transition-all shadow-inner"
            placeholder="••••••••"
          />
          <p className="text-[9px] text-slate-500 mt-2 ml-1 font-bold uppercase tracking-widest">
            Min 8 chars, uppercase, number, & special char.
          </p>
        </div>

        <div>
          <label className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
            <FaLock className="text-teal-500" /> Confirm Passcode
          </label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-base md:text-sm placeholder-slate-600 focus:border-teal-500 focus:bg-slate-900 outline-none transition-all shadow-inner"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full mt-4 bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all shadow-lg shadow-teal-900/50 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? <FaSpinner className="animate-spin text-xl text-white" /> : 'Confirm & Encrypt'}
        </button>
      </form>

      <div className="mt-8 text-center bg-slate-900 py-4 rounded-2xl border border-slate-800 shadow-inner">
        <Link to="/login" className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
          Abort & Return to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;