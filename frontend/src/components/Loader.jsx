import { FaCircleNotch } from "react-icons/fa";

const Loader = ({ fullScreen = false, text = "SYNCING NETWORK..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Brand Logo (Only shows on full app startup) */}
      {fullScreen && (
        <h2 className="text-2xl font-black italic tracking-tight text-white mb-2 animate-pulse">
          HOPE<span className="text-teal-500">LINK.</span>
        </h2>
      )}

      {/* Tactical Spinner Assembly */}
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Slow outer radar ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-teal-500/20 animate-[spin_3s_linear_infinite]"></div>
        {/* Fast inner spinner */}
        <FaCircleNotch className="animate-spin text-4xl text-teal-500 drop-shadow-[0_0_15px_rgba(20,184,166,0.6)]" />
      </div>

      {/* Data Transmission Text */}
      <p className="text-teal-500/70 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      // 👉 SOLID DARK THEME: bg-slate-950 matches the rest of the app perfectly
      // z-[9999] ensures it covers modals, navbars, and maps during startup
      <div className="fixed inset-0 bg-slate-950 z-[9999] flex items-center justify-center overflow-hidden">
        {/* Subtle Background Glow to make it look premium */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10">{content}</div>
      </div>
    );
  }

  // Fallback for smaller localized loading states (like inside a card)
  return <div className="py-12 flex justify-center w-full">{content}</div>;
};

export default Loader;
