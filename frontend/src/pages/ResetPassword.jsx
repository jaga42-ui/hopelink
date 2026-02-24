import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaLock } from 'react-icons/fa';

// 👉 IMPORT YOUR API MANAGER
import api from '../utils/api';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { resettoken } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    const toastId = toast.loading('Resetting password...');
    try {
      // 👉 CLEAN REQUEST: Using your API manager to hit the live server!
      await api.put(`/auth/resetpassword/${resettoken}`, { password });
      
      toast.success('Password reset successfully! Please login.', { id: toastId });
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired token', { id: toastId });
    }
  };

  return (
    // Responsive outer container with the custom gradient
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient p-4 selection:bg-white selection:text-teal-700">
      
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Soft lighting overlay */}
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-[50px] pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <Link to="/" className="text-3xl font-extrabold text-white mb-2 inline-block drop-shadow-md">
            New <span className="text-emerald-100">Password</span>
          </Link>
          <p className="text-white/80 font-medium mt-2">Please enter your new strong password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="text-white text-sm font-extrabold mb-2 flex items-center gap-2 drop-shadow-sm">
              <FaLock className="text-emerald-100" /> New Password
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 outline-none transition-all shadow-inner"
              placeholder="••••••••"
            />
            <p className="text-xs text-white/70 mt-2 font-medium">Must be 8+ characters, with uppercase, lowercase, number, and special character.</p>
          </div>

          <div>
            <label className="text-white text-sm font-extrabold mb-2 flex items-center gap-2 drop-shadow-sm">
              <FaLock className="text-emerald-100" /> Confirm Password
            </label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required
              className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 outline-none transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full bg-white text-teal-700 font-extrabold py-3 rounded-xl hover:bg-gray-100 transition-all shadow-xl active:scale-95">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;