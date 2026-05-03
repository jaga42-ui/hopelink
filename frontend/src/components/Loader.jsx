import { FaCircleNotch } from "react-icons/fa";
import { motion } from "framer-motion";

const Loader = ({ fullScreen = false, text = "SYNCING NETWORK..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-8 font-sans">
      {/* Brand Logo (Only shows on full app startup) */}
      {fullScreen && (
        <motion.h2 
          initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl font-black italic tracking-tight text-pine-teal uppercase"
        >
          SAHA<span className="text-blazing-flame drop-shadow-[0_0_15px_rgba(255,74,28,0.5)]">YAM.</span>
        </motion.h2>
      )}

      {/* INCREDIBLE SHIFT ANIMATION: Glowing Pulse & Expanding Rings */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Expanding Echo Rings */}
        <motion.div 
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border border-blazing-flame shadow-[0_0_20px_rgba(255,74,28,0.6)]"
        />
        <motion.div 
          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
          className="absolute inset-0 rounded-full border border-dark-raspberry shadow-[0_0_15px_rgba(159,17,100,0.5)]"
        />
        
        {/* Core Pulsating Orb */}
        <motion.div 
          animate={{ scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 bg-gradient-to-tr from-blazing-flame to-dark-raspberry rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,74,28,0.8)] z-10"
        >
          <FaCircleNotch className="text-white text-xl animate-[spin_2s_linear_infinite]" />
        </motion.div>
      </div>

      {/* Data Transmission Text */}
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-1"
      >
        <p className="text-pine-teal font-black uppercase tracking-[0.4em] text-[11px]">
          {text}
        </p>
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-blazing-flame to-transparent rounded-full mt-2 opacity-50" />
      </motion.div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-pearl-beige z-[9999] flex items-center justify-center overflow-hidden">
        {/* Subtle Background Glow to make it look premium */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] max-w-[600px] h-[50%] bg-blazing-flame/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] max-w-[600px] h-[50%] bg-pine-teal/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">{content}</div>
      </div>
    );
  }

  // Fallback for smaller localized loading states (like inside a card)
  return <div className="py-12 flex justify-center w-full">{content}</div>;
};

export default Loader;