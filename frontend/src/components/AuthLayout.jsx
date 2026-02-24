import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';

const AuthLayout = ({ children, title, subtitle, icon: Icon = FaShieldAlt }) => {
  return (
    // 👉 APPLIED BRAND GRADIENT TO MAIN WRAPPER
    <div className="min-h-screen bg-brand-gradient flex items-center justify-center p-4 relative overflow-hidden selection:bg-white selection:text-teal-900">
      
      {/* Animated Ambient Background Glows (Switched to soft white to enhance the gradient) */}
      <motion.div 
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] sm:w-[50%] sm:h-[50%] bg-white/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"
      />
      <motion.div 
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] sm:w-[50%] sm:h-[50%] bg-white/5 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"
      />

      {/* Glassmorphism Stealth Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 my-8"
      >
        <div className="text-center mb-6 sm:mb-8">
          {/* Glass Icon Container */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mx-auto mb-4 sm:mb-6 shadow-inner">
            <Icon />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter mb-2 uppercase leading-tight drop-shadow-md">
            {/* Split title: Last word uses a softer teal/emerald to pop against the gradient */}
            {title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-teal-100">{title.split(' ').slice(-1)}</span>
          </h1>
          
          {subtitle && (
            <p className="text-white/70 font-bold text-[10px] sm:text-xs tracking-widest uppercase mt-2 sm:mt-3 drop-shadow-sm">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* The injected form (Login/Register/Forgot) goes here */}
        {children}
        
      </motion.div>
    </div>
  );
};

export default AuthLayout;