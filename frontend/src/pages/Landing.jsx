import { useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaHandsHelping,
  FaShieldAlt,
  FaComments,
  FaBell,
  FaWifi,
  FaUsers,
  FaBolt,
  FaCheckCircle,
  FaHeartbeat,
} from "react-icons/fa";

import logo from "../assets/logo.png";
import AuthContext from "../context/AuthContext";

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.token) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // --- ANIMATIONS ---
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const letterReveal = {
    hidden: { opacity: 0, y: 50, rotateX: -90 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    // 👉 Updated: Base background is now Pearl Beige, text is Pine Teal
    <div className="flex flex-col min-h-screen bg-pearl-beige text-pine-teal font-sans relative selection:bg-dark-raspberry selection:text-white">
      {/* LOCKED BACKGROUND GLOWS (Updated to Raspberry & Flame) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-dark-raspberry/10 blur-[150px] rounded-[100%]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-blazing-flame/10 blur-[150px] rounded-[100%]"></div>
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-8 w-full flex justify-center items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="HopeLink Logo"
            className="h-10 sm:h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(159,17,100,0.3)]"
          />
          <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-pine-teal">
            HOPE<span className="text-blazing-flame">LINK.</span>
          </span>
        </Link>
      </nav>

      {/* HERO SECTION */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-24 flex flex-col items-center text-center justify-center flex-grow">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6 perspective-1000"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[1.05] text-pine-teal">
            <span className="inline-block overflow-hidden">
              <motion.span variants={letterReveal} className="inline-block">
                Connecting&nbsp;
              </motion.span>
            </span>
            <span className="inline-block overflow-hidden">
              <motion.span
                variants={letterReveal}
                className="inline-block text-transparent bg-clip-text bg-brand-gradient"
              >
                Help,&nbsp;
              </motion.span>
            </span>
            <br className="hidden sm:block" />
            <span className="inline-block overflow-hidden pb-4">
              <motion.span variants={letterReveal} className="inline-block">
                Instantly.
              </motion.span>
            </span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-3xl"
        >
          <p className="text-dark-raspberry font-bold uppercase tracking-widest text-sm mb-4 flex items-center justify-center gap-2">
            <FaBolt className="animate-pulse text-blazing-flame" /> When Every
            Second Matters, HopeLink Responds
          </p>
          <p className="text-pine-teal/70 text-lg sm:text-xl font-medium mb-12 leading-relaxed">
            In times of emergency, delays cost lives. HopeLink is a real-time
            networking platform designed to instantly connect people in need
            with nearby responders.
          </p>
        </motion.div>

        {/* 👉 Updated to use the new bouncy btn-aesthetic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="flex flex-col items-center gap-4 w-full"
        >
          <Link
            to="/register"
            className="btn-aesthetic flex items-center justify-center gap-3 w-full sm:w-auto uppercase tracking-widest text-sm"
          >
            Get Started Today <FaBolt />
          </Link>
          <p className="text-pine-teal/50 text-xs font-medium mt-2">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-dark-raspberry hover:text-blazing-flame transition-colors font-bold"
            >
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>

      {/* KEY FEATURES (BENTO BOX GRID) - Updated to use glass-card */}
      <div className="relative z-10 w-full py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-pine-teal">
              🌟 Key Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="md:col-span-2 glass-card p-8 sm:p-10 relative overflow-hidden group"
            >
              <FaComments className="absolute -right-4 -bottom-4 text-[150px] text-dusty-lavender/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-dark-raspberry/10 text-dark-raspberry rounded-2xl flex items-center justify-center text-2xl mb-6">
                  <FaComments />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-pine-teal">
                  Real-Time Chat System
                </h3>
                <p className="text-pine-teal/70 leading-relaxed max-w-md">
                  Seamlessly connect with responders using our lightning-fast
                  chat system powered by bidirectional communication.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="glass-card p-8 sm:p-10 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blazing-flame/10 text-blazing-flame rounded-2xl flex items-center justify-center text-2xl mb-6">
                  <FaBell />
                </div>
                <h3 className="text-xl font-bold mb-3 text-pine-teal">
                  Instant Alerts
                </h3>
                <p className="text-pine-teal/70 text-sm leading-relaxed">
                  Send distress signals with a single tap. Nearby users are
                  notified instantly.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 👉 FOOTER - Deep Pine Teal */}
      <footer className="mt-auto relative z-10 w-full bg-pine-teal py-8 text-center border-t border-dusty-lavender/30">
        <p className="text-pearl-beige/60 text-xs font-bold tracking-widest uppercase mb-2">
          HopeLink — Connecting Help, Instantly
        </p>
        <p className="text-pearl-beige/40 text-[10px] font-medium uppercase tracking-widest">
          &copy; {new Date().getFullYear()} HopeLink. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
