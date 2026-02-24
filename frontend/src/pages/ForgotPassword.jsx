import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Sending reset link...');

    try {
      await axios.post('http://localhost:5000/api/auth/forgotpassword', { email });
      toast.success('Check your email for the reset link!', { id: toastId });
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Responsive outer container with the custom gradient
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient p-4 selection:bg-white selection:text-teal-700">
      
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Soft lighting overlay */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-[50px] pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <Link to="/" className="text-3xl font-extrabold text-white mb-2 inline-block drop-shadow-md">
            Reset <span className="text-emerald-100">Password</span>
          </Link>
          <p className="text-white/80 font-medium mt-2">Enter your email to receive a secure reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="text-white text-sm font-extrabold mb-2 flex items-center gap-2 drop-shadow-sm">
              <FaEnvelope className="text-emerald-100" /> Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 outline-none transition-all shadow-inner"
              placeholder="you@example.com"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-white text-teal-700 font-extrabold py-3 rounded-xl hover:bg-gray-100 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <Link to="/login" className="text-white/90 hover:text-white font-bold flex items-center justify-center gap-2 transition-colors drop-shadow-sm hover:underline">
            <FaArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;