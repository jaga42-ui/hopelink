import { useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaHeartbeat,
  FaMapMarkerAlt,
  FaHandsHelping,
  FaUserPlus,
  FaSignInAlt,
  FaShieldAlt,
  FaQuoteLeft,
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
  const floatAnimation = (delay) => ({
    y: [0, -15, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay },
  });

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white font-sans overflow-x-hidden relative selection:bg-teal-500 selection:text-white">
      {/* CINEMATIC BACKGROUND GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-teal-900/20 blur-[150px] rounded-[100%] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vh] bg-rose-900/10 blur-[150px] rounded-[100%] pointer-events-none"></div>

      {/* NAVBAR */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-6 w-full flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="HopeLink Logo"
            className="h-10 sm:h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-500"
          />
          <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">
            HOPE<span className="text-teal-400">LINK.</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden sm:flex px-6 py-2.5 text-white/70 hover:text-white font-bold text-sm transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white rounded-full font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <FaUserPlus /> Join Grid
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center min-h-[75vh] justify-center">
        {/* Natural Floating Examples */}
        <motion.div
          animate={floatAnimation(0)}
          className="hidden lg:flex absolute top-32 left-0 items-start gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl max-w-xs text-left"
        >
          <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 shrink-0 mt-1">
            <FaHeartbeat />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-white/50 tracking-wider mb-1">
              Emergency Ping
            </p>
            <p className="text-sm font-medium text-white/90 leading-snug">
              "My dad is in surgery and desperately needs O- blood. Is anyone
              nearby?"
            </p>
          </div>
        </motion.div>

        <motion.div
          animate={floatAnimation(1.5)}
          className="hidden lg:flex absolute top-52 right-0 items-start gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl max-w-xs text-left"
        >
          <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400 shrink-0 mt-1">
            <FaHandsHelping />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-white/50 tracking-wider mb-1">
              Local Offer
            </p>
            <p className="text-sm font-medium text-white/90 leading-snug">
              "Baked too much bread today! Left a fresh loaf in a clean bag on
              my porch if anyone wants it."
            </p>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[1.1] text-white mb-6"
        >
          You are the <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-500">
            lifeline they need.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="max-w-2xl text-white/60 text-lg sm:text-xl font-medium mb-12 leading-relaxed"
        >
          There is enough to go around. Sometimes, it just needs a little help
          finding its way to the right hands. No middlemen. Just neighbors
          saving neighbors.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto"
        >
          <Link
            to="/register"
            className="px-8 py-4 bg-teal-500 text-[#050505] rounded-full font-black text-sm uppercase tracking-widest hover:bg-teal-400 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(20,184,166,0.3)]"
          >
            <FaHandsHelping className="text-lg" /> I Can Help
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-full font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <FaHeartbeat className="text-rose-400 text-lg" /> I Need Support
          </Link>
        </motion.div>
      </div>

      {/* HUMAN STATS (Less corporate, more impactful) */}
      <div className="relative z-20 max-w-6xl w-full mx-auto px-6 -mt-10 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors"
          >
            <h4 className="text-3xl font-black text-white mb-3">
              Three Lives.
            </h4>
            <p className="text-white/60 text-sm leading-relaxed">
              A single blood donation can save up to three lives. That could be
              someone's mother, best friend, and child.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors"
          >
            <h4 className="text-3xl font-black text-white mb-3">
              Five Minutes.
            </h4>
            <p className="text-white/60 text-sm leading-relaxed">
              Instead of waiting days for centralized systems, your alert pings
              the phones of people who are just down the street.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors"
          >
            <h4 className="text-3xl font-black text-white mb-3">
              Everyday Magic.
            </h4>
            <p className="text-white/60 text-sm leading-relaxed">
              The profound, quiet relief of realizing your community actually
              has your back when things get dark.
            </p>
          </motion.div>
        </div>
      </div>

      {/* THE HEARTBEAT MISSION */}
      <div className="relative z-10 w-full bg-gradient-to-b from-[#0a0f16] to-[#0d141d] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FaQuoteLeft className="text-4xl text-teal-500/30 mx-auto mb-8" />
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-8 text-white leading-tight">
            We built HopeLink because we noticed a heartbreaking disconnect.
          </h2>
          <div className="space-y-6 text-lg text-white/70 font-medium leading-relaxed max-w-3xl mx-auto">
            <p>
              People were suffering in silence right next door to neighbors who
              would gladly help—if they only knew.
            </p>
            <p>
              Human beings inherently want to take care of each other. We are
              just removing the invisible walls between us. We're turning
              passive empathy into instant, life-changing action.
            </p>
          </div>
        </div>
      </div>

      {/* HOW IT ACTUALLY WORKS (Conversational tone) */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black tracking-tight mb-4 text-white">
            How we look out for each other.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center md:text-left"
          >
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto md:mx-0">
              <FaHeartbeat />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">
              Ask for help, out loud.
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              When the unexpected happens, press the SOS button. We instantly
              wake up the phones of verified donors within a few miles of you.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center md:text-left"
          >
            <div className="w-16 h-16 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto md:mx-0">
              <FaMapMarkerAlt />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">
              Offer what you can.
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Got baby formula your kid outgrew? Extra blankets in winter? Drop
              a pin on the radar so someone nearby can claim it before it goes
              to waste.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center md:text-left"
          >
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto md:mx-0">
              <FaShieldAlt />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">
              Safe, quiet handoffs.
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              No weird encounters. You connect in a private chat, and the
              exchange is locked down with a secure PIN to ensure it reached the
              right hands.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 w-full bg-[#05080c] py-12 text-center border-t border-white/5">
        <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
          We are the lifeline we've been waiting for.
        </p>
        <p className="text-white/30 text-[10px] font-medium uppercase tracking-widest">
          &copy; {new Date().getFullYear()} HopeLink. Welcome Home.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
