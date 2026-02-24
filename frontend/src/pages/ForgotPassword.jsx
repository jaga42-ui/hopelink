import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEnvelope, FaSpinner, FaLock } from 'react-icons/fa';

import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Transmitting override link...');

    try {
      await api.post('/auth/forgotpassword', { email });
      toast.success('Transmission sent. Check your secure inbox.', { id: toastId });
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transmission failed.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="SYSTEM OVERRIDE." 
      subtitle="Request a secure link to regain access."
      icon={FaLock}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-white/50 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
            <FaEnvelope className="text-teal-400/70" /> Account Email
          </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-4 text-white text-base md:text-sm placeholder-white/20 focus:border-teal-500 focus:bg-black outline-none transition-all"
            placeholder="operator@hopelink.com"
          />
        </div>

        <button 
          type="submit"
          disabled={loading || !email}
          className="w-full bg-teal-500 hover:bg-teal-400 text-[#050505] font-black tracking-widest uppercase text-xs sm:text-sm py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(20,184,166,0.2)] active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? <FaSpinner className="animate-spin text-xl" /> : 'Send Override Link'}
        </button>
      </form>

      <div className="mt-8 text-center bg-white/5 py-4 rounded-2xl border border-white/5">
        <Link to="/login" className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
          Abort & Return to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;