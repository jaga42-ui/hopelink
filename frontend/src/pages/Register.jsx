import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaSpinner, FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

import AuthLayout from '../components/AuthLayout';

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
    if (!lat || !lng) return toast.error("Please tap 'Lock GPS Coordinates' first.");
    
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      login(data);
      toast.success(`Welcome to the frontlines, ${data.name}.`, {
        style: { background: '#111', color: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.3)' }
      });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = () => {
    if (!window.google) return toast.error("Secure gateway is still loading. Please wait a moment.");

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, 
      scope: 'email profile',
      ux_mode: 'popup',
      callback: async (response) => {
        if (response.code) {
          const toastId = toast.loading("Creating Secure Profile...");
          try {
            const { data } = await api.post('/auth/google', { code: response.code });
            login(data);
            toast.success(`Identity verified. Welcome, ${data.name}.`, { id: toastId });
            navigate('/dashboard');
          } catch (error) {
            toast.error(error.response?.data?.message || "Google Registration Failed", { id: toastId });
          }
        }
      },
    });
    
    client.requestCode();
  };

  return (
    <AuthLayout title="JOIN THE NETWORK." subtitle="Establish your identity">
      <form onSubmit={onSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <input type="text" name="name" placeholder="Full Name" onChange={onChange} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 text-white text-base sm:text-sm outline-none focus:border-teal-500 focus:bg-black transition-all" />
          </div>

          <div className="relative">
            <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <input type="tel" name="phone" placeholder="Phone Number" onChange={onChange} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 text-white text-base sm:text-sm outline-none focus:border-teal-500 focus:bg-black transition-all" />
          </div>
        </div>

        <div className="relative">
          <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
          <input type="email" name="email" placeholder="Secured Email" onChange={onChange} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 text-white text-base sm:text-sm outline-none focus:border-teal-500 focus:bg-black transition-all" />
        </div>

        <div className="relative">
          <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
          <input type="password" name="password" placeholder="Passcode" onChange={onChange} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 text-white text-base sm:text-sm outline-none focus:border-teal-500 focus:bg-black transition-all" />
        </div>

        <div className="pt-2">
          <p className="text-white/40 text-[9px] sm:text-[10px] uppercase font-black tracking-widest ml-2 mb-2">Initial Directive (Changeable)</p>
          <div className="flex gap-2 sm:gap-3 bg-[#111] p-1.5 sm:p-2 rounded-2xl border border-white/10">
            <button type="button" onClick={() => setFormData({...formData, activeRole: 'donor'})} className={`flex-1 py-3 sm:py-3.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${activeRole === 'donor' ? 'bg-teal-500 text-white shadow-md' : 'text-white/40 hover:text-white'}`}>I Want To Donate</button>
            <button type="button" onClick={() => setFormData({...formData, activeRole: 'receiver'})} className={`flex-1 py-3 sm:py-3.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${activeRole === 'receiver' ? 'bg-blue-600 text-white shadow-md' : 'text-white/40 hover:text-white'}`}>I Need An Item</button>
          </div>
        </div>

        <button type="button" onClick={getLocation} disabled={locating} className={`w-full py-3.5 sm:py-4 mt-2 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${lat ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/50 border-white/10 active:bg-white/10'}`}>
          {locating ? <FaSpinner className="animate-spin text-lg" /> : <FaMapMarkerAlt className="text-sm" />}
          {lat ? 'Location Pinned' : 'Lock GPS Coordinates *'}
        </button>

        <button type="submit" disabled={submitting || !lat} className="w-full bg-teal-500 hover:bg-teal-400 text-[#050505] py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(20,184,166,0.2)] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2">
          {submitting ? <FaSpinner className="animate-spin text-xl text-black" /> : 'Enlist Now'}
        </button>
      </form>

      <div className="relative mt-6 sm:mt-8 mb-6">
        <div className="flex items-center">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-4 text-white/30 text-[9px] font-black uppercase tracking-widest">Or Enlist Via</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>
      </div>
      
      <button onClick={handleGoogleRegister} type="button" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest py-3.5 sm:py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95">
        <FaGoogle className="text-red-500 text-lg" /> Google Authorization
      </button>

      <div className="mt-8 text-center bg-white/5 py-4 rounded-2xl border border-white/5">
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
          Already Active? 
          <Link to="/login" className="block mt-2 text-teal-400 hover:text-white font-black transition-colors">Access Network</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;