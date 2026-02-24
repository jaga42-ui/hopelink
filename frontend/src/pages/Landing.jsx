import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHeartbeat, FaMapMarkerAlt, FaShieldAlt, FaHandsHelping, 
  FaTint, FaUtensils, FaUserInjured, FaArrowDown, FaQuoteLeft
} from 'react-icons/fa';

import logo from '../assets/logo.png'; 

const Landing = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const floatAnimation = (delay) => ({
    y: [0, -10, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut", delay }
  });

  return (
    // Replaced the harsh black with a calming, deep teal/slate gradient
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white font-sans overflow-x-hidden relative selection:bg-teal-500 selection:text-white">
      
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* NAVBAR */}
      <nav className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={logo} 
            alt="HopeLink Logo" 
            className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
          />
          <span className="text-2xl sm:text-3xl font-black italic tracking-tight drop-shadow-md">
            HOPE<span className="text-teal-400">LINK.</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/login" className="hidden sm:block px-5 py-2 font-bold text-sm text-white/80 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="px-5 py-2.5 sm:px-6 sm:py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/30 transition-all active:scale-95">
            Join Community
          </Link>
        </div>
      </nav>

      {/* HERO SECTION: Empathetic & Uplifting */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-20 md:pt-32 text-center flex flex-col items-center min-h-[75vh]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Gentle Floating Notification Tags */}
        <motion.div animate={floatAnimation(0)} className="hidden lg:flex absolute top-32 left-10 items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl">
          <FaTint className="text-red-400 text-xl" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Nearby Need</p>
            <p className="text-xs font-semibold text-white">O- Blood requested (1.2 km)</p>
          </div>
        </motion.div>

        <motion.div animate={floatAnimation(1.2)} className="hidden lg:flex absolute top-52 right-10 items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl">
          <FaHandsHelping className="text-teal-300 text-xl" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Help Offered</p>
            <p className="text-xs font-semibold text-white">Hot meals available nearby</p>
          </div>
        </motion.div>

        {/* Hero Copy */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-100 font-bold text-xs shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
          </span>
          Connecting neighbors in real-time
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
          Hope isn't just a feeling.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-300 italic">It's a connection.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="max-w-2xl text-teal-50 text-base sm:text-lg font-medium mb-10 leading-relaxed px-4">
          Behind every screen is a real person. A mother worried for her child. Someone shivering just blocks from your warm home. <span className="text-white font-semibold">You have the power to change their story right now. Simply by showing up.</span>
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-20 relative px-4">
          <Link to="/register" className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-gray-100 text-teal-900 rounded-full font-bold text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
            <FaHandsHelping className="text-lg" /> I Want to Help
          </Link>
          <Link to="/login" className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-sm transition-all backdrop-blur-md active:scale-95 flex items-center justify-center gap-2">
            <FaHeartbeat className="text-red-400 text-lg" /> I Need Support
          </Link>
        </motion.div>
      </motion.div>

      {/* MOTIVATIONAL STATS STRIP */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-16 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl relative overflow-hidden transition-all hover:bg-white/10">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2">1 Pint</h4>
            <p className="text-teal-100/70 text-xs font-medium leading-relaxed">Of donated blood can save up to three lives in your community.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl relative overflow-hidden transition-all hover:bg-white/10">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2">20 km</h4>
            <p className="text-teal-100/70 text-xs font-medium leading-relaxed">The immediate radius where you can make a physical, lasting impact today.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl relative overflow-hidden transition-all hover:bg-white/10">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2">Countless</h4>
            <p className="text-teal-100/70 text-xs font-medium leading-relaxed">Moments of relief created when neighbors decide to look out for each other.</p>
          </div>
        </div>
      </div>

      {/* THE STORY SECTION (Emotional & Calm) */}
      <div className="relative z-10 bg-slate-900/50 py-24 sm:py-32 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FaQuoteLeft className="text-teal-500/40 text-4xl sm:text-5xl mx-auto mb-8" />
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-8 text-white leading-snug">
            "I thought we were out of options. Then, a stranger from three miles away walked through the hospital doors."
          </h2>
          <div className="space-y-6 text-base sm:text-lg text-teal-50/70 font-medium leading-relaxed">
            <p>
              Every day, perfectly good food goes to waste while children go hungry. Blood banks run low while healthy donors sit blocks away, completely unaware. 
            </p>
            <p>
              We built HopeLink because we believe the answer to our biggest crises is already right next door. We aren't just an app; we are a bridge. We are destroying the disconnect between those who have, and those who desperately need.
            </p>
          </div>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">How We Bridge the Gap.</h2>
          <p className="text-teal-100/70">Tools designed to make helping others effortless.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 sm:p-10 rounded-[2rem] hover:bg-white/10 transition-all duration-300"
          >
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaHeartbeat />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">Instant Community Alerts</h3>
            <p className="text-teal-50/60 text-sm leading-relaxed">
              When there's a critical need, a single tap notifies registered donors in your immediate area. No endless waiting—just neighbors responding to neighbors.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 sm:p-10 rounded-[2rem] hover:bg-white/10 transition-all duration-300"
          >
            <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaMapMarkerAlt />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">Live Impact Map</h3>
            <p className="text-teal-50/60 text-sm leading-relaxed">
              Stop guessing where help is needed. Our interactive map safely plots requests for food, clothes, and supplies so you can see exactly where to bring your donations.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 sm:p-10 rounded-[2rem] hover:bg-white/10 transition-all duration-300"
          >
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaShieldAlt />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">Verified Connections</h3>
            <p className="text-teal-50/60 text-sm leading-relaxed">
              Our secure PIN system ensures your donation gets into the exact hands of the person who requested it. Helping others has never been safer or more transparent.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FINAL CALL TO ACTION */}
      <div className="relative z-10 bg-teal-900/30 border-t border-teal-500/20 py-24 text-center px-4">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 text-white drop-shadow-md">
          Ready to make a difference?
        </h2>
        <p className="text-teal-100/70 mb-10 max-w-2xl mx-auto text-sm sm:text-base">
          Join a growing community of people dedicated to showing up for one another. Create your free account and see how you can help today.
        </p>
        <Link to="/register" className="inline-block px-10 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-full font-bold text-sm shadow-lg hover:shadow-teal-500/40 hover:-translate-y-1 transition-all">
          Join HopeLink
        </Link>
      </div>

    </div>
  );
};

export default Landing;