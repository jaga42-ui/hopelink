import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';

const AuthLayout = ({ children, title, subtitle, icon: Icon = FaShieldAlt }) => {
  return (
    // 👉 SOLID DARK THEME: Replaced gradient with bg-slate-950
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden selection:bg-teal-500 selection:text-white">
      
      {/* Animated Ambient Background Glows (Deep Teal/Blue for high contrast) */}
      <motion.div 
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] sm:w-[50%] sm:h-[50%] bg-teal-900/20 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"
      />
      <motion.div 
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] sm:w-[50%] sm:h-[50%] bg-blue-900/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"
      />

      {/* Solid Dark Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 my-8"
      >
        <div className="text-center mb-6 sm:mb-8">
          {/* Deep Inset Icon Container */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-teal-500 mx-auto mb-4 sm:mb-6 shadow-inner">
            <Icon />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 uppercase leading-tight">
            {/* Split title: Last word uses vibrant teal */}
            {title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-teal-500">{title.split(' ').slice(-1)}</span>
          </h1>
          
          {subtitle && (
            <p className="text-slate-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase mt-2 sm:mt-3">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* The injected form (Login/ResetPassword) goes here */}
        {children}
        
      </motion.div>
    </div>
  );
};

export default AuthLayout;