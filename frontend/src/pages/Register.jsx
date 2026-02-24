import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaSpinner, FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', activeRole: 'donor', lat: null, lng: null
  });
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { name, email, password, phone, activeRole, lat, lng } = formData;
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData({ ...formData, lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
          toast.success("GPS Location Pinned!");
        },
        () => {
          setLocating(false);
          toast.error("Please allow location access to continue.");
        }
      );
    } else {
      setLocating(false);
      toast.error("Geolocation not supported by this device.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!lat || !lng) return toast.error("Please tap 'Pin My Location' first.");
    
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      login(data);
      toast.success(`Welcome to HopeLink!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = () => {
    if (!window.google) {
      return toast.error("Google secure login is still loading. Please try again in a second.");
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, 
      scope: 'email profile',
      ux_mode: 'popup',
      callback: async (response) => {
        if (response.code) {
          const toastId = toast.loading("Creating Account...");
          try {
            // 👉 THIS SENDS THE 'POST' REQUEST YOUR BACKEND IS WAITING FOR
            const { data } = await api.post('/auth/google', { code: response.code });
            
            login(data);
            toast.success(`Welcome to HopeLink, ${data.name}!`, { id: toastId });
            navigate('/dashboard');
          } catch (error) {
            toast.error(error.response?.data?.message || "Registration Failed", { id: toastId });
          }
        }
      },
    });
    
    client.requestCode();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-brand-gradient">
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white italic tracking-tighter">HOPE<span className="text-teal-400">LINK.</span></h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">Join the Network</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" name="name" placeholder="Full Name" onChange={onChange} required className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:border-teal-500/50" />
          </div>

          <div className="relative">
            <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="tel" name="phone" placeholder="Phone Number" onChange={onChange} required className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:border-teal-500/50" />
          </div>

          <div className="relative">
            <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="email" name="email" placeholder="Email Address" onChange={onChange} required className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:border-teal-500/50" />
          </div>

          <div className="relative">
            <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="password" name="password" placeholder="Secure Password" onChange={onChange} required className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:border-teal-500/50" />
          </div>

          <div className="pt-2">
            <p className="text-white/50 text-[10px] uppercase font-black tracking-widest ml-2 mb-2">Initial Role (You can switch later)</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setFormData({...formData, activeRole: 'donor'})} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeRole === 'donor' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-white/5 text-white/40'}`}>Donate</button>
              <button type="button" onClick={() => setFormData({...formData, activeRole: 'receiver'})} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeRole === 'receiver' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-white/40'}`}>Receive</button>
            </div>
          </div>

          <button type="button" onClick={getLocation} disabled={locating} className={`w-full py-4 mt-2 rounded-2xl font-black flex items-center justify-center gap-2 transition-all border ${lat ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}>
            {locating ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
            {lat ? 'GPS SECURED' : 'PIN MY LOCATION (REQUIRED)'}
          </button>

          <button type="submit" disabled={submitting || locating} className="w-full bg-white text-teal-900 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4">
            {submitting ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* 👉 RESTORED GOOGLE BUTTON */}
        <div className="mt-6">
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-white/40 text-[10px] font-black uppercase tracking-widest">Or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>
          
          <button onClick={handleGoogleRegister} type="button" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3">
            <FaGoogle className="text-red-400 text-xl" /> Sign Up with Google
          </button>
        </div>

        <p className="mt-6 text-center text-white/40 text-sm">
          Already a member? <Link to="/login" className="text-teal-400 font-bold ml-1">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;