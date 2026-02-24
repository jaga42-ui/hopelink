import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSpinner, FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

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
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // 👉 DYNAMIC GOOGLE OAUTH LINK
  const handleGoogleLogin = () => {
    if (!window.google) {
      return toast.error("Google secure login is still loading. Please try again in a second.");
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, 
      scope: 'email profile',
      ux_mode: 'popup',
      callback: async (response) => {
        if (response.code) {
          const toastId = toast.loading("Verifying Identity...");
          try {
            // 👉 THIS SENDS THE 'POST' REQUEST YOUR BACKEND IS WAITING FOR
            const { data } = await api.post('/auth/google', { code: response.code });
            
            login(data);
            toast.success(`Welcome back, ${data.name}!`, { id: toastId });
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
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient p-4 selection:bg-white selection:text-teal-700">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-[50px] pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2 drop-shadow-md">
            HOPE<span className="text-teal-400">LINK.</span>
          </h1>
          <p className="text-white/80 font-medium mt-2">Welcome back to the community.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="text-white text-sm font-extrabold mb-2 flex items-center gap-2 drop-shadow-sm">
              <FaEnvelope className="text-teal-300" /> Email Address
            </label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all shadow-inner"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white text-sm font-extrabold flex items-center gap-2 drop-shadow-sm">
                <FaLock className="text-teal-300" /> Password
              </label>
              <Link to="/forgotpassword" className="text-xs text-teal-300 hover:text-white font-bold transition-colors">
                Forgot Password?
              </Link>
            </div>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button disabled={loading} className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <FaSpinner className="animate-spin text-xl" /> : 'Log In to Network'}
          </button>
        </form>

        {/* 👉 RESTORED GOOGLE BUTTON */}
        <div className="relative z-10 mt-6">
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-white/40 text-[10px] font-black uppercase tracking-widest">Or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>
          
          <button onClick={handleGoogleLogin} type="button" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
            <FaGoogle className="text-red-400 text-lg" /> Continue with Google
          </button>
        </div>

        <div className="mt-8 text-center relative z-10">
          <p className="text-white/80 font-medium">
            New to HopeLink?{' '}
            <Link to="/register" className="text-teal-300 hover:text-white font-black ml-1 transition-colors hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;