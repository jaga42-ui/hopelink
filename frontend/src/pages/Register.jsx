import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaEnvelope, FaLock, FaPhone, FaTint, FaShieldAlt, FaTimes, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', bloodGroup: '' });
  const [activeRole, setActiveRole] = useState('donor');
  const [isLoading, setIsLoading] = useState(false);
  
  // Privacy Policy States
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToPolicy) {
      return toast.error("You must agree to the Privacy Policy to join HopeLink.");
    }

    setIsLoading(true);
    try {
      // 👉 THE FIX: Clean the payload. If bloodGroup is empty, remove it so the backend doesn't crash validating ""
      const payload = { ...formData, activeRole };
      if (!payload.bloodGroup) {
        delete payload.bloodGroup;
      }

      const { data } = await api.post('/auth/register', payload);
      login(data);
      toast.success('Welcome to the HopeLink Community!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPolicy = () => {
    setAgreedToPolicy(true);
    setShowPolicyModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative selection:bg-teal-500 selection:text-white overflow-hidden">
      
      {/* Background Glows (Subtle, non-distracting) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-3xl text-teal-500 mx-auto mb-4 shadow-inner">
            <FaUserPlus />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">Join HopeLink.</h2>
          <p className="text-slate-400 text-sm font-medium">Create your free account today.</p>
        </div>

        {/* Role Selector */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl mb-6 border border-slate-800 shadow-inner">
          <button type="button" onClick={() => setActiveRole('donor')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeRole === 'donor' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>Donor</button>
          <button type="button" onClick={() => setActiveRole('receiver')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeRole === 'receiver' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>Receiver</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaUserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input required type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white text-base md:text-sm outline-none transition-colors shadow-inner placeholder-slate-600 ${activeRole === 'donor' ? 'focus:border-teal-500' : 'focus:border-blue-500'}`} />
          </div>

          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input required type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white text-base md:text-sm outline-none transition-colors shadow-inner placeholder-slate-600 ${activeRole === 'donor' ? 'focus:border-teal-500' : 'focus:border-blue-500'}`} />
          </div>

          <div className="relative">
            <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white text-base md:text-sm outline-none transition-colors shadow-inner placeholder-slate-600 ${activeRole === 'donor' ? 'focus:border-teal-500' : 'focus:border-blue-500'}`} />
          </div>

          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input required type="password" placeholder="Secure Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white text-base md:text-sm outline-none transition-colors shadow-inner placeholder-slate-600 ${activeRole === 'donor' ? 'focus:border-teal-500' : 'focus:border-blue-500'}`} />
          </div>

          {activeRole === 'donor' && (
            <div className="relative">
              <FaTint className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
              <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white text-base md:text-sm outline-none focus:border-teal-500 transition-colors appearance-none shadow-inner cursor-pointer">
                <option value="" disabled className="text-slate-500">Blood Group (Optional)</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          )}

          {/* The Checkbox & Privacy Trigger */}
          <div className="flex items-start gap-3 mt-6 mb-2">
            <button 
              type="button" 
              onClick={() => setAgreedToPolicy(!agreedToPolicy)}
              className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${agreedToPolicy ? (activeRole === 'donor' ? 'bg-teal-500 border-teal-500' : 'bg-blue-500 border-blue-500') : 'bg-slate-800 border-slate-600'}`}
            >
              {agreedToPolicy && <FaCheck className="text-white text-[10px]" />}
            </button>
            <p className="text-xs text-slate-400 leading-relaxed">
              I agree to the <button type="button" onClick={() => setShowPolicyModal(true)} className="text-white font-bold underline decoration-slate-600 underline-offset-4 hover:decoration-white transition-all">Privacy Policy</button> and consent to my data being used to connect me with the community.
            </p>
          </div>

          {/* The Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading || !agreedToPolicy} 
            className={`w-full py-4 rounded-xl font-extrabold uppercase tracking-wider text-sm text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed mt-2 ${activeRole === 'donor' ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50'}`}
          >
            {isLoading ? <FaSpinner className="animate-spin mx-auto text-xl" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-8 font-medium">
          Already a hero? <Link to="/login" className="text-white font-bold hover:underline">Sign In</Link>
        </p>
      </motion.div>

      {/* The Privacy Policy Popup Modal */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/80" 
              onClick={() => setShowPolicyModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-teal-400 border border-slate-700">
                    <FaShieldAlt className="text-lg" />
                  </div>
                  <h3 className="text-xl font-bold">Privacy Policy</h3>
                </div>
                <button onClick={() => setShowPolicyModal(false)} className="text-slate-500 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 rounded-full"><FaTimes /></button>
              </div>
              
              <div className="overflow-y-auto pr-2 no-scrollbar space-y-4 text-sm text-slate-300 leading-relaxed mb-6 flex-1">
                <p>Welcome to HopeLink. By joining our platform, you agree to how we handle your data to keep the community safe.</p>
                <div>
                  <h4 className="font-bold text-white mb-1">1. Information Collection</h4>
                  <p>We collect your name, email, phone number, and optional medical data (blood group) to facilitate community assistance.</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">2. Location Data</h4>
                  <p>When you post an SOS or a donation, we use your location to alert nearby users. Your exact pinpoint is generalized to protect your privacy.</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">3. Data Sharing</h4>
                  <p>We absolutely do not sell your data. Your profile details are only shared with other verified users when you actively interact with them (e.g., accepting a donation request).</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">4. Secure Communications</h4>
                  <p>In-app chats are strictly between you and the other party. We use Firebase to send encrypted lock-screen push notifications to your device.</p>
                </div>
              </div>

              <button 
                onClick={handleAcceptPolicy} 
                className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors shadow-lg"
              >
                I Accept & Agree
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Register;