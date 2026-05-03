import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserPlus, FaEnvelope, FaLock, FaPhone, FaTint, FaShieldAlt, FaTimes, FaCheck,
} from "react-icons/fa";
import toast from "react-hot-toast";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", bloodGroup: "", organizationName: "",
  });
  const [activeRole, setActiveRole] = useState("donor");
  const [isLoading, setIsLoading] = useState(false);

  // Privacy Policy States
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // 👉 DYNAMIC THEME HANDLERS BASED ON ROLE
  const themeAccent = activeRole === "donor" ? "text-blazing-flame" : activeRole === "receiver" ? "text-dark-raspberry" : "text-pine-teal";
  const themeBg = activeRole === "donor" ? "bg-blazing-flame hover:bg-[#e03a12]" : activeRole === "receiver" ? "bg-dark-raspberry hover:bg-[#850e53]" : "bg-pine-teal hover:bg-[#1a3630]";
  const themeFocusBorder = activeRole === "donor" ? "focus:border-blazing-flame focus:ring-blazing-flame/10" : activeRole === "receiver" ? "focus:border-dark-raspberry focus:ring-dark-raspberry/10" : "focus:border-pine-teal focus:ring-pine-teal/10";
  const themeShadow = activeRole === "donor" ? "shadow-[0_10px_25px_rgba(255,74,28,0.3)]" : activeRole === "receiver" ? "shadow-[0_10px_25px_rgba(159,17,100,0.3)]" : "shadow-[0_10px_25px_rgba(41,82,74,0.3)]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToPolicy) {
      return toast.error("You must agree to the Terms & Privacy Policy to join Sahayam.", {
        style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
      });
    }

    setIsLoading(true);
    try {
      const payload = { ...formData, activeRole };
      if (!payload.bloodGroup) delete payload.bloodGroup;
      if (activeRole !== "ngo") delete payload.organizationName;

      const { data } = await api.post("/auth/register", payload);
      login(data);
      toast.success("Welcome to the Sahayam Community!", {
        style: { background: '#ffffff', color: '#29524a', border: '1px solid #846b8a' }
      });
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please check your inputs.", {
        style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPolicy = () => {
    setAgreedToPolicy(true);
    setShowPolicyModal(false);
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex items-center justify-center p-4 relative selection:bg-dark-raspberry selection:text-white overflow-hidden font-sans">
      {/* VIBRANT BACKGROUND GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] max-w-[600px] h-[50vh] bg-dark-raspberry/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] max-w-[600px] h-[50vh] bg-blazing-flame/10 blur-[100px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white/70 backdrop-blur-lg border border-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_40px_rgba(41,82,74,0.08)] relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white border border-dusty-lavender/30 rounded-2xl flex items-center justify-center text-3xl text-pine-teal mx-auto mb-4 shadow-sm">
            <FaUserPlus />
          </div>
          <h2 className="text-3xl font-black text-pine-teal tracking-tight mb-1 uppercase">
            Join <span className={themeAccent}>Sahayam.</span>
          </h2>
          <p className="text-dusty-lavender text-xs font-bold uppercase tracking-widest mt-1">
            Create your secure account.
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl mb-6 border border-dusty-lavender/30 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveRole("donor")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === "donor" ? "bg-blazing-flame text-white shadow-md" : "text-dusty-lavender hover:text-pine-teal hover:bg-white"}`}
          >
            Donor
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("receiver")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === "receiver" ? "bg-dark-raspberry text-white shadow-md" : "text-dusty-lavender hover:text-pine-teal hover:bg-white"}`}
          >
            Receiver
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("ngo")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === "ngo" ? "bg-pine-teal text-white shadow-md" : "text-dusty-lavender hover:text-pine-teal hover:bg-white"}`}
          >
            NGO
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaUserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
            <input
              required
              aria-label="Full Name"
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full bg-white border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
            />
          </div>

          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
            <input
              required
              aria-label="Email Address"
              type="email"
              placeholder="operator@sahayam.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full bg-white border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
            />
          </div>

          <div className="relative">
            <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
            <input
              required
              aria-label="Phone Number"
              type="tel"
              placeholder="+91 XXXXXXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full bg-white border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
            />
          </div>

          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
            <input
              required
              aria-label="Secure Password"
              type="password"
              placeholder="Secure Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full bg-white border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
            />
          </div>

          {activeRole === "donor" && (
            <div className="relative">
              <FaTint className="absolute left-4 top-1/2 -translate-y-1/2 text-blazing-flame" />
              <select
                aria-label="Blood Group"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className={`w-full bg-white border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all appearance-none shadow-inner cursor-pointer ${themeFocusBorder}`}
              >
                <option value="" disabled className="text-dusty-lavender">Blood Group (Optional)</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          )}

          {activeRole === "ngo" && (
            <div className="relative">
              <FaShieldAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-pine-teal" />
              <input
                required
                aria-label="Organization Name"
                type="text"
                placeholder="NGO / Hospital Name"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className={`w-full bg-white border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
              />
            </div>
          )}

          {/* 👉 THE LEGAL SHIELD: A11y Compliant Checkbox */}
          <div className="flex items-start gap-3 mt-6 mb-2 bg-white/50 p-4 rounded-xl border border-white shadow-sm">
            <button
              type="button"
              role="checkbox"
              aria-checked={agreedToPolicy}
              onClick={() => setAgreedToPolicy(!agreedToPolicy)}
              className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${agreedToPolicy ? (activeRole === "donor" ? "bg-blazing-flame border-blazing-flame" : "bg-dark-raspberry border-dark-raspberry") : "bg-white border-dusty-lavender/50 shadow-inner"}`}
            >
              {agreedToPolicy && <FaCheck className="text-white text-[10px]" />}
            </button>
            <p className="text-[10px] sm:text-xs text-pine-teal leading-relaxed font-medium">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                className={`font-bold underline decoration-dusty-lavender underline-offset-4 transition-all ${themeAccent}`}
              >
                Terms & Privacy Policy
              </button>
              .
              <br /><br />
              <span className="text-dusty-lavender block leading-tight">
                <strong className="text-pine-teal">Disclaimer:</strong> Sahayam
                is a community coordination tool, not an official emergency
                service. I take full legal responsibility for any
                exchanges made through this platform.
              </span>
            </p>
          </div>

          {/* The Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !agreedToPolicy}
            className={`w-full py-4 mt-4 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs text-white transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${themeBg} ${themeShadow}`}
          >
            {isLoading ? <FaSpinner className="animate-spin text-xl" /> : "Create Account"}
          </button>
        </form>

        <p className="text-center text-dusty-lavender text-[10px] uppercase font-bold tracking-widest mt-8">
          Already a hero?{" "}
          <Link to="/login" className="text-pine-teal font-black hover:text-blazing-flame transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>

      {/* The Privacy Policy Popup Modal */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-pine-teal/60 backdrop-blur-sm"
              onClick={() => setShowPolicyModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-6 border-b border-dusty-lavender/20 pb-4">
                <div className="flex items-center gap-3 text-pine-teal">
                  <div className="w-10 h-10 bg-pearl-beige/50 rounded-full flex items-center justify-center text-dark-raspberry border border-dusty-lavender/30">
                    <FaShieldAlt className="text-lg" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Terms & Privacy</h3>
                </div>
                <button
                  onClick={() => setShowPolicyModal(false)}
                  className="text-dusty-lavender hover:text-blazing-flame p-2 bg-white hover:bg-pearl-beige rounded-full transition-colors border border-dusty-lavender/20"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="overflow-y-auto pr-4 no-scrollbar space-y-5 text-sm text-pine-teal/80 leading-relaxed mb-6 flex-1">
                <p className="font-bold">
                  Welcome to Sahayam. By joining our platform, you agree to the
                  following terms designed to keep our community safe.
                </p>
                <div>
                  <h4 className="font-black text-pine-teal uppercase tracking-widest text-[10px] mb-1">1. Not an Emergency Service</h4>
                  <p>Sahayam is a peer-to-peer communication platform. It does not replace professional medical advice or official emergency services.</p>
                </div>
                <div>
                  <h4 className="font-black text-pine-teal uppercase tracking-widest text-[10px] mb-1">2. No Verification of Goods</h4>
                  <p>We do not and cannot medically test, screen, or verify the safety, quality, or legality of resources exchanged. You accept all associated risks.</p>
                </div>
                <div>
                  <h4 className="font-bold text-pine-teal uppercase tracking-widest text-[10px] mb-1">3. Location Data & Privacy</h4>
                  <p>When you post an SOS or a donation, we use your location to alert nearby users. Your exact pinpoint is generalized on the public feed to protect your privacy.</p>
                </div>
                <div>
                  <h4 className="font-bold text-pine-teal uppercase tracking-widest text-[10px] mb-1">4. Data Sharing</h4>
                  <p>We absolutely do not sell your data. Your profile details are only shared with other verified users when you actively interact with them.</p>
                </div>
                <div>
                  <h4 className="font-bold text-pine-teal uppercase tracking-widest text-[10px] mb-1">5. Zero Liability</h4>
                  <p>By creating an account, you agree that the creators of Sahayam bear zero liability for any harm resulting from the use of this platform.</p>
                </div>
              </div>

              <button
                onClick={handleAcceptPolicy}
                className="w-full py-4 bg-pine-teal hover:bg-[#1a3630] text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-colors shadow-[0_10px_25px_rgba(41,82,74,0.3)] active:scale-95"
              >
                I Accept & Agree
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Register;