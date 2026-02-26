import { Link } from 'react-router-dom';
import { FaMapMapMarkerAlt, FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white text-center">
      <h1 className="text-9xl font-black text-slate-800 mb-4">404</h1>
      <h2 className="text-3xl font-bold mb-2">Off the Grid</h2>
      <p className="text-slate-400 max-w-md mb-8">
        The coordinates you entered do not match any known sector in the HopeLink database.
      </p>
      <Link 
        to="/dashboard" 
        className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-lg active:scale-95"
      >
        <FaHome className="text-lg" /> Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;