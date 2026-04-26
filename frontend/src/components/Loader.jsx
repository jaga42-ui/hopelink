import { FaCircleNotch } from "react-icons/fa";

const Loader = ({ fullScreen = false, text = "SYNCING NETWORK..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6 font-sans">
      {/* Brand Logo (Only shows on full app startup) */}
      {fullScreen && (
        <h2 className="text-2xl font-black italic tracking-tight text-pine-teal mb-2 animate-pulse uppercase">
          SAHA<span className="text-blazing-flame">YAM.</span>
        </h2>
      )}

      {/* Tactical Spinner Assembly */}
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Slow outer radar ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blazing-flame/20 animate-[spin_3s_linear_infinite]"></div>
        {/* Fast inner spinner */}
        <FaCircleNotch className="animate-spin text-4xl text-blazing-flame drop-shadow-[0_0_15px_rgba(255,74,28,0.4)]" />
      </div>

      {/* Data Transmission Text */}
      <p className="text-dusty-lavender font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-pearl-beige z-[9999] flex items-center justify-center overflow-hidden">
        {/* Subtle Background Glow to make it look premium */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] max-w-[600px] h-[50%] bg-blazing-flame/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] max-w-[600px] h-[50%] bg-pine-teal/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">{content}</div>
      </div>
    );
  }

  // Fallback for smaller localized loading states (like inside a card)
  return <div className="py-12 flex justify-center w-full">{content}</div>;
};

export default Loader;