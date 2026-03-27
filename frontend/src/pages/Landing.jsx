import { useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaHandsHelping,
  FaUserPlus,
  FaSignInAlt,
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
    // 👉 THE FIX: Removed complex flex-heights. The page will now size naturally.
    <div className="bg-[#0a0f16] text-white font-sans relative selection:bg-teal-500 selection:text-white">
      {/* 👉 THE FIX: Locked the background glows inside a fixed, hidden-overflow container so they never stretch the footer! */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-teal-900/20 blur-[150px] rounded-[100%]"></div>
        <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[60vh] bg-rose-900/10 blur-[150px] rounded-[100%]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-blue-900/10 blur-[150px] rounded-[100%]"></div>
      </div>

      {/* NAVBAR: Simplified & Centered */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-8 w-full flex justify-center items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="HopeLink Logo"
            className="h-10 sm:h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]"
          />
          <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">
            HOPE<span className="text-teal-400">LINK.</span>
          </span>
        </Link>
      </nav>

      {/* HERO SECTION */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center min-h-[65vh] justify-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6 perspective-1000"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[1.05] text-white">
            <span className="inline-block overflow-hidden">
              <motion.span variants={letterReveal} className="inline-block">
                Connecting&nbsp;
              </motion.span>
            </span>
            <span className="inline-block overflow-hidden">
              <motion.span
                variants={letterReveal}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300"
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
          <p className="text-rose-400 font-bold uppercase tracking-widest text-sm mb-4 flex items-center justify-center gap-2">
            <FaBolt className="animate-pulse" /> When Every Second Matters,
            HopeLink Responds
          </p>
          <p className="text-white/60 text-lg sm:text-xl font-medium mb-10 leading-relaxed">
            In times of emergency, delays cost lives. HopeLink is a real-time
            networking platform designed to instantly connect people in need
            with nearby responders, volunteers, and essential services. Whether
            it’s a medical emergency or an urgent request — you are never alone.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto"
        >
          <Link
            to="/register"
            className="px-8 py-4 bg-teal-500 text-[#050505] rounded-full font-black text-sm uppercase tracking-widest hover:bg-teal-400 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(20,184,166,0.3)]"
          >
            <FaUserPlus className="text-lg" /> Sign Up
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-full font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <FaSignInAlt className="text-lg" /> Sign In
          </Link>
        </motion.div>
      </div>

      {/* WHY HOPELINK? */}
      <div className="relative z-20 max-w-7xl w-full mx-auto px-6 py-20 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6 text-white flex items-center justify-center gap-3">
            <FaBolt className="text-teal-400" /> Why HopeLink?
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Traditional emergency systems can be slow, fragmented, and
            inaccessible in critical moments. HopeLink changes that by creating
            a fast, reliable, and community-driven response network.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: FaComments, text: "Real-time communication" },
            { icon: FaMapMarkerAlt, text: "Location-based assistance" },
            { icon: FaBell, text: "Instant alerts & notifications" },
            { icon: FaHandsHelping, text: "Community-powered support" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center hover:bg-white/10 transition-colors"
            >
              <item.icon className="text-3xl text-teal-400 mx-auto mb-4 opacity-80" />
              <p className="font-bold text-white/90 text-sm">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* KEY FEATURES (BENTO BOX GRID) */}
      <div className="relative z-10 w-full py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
              🌟 Key Features
            </h2>
            <p className="text-white/50 text-sm font-bold uppercase tracking-widest">
              Built for speed and reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 - Chat */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-8 sm:p-10 rounded-[2rem] relative overflow-hidden group"
            >
              <FaComments className="absolute -right-4 -bottom-4 text-[150px] text-white/5 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center text-2xl mb-6">
                  <FaComments />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Real-Time Chat System
                </h3>
                <p className="text-white/60 leading-relaxed max-w-md">
                  Seamlessly connect with responders using our lightning-fast
                  chat system powered by bidirectional communication. Stay
                  updated with live responses, delivery status, and unread
                  notifications.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - Alerts */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-8 sm:p-10 rounded-[2rem] relative overflow-hidden group"
            >
              <FaBell className="absolute -right-4 -bottom-4 text-[120px] text-white/5 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center text-2xl mb-6">
                  <FaBell />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  Instant Emergency Alerts
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Send distress signals with a single tap. Nearby users are
                  notified instantly, ensuring rapid action when time is
                  critical.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - Location */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center text-xl mb-5">
                <FaMapMarkerAlt />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">
                Smart Location Tracking
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Automatically share your location with responders to help them
                reach you faster and accurately.
              </p>
            </motion.div>

            {/* Feature 4 - Offline Push */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center text-xl mb-5">
                <FaWifi />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">
                Offline Push Notifications
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Even with limited connectivity, HopeLink ensures you receive
                important alerts using advanced push systems.
              </p>
            </motion.div>

            {/* Feature 5 - Community */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-8 rounded-[2rem]"
            >
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center text-xl mb-5">
                <FaUsers />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">
                Community Network
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                A growing network of volunteers and helpers ready to step in
                when emergencies strike.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS & WHO IS IT FOR */}
      <div className="relative z-10 w-full bg-white/[0.02] border-y border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* How It Works - Stepper */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-black tracking-tight mb-8 text-white">
              🚀 How It Works
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-teal-500 before:to-transparent">
              {[
                {
                  title: "Raise an Alert",
                  desc: "Tap to send an emergency request",
                },
                {
                  title: "Get Connected",
                  desc: "Nearby responders are notified instantly",
                },
                {
                  title: "Communicate in Real-Time",
                  desc: "Chat and share critical updates",
                },
                {
                  title: "Receive Help Quickly",
                  desc: "Faster response, better outcomes",
                },
              ].map((step, i) => (
                <div key={i} className="relative flex items-center gap-6">
                  <div className="w-12 h-12 bg-slate-900 border-2 border-teal-500 rounded-full flex items-center justify-center font-black text-teal-400 shrink-0 z-10 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      {step.title}
                    </h4>
                    <p className="text-white/60 text-sm mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Targets & Security */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-6 text-white">
                🎯 Who Is It For?
              </h2>
              <ul className="space-y-4">
                {[
                  "Individuals in emergency situations",
                  "Volunteers & first responders",
                  "NGOs & relief organizations",
                  "Communities looking to stay prepared",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-white/80 font-medium"
                  >
                    <FaCheckCircle className="text-teal-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem]">
              <h2 className="text-2xl font-black tracking-tight mb-4 text-white flex items-center gap-3">
                <FaShieldAlt className="text-blue-400" /> Safe, Secure &
                Reliable
              </h2>
              <p className="text-white/60 text-sm mb-4">
                Your safety is our priority. HopeLink ensures:
              </p>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-black">•</span> Secure
                  communication channels
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-black">•</span> Reliable
                  data syncing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-black">•</span> Minimal
                  downtime with optimized infrastructure
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FINAL CTA & IMPACT */}
      <div className="relative z-10 w-full pt-24 pb-16 text-center px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-3xl mx-auto"
        >
          <FaHeartbeat className="text-5xl text-rose-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 text-white">
            💡 Built for Impact
          </h2>
          <p className="text-white/70 text-lg md:text-xl font-medium mb-12 leading-relaxed">
            HopeLink is more than just an app — it’s a mission to bridge the gap
            between emergencies and immediate help using technology. Be
            prepared. Stay connected. Save lives.
          </p>

          <div className="flex justify-center mb-16">
            <Link
              to="/register"
              className="px-12 py-5 bg-teal-500 text-[#050505] rounded-full font-black text-sm sm:text-base uppercase tracking-widest hover:bg-teal-400 transition-all active:scale-95 shadow-[0_0_40px_rgba(20,184,166,0.25)] flex items-center gap-3"
            >
              Sign Up Now <FaBolt />
            </Link>
          </div>

          <p className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            ❤️ Together, We Can Make a Difference.
          </p>
          <p className="text-white/50 mt-2 font-medium">
            Every connection matters. Every second counts. With HopeLink, help
            is always within reach.
          </p>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 w-full bg-[#05080c] py-10 text-center border-t border-white/5">
        <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
          HopeLink — Connecting Help, Instantly
        </p>
        <p className="text-white/30 text-[10px] font-medium uppercase tracking-widest">
          &copy; {new Date().getFullYear()} HopeLink. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
