import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSpinner, FaGoogle, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

import AuthLayout from '../components/AuthLayout'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      toast.success(`Authentication successful. Welcome back, ${data.name}.`, {
        // 👉 Match solid dark theme for toasts
        style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' }
      });
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Access Denied. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!window.google) {
      return toast.error("Secure gateway is still loading. Please wait a moment.");
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, 
      scope: 'email profile',
      ux_mode: 'popup',
      callback: async (response) => {
        if (response.code) {
          const toastId = toast.loading("Verifying Identity...");
          try {
            const { data } = await api.post('/auth/google', { code: response.code });
            login(data);
            toast.success(`Identity verified. Welcome, ${data.name}.`, { 
              id: toastId,
              style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' }
            });
            navigate('/dashboard');
          } catch (error) {
            toast.error(error.response?.data?.message || "Google Login Failed", { id: toastId });
          }
        }
      },
    });
    
    client.requestCode();
  };

  return (
    <AuthLayout 
      title="RESUME THE MISSION." 
      subtitle="The network is waiting for you."
      icon={FaShieldAlt}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
            <FaEnvelope className="text-teal-500" /> Secured Email
          </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-base md:text-sm placeholder-slate-600 focus:border-teal-500 focus:bg-slate-900 outline-none transition-all shadow-inner"
            placeholder="operator@hopelink.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 ml-1 mr-1">
            <label className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <FaLock className="text-teal-500" /> Passcode
            </label>
            <Link to="/forgotpassword" className="text-[10px] text-teal-500 hover:text-teal-400 font-black uppercase tracking-widest transition-colors">
              Override?
            </Link>
          </div>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-base md:text-sm placeholder-slate-600 focus:border-teal-500 focus:bg-slate-900 outline-none transition-all shadow-inner"
            placeholder="••••••••"
          />
        </div>

        <button 
          disabled={loading || !email || !password} 
          className="w-full mt-2 bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest text-xs py-4 md:py-5 rounded-2xl transition-all shadow-lg shadow-teal-900/50 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? <FaSpinner className="animate-spin text-xl text-white" /> : 'Access Live Network'}
        </button>
      </form>

      <div className="relative mt-8 mb-6">
        <div className="flex items-center">
          <div className="flex-1 border-t border-slate-800"></div>
          <span className="px-4 text-slate-500 text-[9px] font-black uppercase tracking-widest">Or Authenticate Via</span>
          <div className="flex-1 border-t border-slate-800"></div>
        </div>
      </div>
      
      <button 
        onClick={handleGoogleLogin} 
        type="button" 
        className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-inner"
      >
        <FaGoogle className="text-red-500 text-lg" /> Google Override
      </button>

      <div className="mt-8 text-center bg-slate-900 py-4 rounded-2xl border border-slate-800 shadow-inner">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          Haven't Enlisted Yet?
          <Link to="/register" className="block mt-2 text-teal-500 hover:text-white font-black transition-colors">
            Join the Frontlines
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;