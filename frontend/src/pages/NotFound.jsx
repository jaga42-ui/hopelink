import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-pearl-beige flex flex-col items-center justify-center p-4 text-pine-teal text-center font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[10%] left-[-10%] w-[40vw] max-w-[500px] h-[40vh] bg-dark-raspberry/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-9xl font-black text-dusty-lavender/30 mb-4 drop-shadow-sm">404</h1>
        <h2 className="text-3xl font-bold mb-2 text-pine-teal uppercase tracking-tight">Off the Grid</h2>
        <p className="text-dusty-lavender max-w-md mb-8 font-medium leading-relaxed">
          The coordinates you entered do not match any known sector in the Sahayam network.
        </p>
        <Link 
          to="/dashboard" 
          className="bg-pine-teal hover:bg-[#1a3630] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-[0_10px_25px_rgba(41,82,74,0.3)] active:scale-95"
        >
          <FaHome className="text-lg" /> Return to Base
        </Link>
      </div>
    </div>
  );
};

export default NotFound;