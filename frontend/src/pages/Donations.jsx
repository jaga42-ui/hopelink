import { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  FaBoxOpen, FaUpload, FaSpinner, FaLeaf, FaBook, 
  FaTags, FaClock, FaCalendarAlt, FaLocationArrow, 
  FaHamburger, FaTshirt, FaCube, FaHandHoldingHeart
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import api from '../utils/api';

const Donations = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    listingType: user?.activeRole === 'donor' ? 'donation' : 'request',
    category: 'food', // 👉 Fixed: Initialized to lowercase
    title: '',
    description: '',
    quantity: '',
    addressText: user?.addressText || '',
    pickupTime: '',
    condition: 'New', 
    foodType: 'Veg',  
    expiryDate: '',   
    bookAuthor: '',   
    image: null
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error('GPS not supported');
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`);
          const cityString = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown Location';
          
          setFormData(prev => ({ ...prev, addressText: cityString }));
          toast.success(`Location locked: ${cityString} 📍`);
        } catch (error) { toast.error("Could not resolve location"); } 
        finally { setIsFetchingLocation(false); }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error('Please allow location permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.addressText) {
      return toast.error("Please fill in all required fields.");
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) submitData.append(key, formData[key]);
      });

      await api.post('/donations', submitData);
      
      toast.success(formData.listingType === 'donation' ? "Item posted for donation! 🚀" : "Request broadcasted! 📡");
      navigate('/dashboard'); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 👉 Fixed: IDs are lowercase for the DB, Labels are Title Case for the UI
  const categories = [
    { id: 'food', label: 'Food', icon: <FaHamburger />, color: 'hover:bg-orange-500/20 hover:border-orange-400', active: 'bg-orange-500/40 border-orange-300 text-white shadow-lg' },
    { id: 'clothes', label: 'Clothes', icon: <FaTshirt />, color: 'hover:bg-pink-500/20 hover:border-pink-400', active: 'bg-pink-500/40 border-pink-300 text-white shadow-lg' },
    { id: 'book', label: 'Book', icon: <FaBook />, color: 'hover:bg-blue-500/20 hover:border-blue-400', active: 'bg-blue-500/40 border-blue-300 text-white shadow-lg' },
    { id: 'general', label: 'General', icon: <FaCube />, color: 'hover:bg-teal-500/20 hover:border-teal-400', active: 'bg-teal-500/40 border-teal-300 text-white shadow-lg' }
  ];

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 pb-32 md:pb-24 relative text-white min-h-screen">
        
        <header className="mb-6 md:mb-8 text-center pt-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center text-3xl md:text-4xl text-white mx-auto mb-4 shadow-xl backdrop-blur-md">
            {formData.listingType === 'donation' ? <FaHandHoldingHeart /> : <FaBoxOpen />}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-md">
            CREATE <span className={formData.listingType === 'donation' ? 'text-teal-200' : 'text-blue-200'}>LISTING.</span>
          </h1>
          <p className="text-white/80 text-[10px] md:text-sm font-bold mt-2 tracking-widest uppercase md:normal-case drop-shadow-sm">Share details to make an impact.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

          {/* SECTION 1: Listing Type Toggle (Glassmorphism) */}
          <div className="bg-black/20 backdrop-blur-xl p-1.5 md:p-2 rounded-2xl border border-white/20 flex shadow-lg">
            <button 
              type="button" 
              onClick={() => setFormData({...formData, listingType: 'donation'})}
              className={`flex-1 py-3 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${formData.listingType === 'donation' ? 'bg-white text-teal-800 shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              I am Donating
            </button>
            <button 
              type="button" 
              onClick={() => setFormData({...formData, listingType: 'request'})}
              className={`flex-1 py-3 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${formData.listingType === 'request' ? 'bg-white text-blue-800 shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              I am Requesting
            </button>
          </div>

          {/* SECTION 2: Interactive Category Cards */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 mb-2 block drop-shadow-sm">1. Select Category</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categories.map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => setFormData({...formData, category: cat.id})}
                  className={`cursor-pointer flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/20 transition-all duration-300 active:scale-95 backdrop-blur-md ${formData.category === cat.id ? cat.active : `bg-black/20 text-white/70 ${cat.color}`}`}
                >
                  <div className="text-2xl md:text-3xl mb-2 drop-shadow-md">{cat.icon}</div>
                  {/* 👉 Fixed: Render the label for UI, use ID under the hood */}
                  <span className="font-bold text-[10px] md:text-xs tracking-wider uppercase">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Main Details (Glassmorphism) */}
          <div className="bg-white/10 backdrop-blur-xl p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-white/20 shadow-2xl space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 block">Item Title *</label>
                <input required type="text" placeholder="e.g. 10 Fresh Apples..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold placeholder-white/50 focus:border-white outline-none transition-all shadow-inner" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 block">Quantity</label>
                <input type="text" placeholder="e.g. 5 kgs" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold placeholder-white/50 focus:border-white outline-none transition-all shadow-inner" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 block">Description *</label>
              <textarea required rows="3" placeholder="Describe the item, specifics..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm placeholder-white/50 focus:border-white outline-none transition-all resize-none shadow-inner"></textarea>
            </div>
          </div>

          {/* SECTION 4: Category Specific Data */}
          <div className="bg-white/10 backdrop-blur-xl p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-white/20 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {/* 👉 Fixed: Checks for lowercase 'food' */}
            {formData.category === 'food' && (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaLeaf /> Food Type</label>
                  <select value={formData.foodType} onChange={e => setFormData({...formData, foodType: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none focus:border-white cursor-pointer appearance-none shadow-inner">
                    <option value="Veg" className="text-black">Vegetarian</option>
                    <option value="Non-Veg" className="text-black">Non-Vegetarian</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaCalendarAlt /> Expiry</label>
                  <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none focus:border-white [color-scheme:dark] shadow-inner" />
                </div>
              </>
            )}

            {/* 👉 Fixed: Checks for lowercase 'book' */}
            {formData.category === 'book' && (
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaBook /> Author</label>
                <input type="text" placeholder="Author name" value={formData.bookAuthor} onChange={e => setFormData({...formData, bookAuthor: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none focus:border-white placeholder-white/50 shadow-inner" />
              </div>
            )}

            {/* 👉 Fixed: Checks for lowercase options */}
            {(formData.category === 'clothes' || formData.category === 'book' || formData.category === 'general') && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaTags /> Condition</label>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none focus:border-white cursor-pointer appearance-none shadow-inner">
                  <option value="New" className="text-black">Brand New</option>
                  <option value="Good" className="text-black">Gently Used</option>
                  <option value="Fair" className="text-black">Fair</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaClock /> Preferred Time</label>
              <input type="text" placeholder="e.g. 5 PM - 7 PM" value={formData.pickupTime} onChange={e => setFormData({...formData, pickupTime: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none focus:border-white placeholder-white/50 shadow-inner" />
            </div>
          </div>

          {/* SECTION 5: Location & Image */}
          <div className="bg-white/10 backdrop-blur-xl p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-white/20 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-end">
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 block">Location *</label>
              <div className="flex gap-2">
                <input required type="text" placeholder="Use GPS..." value={formData.addressText} onChange={e => setFormData({...formData, addressText: e.target.value})} className="flex-1 w-full bg-black/20 border border-white/20 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-white text-base md:text-sm font-bold placeholder-white/50 focus:border-white outline-none transition-all shadow-inner" />
                <button 
                  type="button" 
                  onClick={handleGetLocation} 
                  disabled={isFetchingLocation} 
                  className="px-4 md:px-5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shrink-0" 
                >
                  {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/80 ml-2 md:ml-4 mb-1.5 block">Upload Image</label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
              <div 
                onClick={() => fileInputRef.current.click()} 
                className="w-full h-[120px] md:h-[58px] bg-black/20 border-2 border-dashed border-white/40 rounded-2xl flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 cursor-pointer hover:bg-white/10 hover:border-white transition-all text-white/80 overflow-hidden relative group shadow-inner"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    <span className="relative z-10 font-bold text-[10px] md:text-xs uppercase tracking-widest text-white drop-shadow-md flex flex-col md:flex-row items-center gap-1 md:gap-2"><FaUpload /> Change Image</span>
                  </>
                ) : (
                  <><FaUpload className="text-2xl md:text-lg" /> <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-center mt-1 md:mt-0">Select Image</span></>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`w-full py-4 md:py-5 rounded-2xl font-black text-teal-900 bg-white uppercase tracking-widest text-xs md:text-sm transition-all shadow-xl flex items-center justify-center gap-2 md:gap-3 hover:bg-gray-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-4 border border-white`}
          >
            {isSubmitting ? <FaSpinner className="animate-spin text-xl text-teal-600" /> : (
              <>
                {formData.listingType === 'donation' ? <FaHandHoldingHeart className="text-lg" /> : <FaBoxOpen className="text-lg" />} 
                {formData.listingType === 'donation' ? 'Publish Donation' : 'Broadcast Request'}
              </>
            )}
          </button>

        </form>
      </div>
    </Layout>
  );
};

export default Donations;