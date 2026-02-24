import { motion } from 'framer-motion';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-brand-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Blobs */}
      <motion.div 
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }} 
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20"
      />
      <motion.div 
        animate={{ x: [0, -100, 0], y: [0, 50, 0] }} 
        transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
        className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20"
      />

      {/* Glass Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black/30 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">{title}</h1>
          <p className="text-gray-200 font-medium drop-shadow-sm">{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

export default AuthLayout;