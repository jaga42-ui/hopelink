import { FaCircleNotch } from 'react-icons/fa';

const Loader = ({ fullScreen = false, text = "SYNCING NETWORK..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Tactical Spinner Assembly */}
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Slow outer radar ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-teal-500/20 animate-[spin_3s_linear_infinite]"></div>
        {/* Fast inner spinner */}
        <FaCircleNotch className="animate-spin text-4xl text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.6)]" />
      </div>
      
      {/* Data Transmission Text */}
      <p className="text-teal-400/50 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse mt-2">
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      // bg-[#050505]/90 matches your new app background perfectly
      // z-[5000] ensures it overlays your Emergency Modals and Mobile Nav
      <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-md z-[5000] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex justify-center w-full">{content}</div>;
};

export default Loader;