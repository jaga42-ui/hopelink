import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHeartbeat, FaMapMarkerAlt, FaHandsHelping, 
  FaTint, FaUserPlus, FaSignInAlt, FaBoxOpen, FaShieldAlt
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
    y: [0, -12, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay }
  });

  return (
    <div className="min-h-screen bg-brand-gradient text-white font-sans overflow-x-hidden relative selection:bg-white selection:text-teal-900 flex flex-col">
      
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* NAVBAR */}
      <nav className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex justify-between items-center">
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
        
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/login" className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-lg flex items-center gap-2">
            <FaSignInAlt /> Sign In
          </Link>
          <Link to="/register" className="hidden sm:flex px-6 py-3 bg-white text-teal-800 hover:bg-gray-100 rounded-full font-extrabold text-sm shadow-xl transition-all active:scale-95 items-center gap-2">
            <FaUserPlus /> Sign Up
          </Link>
        </div>
      </nav>

      {/* HERO SECTION: Emotional, Human, Direct */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20 md:pt-20 text-center flex flex-col items-center min-h-[70vh] justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Floating Examples of Real Humanity */}
        <motion.div animate={floatAnimation(0)} className="hidden lg:flex absolute top-32 left-10 items-center gap-4 bg-white/10 border border-white/20 backdrop-blur-xl px-6 py-4 rounded-3xl shadow-xl">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-300 border border-red-500/30 shrink-0">
            <FaTint className="text-lg" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase text-white/70 tracking-wider">Urgent Need</p>
            <p className="text-sm font-semibold text-white">"Need O- Blood at City Hospital"</p>
          </div>
        </motion.div>

        <motion.div animate={floatAnimation(1.5)} className="hidden lg:flex absolute top-60 right-10 items-center gap-4 bg-white/10 border border-white/20 backdrop-blur-xl px-6 py-4 rounded-3xl shadow-xl">
          <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-200 border border-teal-500/30 shrink-0">
            <FaBoxOpen className="text-lg" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase text-white/70 tracking-wider">Help Offered</p>
            <p className="text-sm font-semibold text-white">"Fresh groceries available to share"</p>
          </div>
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-xl text-white">
          Community is more than a place.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-white italic drop-shadow-md">It's how we care for each other.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="max-w-2xl text-white/90 text-base sm:text-lg font-medium mb-10 leading-relaxed px-4 drop-shadow-sm">
          Every day, perfectly good food goes to waste while someone close by goes hungry. Blood banks run dry while healthy donors are just minutes away. HopeLink connects people who have extra with the people who need it most.
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-20 relative px-4">
          <Link to="/register" className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-gray-100 text-teal-900 rounded-full font-extrabold text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
            <FaHandsHelping className="text-lg" /> I Want to Help
          </Link>
          <Link to="/login" className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-sm transition-all backdrop-blur-xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
            <FaHeartbeat className="text-red-300 text-lg" /> I Need Support
          </Link>
        </motion.div>
      </motion.div>

      {/* MOTIVATIONAL STATS STRIP */}
      <div className="relative z-20 max-w-6xl w-full mx-auto px-4 sm:px-6 -mt-10 sm:-mt-16 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[2rem] relative overflow-hidden transition-all hover:bg-white/20 shadow-xl">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-md">3 Lives</h4>
            <p className="text-white/80 text-xs font-semibold leading-relaxed">The exact number of people you can save with a single donation of blood.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[2rem] relative overflow-hidden transition-all hover:bg-white/20 shadow-xl">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-md">Minutes</h4>
            <p className="text-white/80 text-xs font-semibold leading-relaxed">The time it takes for an emergency alert to reach people who can actually help.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[2rem] relative overflow-hidden transition-all hover:bg-white/20 shadow-xl">
            <h4 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-md">Countless</h4>
            <p className="text-white/80 text-xs font-semibold leading-relaxed">Moments of relief created when a community decides to stand together.</p>
          </div>
        </div>
      </div>

      {/* THE MISSION STATEMENT (New) */}
      <div className="relative z-10 w-full bg-black/10 backdrop-blur-md border-y border-white/10 py-24 shadow-inner">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-sm font-black tracking-[0.3em] uppercase text-teal-200 mb-6 drop-shadow-sm">Our Mission</h2>
          <p className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-8 text-white leading-tight drop-shadow-md">
            We refuse to accept a world where people suffer in silence while the exact help they need is just a few streets over.
          </p>
          <div className="space-y-6 text-base sm:text-lg text-white/80 font-medium leading-relaxed">
            <p>
              HopeLink was built on a single, undeniable truth: human beings inherently want to help each other. We are simply removing the friction. 
            </p>
            <p>
              Our mission is to transform passive empathy into instant, life-changing action. We are building a hyper-local safety net woven entirely from the kindness of the people living right beside you.
            </p>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS (Plain English Features) */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-md">How people help people.</h2>
          <p className="text-white/70 font-semibold tracking-wider uppercase text-sm">Simple, safe, and entirely free.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] hover:bg-white/20 transition-all duration-300 shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-500/20 text-red-300 border border-red-500/30 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaHeartbeat />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-sm">Real-Time Alerts</h3>
            <p className="text-white/70 text-sm leading-relaxed font-medium">
              When a local hospital needs blood, or a family needs urgent supplies, an alert goes out instantly. Real people stepping up when it matters most.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] hover:bg-white/20 transition-all duration-300 shadow-2xl"
          >
            <div className="w-16 h-16 bg-white/20 text-white border border-white/30 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaMapMarkerAlt />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-sm">Share What You Have</h3>
            <p className="text-white/70 text-sm leading-relaxed font-medium">
              Have extra groceries, gently used clothes, or study books? Post them on the map. Someone close by will request them, ensuring nothing goes to waste.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] hover:bg-white/20 transition-all duration-300 shadow-2xl"
          >
            <div className="w-16 h-16 bg-white/20 text-white border border-white/30 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <FaShieldAlt />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-sm">Safe & Verified</h3>
            <p className="text-white/70 text-sm leading-relaxed font-medium">
              Every exchange is protected by a secure PIN system. This guarantees that your donation gets directly into the hands of the exact person who requested it.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FINAL CALL TO ACTION */}
      <div className="relative z-10 w-full mt-auto">
        <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 py-24 text-center px-4 shadow-inner">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 text-white drop-shadow-md">
            Ready to make a difference?
          </h2>
          <p className="text-white/80 mb-10 max-w-2xl mx-auto text-sm sm:text-base font-medium">
            Create your free account today and see exactly how you can help the people around you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-10 py-4 bg-white text-teal-900 rounded-full font-extrabold text-sm shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2">
              <FaUserPlus /> Sign Up Now
            </Link>
            <Link to="/login" className="px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold text-sm transition-all backdrop-blur-xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <FaSignInAlt /> Sign In
            </Link>
          </div>
        </div>

        {/* FOOTER & COPYRIGHT */}
        <footer className="py-8 text-center border-t border-white/5">
          <p className="text-white/80 font-bold text-sm tracking-wide mb-2 drop-shadow-sm">
            We are the lifeline we've been waiting for.
          </p>
          <p className="text-white/40 text-xs font-medium">
            &copy; {new Date().getFullYear()} HopeLink. Because no one should face the dark alone.
          </p>
        </footer>
      </div>

    </div>
  );
};

export default Landing;