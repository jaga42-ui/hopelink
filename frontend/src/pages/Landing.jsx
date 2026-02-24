import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHeartbeat, FaMapMarkerAlt, FaShieldAlt, FaHandsHelping, 
  FaTint, FaUtensils, FaUserInjured, FaArrowDown, FaBolt
} from 'react-icons/fa';

import logo from '../assets/logo.png'; 

const Landing = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const floatAnimation = (delay) => ({
    y: [0, -12, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay }
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden relative selection:bg-teal-500 selection:text-white">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* NAVBAR: Fixed Logo Merging Issue */}
      <nav className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          {/* Logo size reduced to fit standard navbars perfectly */}
          <img 
            src={logo} 
            alt="HopeLink Logo" 
            className="h-10 sm:h-12 w-auto object-contain group-hover:rotate-12 transition-transform duration-300" 
          />
          <span className="text-2xl sm:text-3xl font-black italic tracking-tighter drop-shadow-md">
            HOPE<span className="text-teal-400">LINK.</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/login" className="hidden sm:block px-5 py-2 font-bold text-xs sm:text-sm text-white/70 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white hover:bg-gray-200 text-black rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-xl shadow-white/10">
            Join the Fight
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-20 md:pt-32 text-center flex flex-col items-center min-h-[75vh]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Floating Context Tags (Hidden on mobile to save space) */}
        <motion.div animate={floatAnimation(0)} className="hidden lg:flex absolute top-32 left-10 items-center gap-3 bg-red-900/30 border border-red-500/20 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl">
          <FaTint className="text-red-500 text-xl animate-pulse" />
          <div className="text-left">
            <p className="text-[9px] font-black uppercase text-red-400 tracking-widest">Urgent SOS</p>
            <p className="text-xs font-bold text-white">O- Blood Needed (1.2 km)</p>
          </div>
        </motion.div>

        <motion.div animate={floatAnimation(1.2)} className="hidden lg:flex absolute top-52 right-10 items-center gap-3 bg-teal-900/30 border border-teal-500/20 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl">
          <FaUtensils className="text-teal-400 text-xl" />
          <div className="text-left">
            <p className="text-[9px] font-black uppercase text-teal-400 tracking-widest">Request</p>
            <p className="text-xs font-bold text-white">Family needs hot meals</p>
          </div>
        </motion.div>

        {/* Hero Copy */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Live Emergency Network
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-6 drop-shadow-2xl uppercase">
          Hope isn't a feeling.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-blue-500 italic">It's an Action.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="max-w-2xl text-white/60 text-base sm:text-lg lg:text-xl font-medium mb-10 leading-relaxed px-4">
          Behind every screen is a real heartbeat. A mother terrified for her child. Someone shivering just blocks from your home. <span className="text-white font-bold">Don't look away. You have the power to change their story right now.</span>
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-20 relative px-4">
          <Link to="/register" className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-teal-500 hover:bg-teal-400 text-[#050505] rounded-2xl sm:rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] active:scale-95 flex items-center justify-center gap-3">
            <FaBolt className="text-lg" /> Become a Lifeline
          </Link>
          <Link to="/login" className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl sm:rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all backdrop-blur-md active:scale-95 flex items-center justify-center gap-3">
            <FaHeartbeat className="text-red-500 text-lg" /> I Need Help
          </Link>
        </motion.div>
      </motion.div>

      {/* MOTIVATIONAL STATS STRIP */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-16 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[#0f0f0f] border border-white/5 p-6 sm:p-8 rounded-3xl relative overflow-hidden group hover:border-red-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-[100px] group-hover:bg-red-500/10 transition-colors"></div>
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2">1 Pint</h4>
            <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-relaxed">Of your blood can pull 3 people back from the brink of death.</p>
          </div>
          <div className="bg-[#0f0f0f] border border-white/5 p-6 sm:p-8 rounded-3xl relative overflow-hidden group hover:border-teal-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-[100px] group-hover:bg-teal-500/10 transition-colors"></div>
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2">20 km</h4>
            <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-relaxed">The immediate radius where you can make a physical impact today.</p>
          </div>
          <div className="bg-[#0f0f0f] border border-white/5 p-6 sm:p-8 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] group-hover:bg-blue-500/10 transition-colors"></div>
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2">0 Excuses</h4>
            <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-relaxed">To close this page while your neighbors are actively suffering.</p>
          </div>
        </div>
      </div>

      {/* WHY WE BUILD SECTION */}
      <div className="relative z-10 bg-black py-20 sm:py-32 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FaArrowDown className="text-white/20 text-3xl sm:text-4xl mx-auto mb-8 animate-bounce" />
          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter mb-6 text-white">
            THE TRAGEDY OF SILENCE.
          </h2>
          <p className="text-base sm:text-xl text-white/60 font-medium leading-relaxed mb-8">
            Every day, perfect food is thrown away while children sleep hungry. Closets overflow with coats while the unhoused freeze. Blood banks run dry while thousands of healthy donors sit safely at home, unaware of the crisis happening just blocks away.
          </p>
          <p className="text-lg sm:text-2xl text-teal-400 font-black italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            We built HopeLink to destroy this disconnect.
          </p>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 font-black text-[10px] uppercase tracking-widest mb-4">
            The Arsenal
          </div>
          <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter">HOW WE FIGHT BACK.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="bg-[#0a0a0a] border border-white/5 p-8 sm:p-10 rounded-[2.5rem] hover:border-red-500/30 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 text-red-500 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl mb-6 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
              <FaHeartbeat />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-3 tracking-tighter text-white">The SOS Blast</h3>
            <p className="text-white/50 text-sm font-medium leading-relaxed">
              When someone is in critical danger, a single tap sends a high-priority GPS push notification to every registered donor in a 20km radius. No waiting. Just instant dispatch.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="bg-[#0a0a0a] border border-white/5 p-8 sm:p-10 rounded-[2.5rem] hover:border-teal-500/30 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-500/10 text-teal-400 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl mb-6 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
              <FaMapMarkerAlt />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-3 tracking-tighter text-white">Live Crisis Radar</h3>
            <p className="text-white/50 text-sm font-medium leading-relaxed">
              Stop guessing where help is needed. Our geospatial radar plots every request for food, clothes, and supplies on a live map. See the pulse of your city's needs instantly.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="bg-[#0a0a0a] border border-white/5 p-8 sm:p-10 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 text-blue-400 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <FaShieldAlt />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-3 tracking-tighter text-white">Verified Handshakes</h3>
            <p className="text-white/50 text-sm font-medium leading-relaxed">
              No more blind charity. Our secure PIN system ensures your donation gets into the exact hands of the person who requested it. Earn trust points and build your legacy.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FINAL CALL TO ACTION */}
      <div className="relative z-10 bg-teal-900/20 border-t border-teal-500/20 py-24 text-center px-4">
        <h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter mb-6 text-white drop-shadow-lg uppercase">
          Are you ready to step up?
        </h2>
        <p className="text-white/60 mb-10 max-w-2xl mx-auto text-sm sm:text-base">
          Every second you spend hesitating is a second someone spends waiting. Join the fastest-growing emergency response community today.
        </p>
        <Link to="/register" className="inline-block px-12 py-5 bg-white text-black rounded-full font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all">
          Create Free Account
        </Link>
      </div>

    </div>
  );
};

export default Landing;