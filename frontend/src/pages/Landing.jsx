import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHeartbeat, FaMapMarkerAlt, FaShieldAlt, FaHandsHelping, 
  FaTint, FaQuoteLeft, FaSignInAlt, FaUserPlus
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
    // 👉 LOCKED INTO BRAND GRADIENT
    <div className="min-h-screen bg-brand-gradient text-white font-sans overflow-x-hidden relative selection:bg-white selection:text-teal-900">
      
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* NAVBAR */}
      <nav className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={logo} 
            alt="HopeLink Logo" 
            className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-lg" 
          />
          <span className="text-2xl sm:text-3xl font-black italic tracking-tight drop-shadow-md text-white">
            HOPE<span className="text-teal-100">LINK.</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/login" className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-lg flex items-center gap-2">
            <FaSignInAlt /> Sign In
          </Link>
          <Link to="/register" className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-teal-800 hover:bg-gray-100 rounded-full font-extrabold text-xs sm:text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2">
            <FaUserPlus /> Sign Up
          </Link>
        </div>
      </nav>

      {/* HERO SECTION: Direct & Actionable */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 text-center flex flex-col items-center min-h-[70vh] justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Gentle Floating Notification Tags (Glassmorphism) */}
        <motion.div animate={floatAnimation(0)} className="hidden lg:flex absolute top-32 left-10 items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-xl">
          <FaTint className="text-red-400 text-xl drop-shadow-md" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase text-white/70 tracking-wider">Urgent Request</p>
            <p className="text-xs font-semibold text-white">O- Blood requested (1.2 km)</p>
          </div>
        </motion.div>

        <motion.div animate={floatAnimation(1.2)} className="hidden lg:flex absolute top-52 right-10 items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-xl">
          <FaHandsHelping className="text-teal-200 text-xl drop-shadow-md" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase text-white/70 tracking-wider">Help Offered</p>
            <p className="text-xs font-semibold text-white">Hot meals available nearby</p>
          </div>
        </motion.div>

        {/* Hero Copy */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-xs shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Live SOS Network Active
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-xl text-white">
          Hope isn't just a feeling.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-white italic drop-shadow-md">It's an action.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="max-w-2xl text-white/90 text-base sm:text-lg font-medium mb-10 leading-relaxed px-4 drop-shadow-sm">
          A community is only as strong as its willingness to protect one another. Connect with your neighbors to donate life-saving blood, share extra food, and provide essential supplies in real-time.
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-20 relative px-4">
          <Link to="/register" className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-gray-100 text-teal-900 rounded-full font-extrabold text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
            <FaUserPlus className="text-lg" /> Create Free Account
          </Link>
          <Link to="/login" className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-sm transition-all backdrop-blur-xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
            <FaSignInAlt className="text-lg" /> Sign In
          </Link>
        </motion.div>
      </motion.div>

      {/* MOTIVATIONAL STATS STRIP (Glassmorphism) */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-16 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[2rem] relative overflow-hidden transition-all hover:bg-white/20 shadow-xl">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-md">3 Lives</h4>
            <p className="text-white/80 text-xs font-semibold leading-relaxed">The exact number of people you can save with a single pint (473ml) of donated blood.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[2rem] relative overflow-hidden transition-all hover:bg-white/20 shadow-xl">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-md">15 mins</h4>
            <p className="text-white/80 text-xs font-semibold leading-relaxed">The average time it takes for an SOS broadcast to reach verified donors in your area.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[2rem] relative overflow-hidden transition-all hover:bg-white/20 shadow-xl">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-md">Countless</h4>
            <p className="text-white/80 text-xs font-semibold leading-relaxed">Moments of relief created when neighbors decide to look out for each other.</p>
          </div>
        </div>
      </div>

      {/* THE STORY SECTION (Glassmorphism over Gradient) */}
      <div className="relative z-10 bg-black/10 backdrop-blur-sm py-24 sm:py-32 border-y border-white/10 shadow-inner">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FaQuoteLeft className="text-white/30 text-4xl sm:text-5xl mx-auto mb-8 drop-shadow-sm" />
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-8 text-white leading-snug drop-shadow-md">
            "I thought we were out of options. Then, a stranger from three miles away walked through the hospital doors."
          </h2>
          <div className="space-y-6 text-base sm:text-lg text-white/80 font-medium leading-relaxed">
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
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-md">How We Bridge the Gap.</h2>
          <p className="text-white/70 font-semibold tracking-wider uppercase text-sm">Tools designed to make helping effortless.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] hover:bg-white/20 transition-all duration-300 shadow-2xl"
          >
            <div className="w-16 h-16 bg-white/20 text-white border border-white/30 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaHeartbeat />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-sm">Instant SOS Alerts</h3>
            <p className="text-white/70 text-sm leading-relaxed font-medium">
              When there's a critical need, a single tap notifies registered donors in your immediate area. No endless waiting—just neighbors responding to neighbors.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] hover:bg-white/20 transition-all duration-300 shadow-2xl"
          >
            <div className="w-16 h-16 bg-white/20 text-white border border-white/30 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaMapMarkerAlt />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-sm">Live Impact Radar</h3>
            <p className="text-white/70 text-sm leading-relaxed font-medium">
              Stop guessing where help is needed. Our interactive map safely plots requests for food, clothes, and supplies so you can see exactly where to bring your donations.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] hover:bg-white/20 transition-all duration-300 shadow-2xl"
          >
            <div className="w-16 h-16 bg-white/20 text-white border border-white/30 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaShieldAlt />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-sm">Verified Connections</h3>
            <p className="text-white/70 text-sm leading-relaxed font-medium">
              Our secure PIN system ensures your donation gets into the exact hands of the person who requested it. Helping others has never been safer or more transparent.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FINAL CALL TO ACTION */}
      <div className="relative z-10 bg-black/20 backdrop-blur-sm border-t border-white/10 py-24 text-center px-4 shadow-inner">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 text-white drop-shadow-md">
          Ready to make a difference?
        </h2>
        <p className="text-white/80 mb-10 max-w-2xl mx-auto text-sm sm:text-base font-medium">
          Join a growing community of people dedicated to showing up for one another. Create your free account and see how you can help today.
        </p>
        <Link to="/register" className="inline-block px-10 py-4 bg-white hover:bg-gray-100 text-teal-900 rounded-full font-extrabold text-sm shadow-xl hover:-translate-y-1 transition-all active:scale-95">
          Sign Up Now
        </Link>
      </div>

    </div>
  );
};

export default Landing;