import { useEffect, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
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

// --- ANIMATION VARIANTS ---
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

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen once per session
    return !sessionStorage.getItem("splashShown");
  });

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("splashShown", "true");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  useEffect(() => {
    if (user && user.token) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <>
      <Helmet>
        <title>Sahayam - The Hyper-Local Lifesaver Network</title>
        <meta name="description" content="Join Sahayam to build a hyper-local grid of life-savers. Donate food, clothes, or blood, and respond to local emergencies instantly." />
        <meta property="og:title" content="Sahayam - Connect. Rescue. Survive." />
        <meta property="og:description" content="The world's fastest hyper-local community emergency and donation network. Be the hero your city needs." />
        <meta property="og:image" content="https://sahayam.vercel.app/pwa-512x512.png" />
        <meta property="og:url" content="https://sahayam.vercel.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sahayam - Lifesaver Network" />
        <meta name="twitter:description" content="Join the grid. Save lives in your neighborhood today." />
        <meta name="twitter:image" content="https://sahayam.vercel.app/pwa-512x512.png" />
      </Helmet>
      {/* --- PREMIUM OPENING CREDIT SEQUENCE --- */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.5 } }}
            exit={{ opacity: 0, y: "-100vh", transition: { duration: 0.8, ease: "easeInOut", delay: 0.5 } }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'radial-gradient(circle at center, #29524a, #1a3630)' }}
          >
            <motion.h1
              initial={{ opacity: 0, filter: "blur(10px)", scale: 0.9 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1, transition: { duration: 1.2, ease: "easeOut", delay: 0.3 } }}
              className="text-2xl sm:text-4xl font-black tracking-[0.3em] text-[#e8dab2] uppercase text-center px-4"
            >
              Developed by <span className="text-[#ff4a1c] drop-shadow-[0_0_15px_rgba(255,74,28,0.5)]">Guruprasad</span><br />and Team
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTE: overflow-x-hidden is used here to safely contain absolute background glows without breaking vertical scrolling */}
      <main className="flex flex-col min-h-screen bg-pearl-beige text-pine-teal font-sans relative selection:bg-dark-raspberry selection:text-white overflow-x-hidden">

        {/* VIBRANT BACKGROUND GLOWS */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[800px] h-[50vh] bg-dark-raspberry/10 blur-[100px] rounded-full"></div>
          <div className="absolute top-[40%] right-[-10%] w-[40vw] max-w-[600px] h-[60vh] bg-blazing-flame/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] max-w-[700px] h-[50vh] bg-pine-teal/10 blur-[100px] rounded-full"></div>
        </div>

        {/* HEADER */}
        <header className="relative z-40 max-w-7xl mx-auto px-6 py-8 w-full flex justify-center items-center shrink-0">
          <nav>
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="Sahayam Logo"
                className="h-10 sm:h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(159,17,100,0.3)]"
              />
              <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-pine-teal">
                SAHA<span className="text-blazing-flame">YAM.</span>
              </span>
            </Link>
          </nav>
        </header>

        {/* HERO SECTION */}
        <section className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-24 flex flex-col items-center text-center justify-center flex-grow">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-6" style={{ perspective: "1000px" }}>
            <h1 aria-label="When seconds matter, we respond." className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[1.05] text-pine-teal">
              <span aria-hidden="true" className="inline-block overflow-hidden">
                <motion.span variants={letterReveal} className="inline-block">When Seconds&nbsp;</motion.span>
              </span>
              <br className="hidden sm:block" />
              <span aria-hidden="true" className="inline-block overflow-hidden pb-2">
                <motion.span variants={letterReveal} className="inline-block">Matter,&nbsp;</motion.span>
              </span>
              <span aria-hidden="true" className="inline-block overflow-hidden">
                <motion.span
                  variants={letterReveal}
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-dark-raspberry to-blazing-flame"
                >
                  We Respond.
                </motion.span>
              </span>
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} className="max-w-3xl">
            <p className="text-dark-raspberry font-bold uppercase tracking-widest text-xs md:text-sm mb-6 flex items-center justify-center gap-2">
              <FaBolt className="animate-pulse text-blazing-flame" /> The Hyper-Local Lifesaver Grid
            </p>
            
            <div className="bg-white/60 backdrop-blur-md border border-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(41,82,74,0.05)] mb-10 text-left md:text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-dark-raspberry to-blazing-flame md:hidden"></div>
              <p className="text-pine-teal/90 text-sm sm:text-base font-medium leading-relaxed mb-4">
                <strong className="text-dark-raspberry font-black tracking-wide uppercase text-xs block md:inline md:mr-2">The Reality:</strong> 
                It’s 2 AM. A loved one urgently needs O- blood. The hospital bank is empty, and posting on social media feels like shouting into a void. Time is running out. What do you do?
              </p>
              <p className="text-pine-teal/90 text-sm sm:text-base font-medium leading-relaxed">
                <strong className="text-blazing-flame font-black tracking-wide uppercase text-xs block md:inline md:mr-2">The Solution:</strong> 
                Sahayam is a real-time, AI-driven emergency network. Press one button, and we instantly route your SOS to verified donors, NGOs, and volunteers actively listening in your specific neighborhood. No delays. No middlemen. Just immediate, life-saving help.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, type: "spring" }} className="flex flex-col items-center gap-4 w-full">
            <Link to="/register" className="px-10 py-5 bg-blazing-flame text-white rounded-full font-black text-sm sm:text-base uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,74,28,0.4)] flex items-center justify-center gap-3 w-full sm:w-auto">
              Join The Grid Today <FaBolt />
            </Link>
            <p className="text-pine-teal/60 text-xs font-medium mt-2">
              Are you an NGO or existing volunteer?{" "}
              <Link to="/login" className="text-dark-raspberry hover:text-blazing-flame transition-colors font-bold">
                Sign In
              </Link>
            </p>
          </motion.div>
        </section>

        {/* WHY SAHAYAM? */}
        <section className="relative z-20 max-w-7xl w-full mx-auto px-6 py-20 border-t border-dusty-lavender/20 bg-white/30 backdrop-blur-md mt-12 rounded-t-[3rem]">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6 text-pine-teal flex items-center justify-center gap-3">
              <FaBolt className="text-blazing-flame" /> Why Sahayam?
            </h2>
            <p className="text-pine-teal/80 text-lg leading-relaxed">
              Traditional emergency systems can be slow, fragmented, and inaccessible in critical moments. Sahayam changes that by creating a fast, reliable, and community-driven response network.
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
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="bg-white/60 border border-white shadow-sm p-6 rounded-3xl text-center hover:bg-white hover:shadow-md transition-all duration-300 group"
              >
                <item.icon className="text-3xl text-dark-raspberry mx-auto mb-4 opacity-80 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-pine-teal text-sm">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* KEY FEATURES (BENTO BOX GRID) */}
        <section className="relative z-10 w-full py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-pine-teal">
                🌟 Key Features
              </h2>
              <p className="text-dusty-lavender text-sm font-bold uppercase tracking-widest">
                Built for speed and reliability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:col-span-2 bg-white/70 backdrop-blur-lg border border-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(41,82,74,0.08)] p-8 sm:p-10 relative overflow-hidden group">
                <FaComments className="absolute -right-4 -bottom-4 text-[150px] text-dusty-lavender/10 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-dark-raspberry/10 text-dark-raspberry rounded-2xl flex items-center justify-center text-2xl mb-6">
                    <FaComments />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-pine-teal">Real-Time Chat System</h3>
                  <p className="text-pine-teal/80 leading-relaxed max-w-md">
                    Seamlessly connect with responders using our lightning-fast chat system powered by bidirectional communication. Stay updated with live responses, delivery status, and unread notifications.
                  </p>
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white/70 backdrop-blur-lg border border-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(41,82,74,0.08)] p-8 sm:p-10 relative overflow-hidden group">
                <FaBell className="absolute -right-4 -bottom-4 text-[120px] text-dusty-lavender/10 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-blazing-flame/10 text-blazing-flame rounded-2xl flex items-center justify-center text-2xl mb-6">
                    <FaBell />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-pine-teal">Instant Emergency Alerts</h3>
                  <p className="text-pine-teal/80 text-sm leading-relaxed">
                    Send distress signals with a single tap. Nearby users are notified instantly, ensuring rapid action when time is critical.
                  </p>
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white/70 backdrop-blur-lg border border-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(41,82,74,0.08)] p-8 rounded-[2rem]">
                <div className="w-12 h-12 bg-pine-teal/10 text-pine-teal rounded-xl flex items-center justify-center text-xl mb-5">
                  <FaMapMarkerAlt />
                </div>
                <h3 className="text-lg font-bold mb-2 text-pine-teal">Smart Location Tracking</h3>
                <p className="text-pine-teal/80 text-sm leading-relaxed">
                  Automatically share your location with responders to help them reach you faster and accurately.
                </p>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white/70 backdrop-blur-lg border border-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(41,82,74,0.08)] p-8 rounded-[2rem]">
                <div className="w-12 h-12 bg-dusty-lavender/10 text-dark-raspberry rounded-xl flex items-center justify-center text-xl mb-5">
                  <FaWifi />
                </div>
                <h3 className="text-lg font-bold mb-2 text-pine-teal">Offline Push Notifications</h3>
                <p className="text-pine-teal/80 text-sm leading-relaxed">
                  Even with limited connectivity, Sahayam ensures you receive important alerts using advanced push systems.
                </p>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white/70 backdrop-blur-lg border border-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(41,82,74,0.08)] p-8 rounded-[2rem]">
                <div className="w-12 h-12 bg-blazing-flame/10 text-blazing-flame rounded-xl flex items-center justify-center text-xl mb-5">
                  <FaUsers />
                </div>
                <h3 className="text-lg font-bold mb-2 text-pine-teal">Community Network</h3>
                <p className="text-pine-teal/80 text-sm leading-relaxed">
                  A growing network of volunteers and helpers ready to step in when emergencies strike.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS & WHO IS IT FOR */}
        <section className="relative z-10 w-full bg-white/20 border-y border-dusty-lavender/20 py-24 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-3xl font-black tracking-tight mb-8 text-pine-teal">
                🚀 How It Works
              </h2>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blazing-flame before:to-transparent">
                {[
                  { title: "Raise an Alert", desc: "Tap to send an emergency request" },
                  { title: "Get Connected", desc: "Nearby responders are notified instantly" },
                  { title: "Communicate in Real-Time", desc: "Chat and share critical updates" },
                  { title: "Receive Help Quickly", desc: "Faster response, better outcomes" },
                ].map((step, i) => (
                  <div key={i} className="relative flex items-center gap-6">
                    <div className="w-12 h-12 bg-white border-2 border-blazing-flame rounded-full flex items-center justify-center font-black text-blazing-flame shrink-0 z-10 shadow-[0_0_15px_rgba(255,74,28,0.3)]">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-pine-teal">{step.title}</h4>
                      <p className="text-pine-teal/70 text-sm mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-12">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-6 text-pine-teal">
                  🎯 Who Is It For?
                </h2>
                <ul className="space-y-4">
                  {[
                    "Individuals in emergency situations",
                    "Volunteers & first responders",
                    "NGOs & relief organizations",
                    "Communities looking to stay prepared",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-pine-teal/90 font-medium">
                      <FaCheckCircle className="text-blazing-flame shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(41,82,74,0.08)] p-8">
                <h2 className="text-2xl font-black tracking-tight mb-4 text-pine-teal flex items-center gap-3">
                  <FaShieldAlt className="text-dark-raspberry" /> Safe, Secure & Reliable
                </h2>
                <p className="text-pine-teal/80 text-sm mb-4">
                  Your safety is our priority. Sahayam ensures:
                </p>
                <ul className="space-y-3 text-sm text-pine-teal/90 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-dark-raspberry font-black">•</span> Secure communication channels
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-dark-raspberry font-black">•</span> Reliable data syncing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-dark-raspberry font-black">•</span> Minimal downtime with optimized infrastructure
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FINAL CTA & IMPACT */}
        <section className="relative z-10 w-full pt-24 pb-16 text-center px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-3xl mx-auto">
            <FaHeartbeat className="text-5xl text-dark-raspberry mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 text-pine-teal">
              💡 Built for Impact
            </h2>
            <p className="text-pine-teal/90 text-lg md:text-xl font-medium mb-12 leading-relaxed">
              Sahayam is more than just an app — it’s a mission to bridge the gap between emergencies and immediate help using technology. Be prepared. Stay connected. Save lives.
            </p>

            <div className="flex flex-col items-center gap-4 w-full mb-16">
              <Link to="/register" className="px-10 py-5 bg-blazing-flame text-white rounded-full font-black text-sm sm:text-base uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,74,28,0.4)] flex items-center justify-center gap-3 w-full sm:w-auto">
                Get Started Today <FaBolt />
              </Link>
            </div>

            <p className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-dark-raspberry to-blazing-flame">
              ❤️ Together, We Can Make a Difference.
            </p>
            <p className="text-pine-teal/70 mt-2 font-medium">
              Every connection matters. Every second counts. With Sahayam, help is always within reach.
            </p>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto relative z-10 w-full bg-pine-teal py-8 text-center border-t border-dusty-lavender/30 shrink-0">
          <p className="text-pearl-beige/90 text-xs font-bold tracking-widest uppercase mb-2">
            Sahayam — Connecting Help, Instantly
          </p>
          <p className="text-pearl-beige/60 text-[10px] font-medium uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Sahayam. All rights reserved.
          </p>
        </footer>
      </main>
    </>
  );
};

export default Landing;