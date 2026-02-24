import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHeartbeat, FaMapMarkerAlt, FaShieldAlt, FaHandsHelping, 
  FaTint, FaUtensils, FaUserInjured, FaArrowDown
} from 'react-icons/fa';

// 👉 Importing your custom logo
import logo from '../assets/logo.png'; 

const Landing = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  // Floating animation for the new emotional tags
  const floatAnimation = (delay) => ({
    y: [0, -15, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut", delay }
  });

  return (
    <div className="min-h-screen bg-brand-gradient text-white font-sans overflow-hidden relative selection:bg-teal-500 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-4 group">
          <img 
            src={logo} 
            alt="HopeLink Logo" 
            className="h-20 md:h-24 w-auto group-hover:scale-105 transition-transform drop-shadow-2xl" 
          />
          <span className="text-4xl md:text-5xl font-black italic tracking-tighter drop-shadow-md">
            HOPE<span className="text-teal-400">LINK.</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block px-6 py-2.5 font-bold text-sm text-white/90 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="px-6 py-2.5 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full font-black text-sm uppercase tracking-widest backdrop-blur-md transition-all active:scale-95 shadow-xl">
            Become a Donor
          </Link>
        </div>
      </nav>

      {/* EMOTIONAL HERO SECTION */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center flex flex-col items-center min-h-[80vh] justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 👉 NEW: Floating Emotional Tags (Desktop Only) */}
        <motion.div animate={floatAnimation(0)} className="hidden lg:flex absolute top-20 left-10 items-center gap-3 bg-red-900/40 border border-red-500/30 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl">
          <FaTint className="text-red-500 animate-pulse" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-red-400 tracking-widest">Urgent</p>
            <p className="text-xs font-bold text-white">O- Blood Needed (2.1 km)</p>
          </div>
        </motion.div>

        <motion.div animate={floatAnimation(1.5)} className="hidden lg:flex absolute top-40 right-10 items-center gap-3 bg-blue-900/40 border border-blue-500/30 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl">
          <FaUtensils className="text-blue-400" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Request</p>
            <p className="text-xs font-bold text-white">Family of 4 needs hot meal</p>
          </div>
        </motion.div>

        <motion.div animate={floatAnimation(0.7)} className="hidden lg:flex absolute bottom-40 left-20 items-center gap-3 bg-teal-900/40 border border-teal-500/30 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl">
          <FaUserInjured className="text-teal-400" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-teal-400 tracking-widest">Disaster</p>
            <p className="text-xs font-bold text-white">Medical supplies required</p>
          </div>
        </motion.div>

        {/* MAIN HERO COPY */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-100 font-black text-[10px] uppercase tracking-[0.3em] backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.2)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          Live Emergency Network Active
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-6 drop-shadow-2xl">
          HOPE ISN'T A FEELING.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 italic">IT'S AN ACTION.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="max-w-3xl text-white/80 text-lg md:text-xl font-medium mb-12 leading-relaxed drop-shadow-md">
          Behind every screen is a real heartbeat. A mother terrified for her child. A patient waiting for a miracle in the ER. Someone shivering on a street corner just miles from your warm home. <b className="text-white drop-shadow-lg">Do not look away. You have the power to change their story right now.</b>
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20 z-20 relative">
          <Link to="/register" className="px-10 py-5 bg-teal-500 hover:bg-teal-400 text-white rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:shadow-[0_0_60px_rgba(20,184,166,0.6)] hover:-translate-y-1 flex items-center justify-center gap-3">
            <FaHandsHelping className="text-2xl" /> Become a Lifeline
          </Link>
          <Link to="/login" className="px-10 py-5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-100 rounded-full font-black text-sm uppercase tracking-widest transition-all backdrop-blur-md hover:-translate-y-1 flex items-center justify-center shadow-xl">
            I Am In Crisis
          </Link>
        </motion.div>

        {/* MOTIVATIONAL STATS STRIP */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl border-t border-white/10 pt-12">
          <div className="bg-black/30 backdrop-blur-xl p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-[100px] transition-colors group-hover:bg-red-500/20"></div>
            <h4 className="text-4xl font-black text-white mb-2 drop-shadow-md">1 Pint</h4>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">Of your blood can pull 3 people back from the brink.</p>
          </div>
          <div className="bg-black/30 backdrop-blur-xl p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-[100px] transition-colors group-hover:bg-blue-500/20"></div>
            <h4 className="text-4xl font-black text-white mb-2 drop-shadow-md">20 km</h4>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">The immediate radius where you can make a physical impact today.</p>
          </div>
          <div className="bg-black/30 backdrop-blur-xl p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-[100px] transition-colors group-hover:bg-teal-500/20"></div>
            <h4 className="text-4xl font-black text-white mb-2 drop-shadow-md">0 Excuses</h4>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">To close this page while your neighbors are suffering.</p>
          </div>
        </motion.div>
      </motion.div>

      {/* 👉 NEW: EMOTIONAL "WHY WE BUILD" SECTION */}
      <div className="relative z-10 bg-black/60 backdrop-blur-2xl border-y border-white/5 py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <FaArrowDown className="text-white/20 text-4xl mx-auto mb-10 animate-bounce" />
          <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter mb-8 text-white drop-shadow-lg">
            THE TRAGEDY OF SILENCE.
          </h2>
          <p className="text-lg md:text-2xl text-white/70 font-medium leading-relaxed max-w-4xl mx-auto mb-8">
            Every day, perfectly good food is thrown away while children sleep with empty stomachs. Closets overflow with winter coats while the unhoused freeze. Blood banks run dry while thousands of healthy donors sit safely at home, unaware of the crisis happening just blocks away.
          </p>
          <p className="text-xl md:text-3xl text-teal-400 font-black italic tracking-tight">
            We built HopeLink to destroy the disconnect.
          </p>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 font-black text-[10px] uppercase tracking-widest mb-4">
            The Arsenal
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter drop-shadow-lg">HOW WE FIGHT BACK.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="bg-gradient-to-b from-[#111] to-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] hover:border-red-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors"></div>
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform border border-red-500/20 shadow-inner">
              <FaHeartbeat />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tighter text-white">The SOS Blast</h3>
            <p className="text-white/60 text-sm font-medium leading-relaxed">
              When someone is bleeding out or in critical danger, a single tap sends a high-priority GPS push notification to every registered donor in a 20km radius. No waiting. Just instant dispatch.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="bg-gradient-to-b from-[#111] to-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] hover:border-blue-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
            <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform border border-blue-500/20 shadow-inner">
              <FaMapMarkerAlt />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tighter text-white">Live Crisis Radar</h3>
            <p className="text-white/60 text-sm font-medium leading-relaxed">
              Stop guessing where help is needed. Our geospatial radar plots every request for food, clothes, and supplies on a live map. You can literally see the pulse of your city's needs.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="bg-gradient-to-b from-[#111] to-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] hover:border-teal-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-colors"></div>
            <div className="w-20 h-20 bg-teal-500/10 text-teal-400 rounded-3xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform border border-teal-500/20 shadow-inner">
              <FaShieldAlt />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tighter text-white">Verified Handshakes</h3>
            <p className="text-white/60 text-sm font-medium leading-relaxed">
              No more blind charity. Our secure PIN system ensures your donation gets into the exact hands of the person who requested it. Complete missions, earn trust points, and track your legacy.
            </p>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default Landing;