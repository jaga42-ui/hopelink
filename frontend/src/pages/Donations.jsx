import { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 👉 Kept strictly for the external OpenStreetMap API
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  FaBoxOpen, FaUpload, FaSpinner, FaLeaf, FaBook, 
  FaTags, FaClock, FaCalendarAlt, FaLocationArrow, 
  FaHamburger, FaTshirt, FaCube, FaHandHoldingHeart
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
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
    category: 'Food',
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

  // Auto-fetch GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error('GPS not supported by your browser');
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // 👉 Standard axios for the external map API
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`);
          const cityString = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown Location';
          
          setFormData(prev => ({ ...prev, addressText: cityString }));
          toast.success(`Location locked: ${cityString} 📍`);
        } catch (error) { 
          toast.error("Could not resolve your city name."); 
        } finally { 
          setIsFetchingLocation(false); 
        }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error('Please allow location permissions in your browser.');
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

      // 👉 CLEAN REQUEST: No localhost, no manual token headers, no manual multipart headers!
      await api.post('/donations', submitData);
      
      toast.success(formData.listingType === 'donation' ? "Item posted for donation! 🚀" : "Request broadcasted! 📡");
      navigate('/dashboard'); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'Food', icon: <FaHamburger />, color: 'hover:border-orange-500 hover:text-orange-500', active: 'bg-orange-500/20 border-orange-500 text-orange-400' },
    { id: 'Clothes', icon: <FaTshirt />, color: 'hover:border-pink-500 hover:text-pink-500', active: 'bg-pink-500/20 border-pink-500 text-pink-400' },
    { id: 'Book', icon: <FaBook />, color: 'hover:border-blue-500 hover:text-blue-500', active: 'bg-blue-500/20 border-blue-500 text-blue-400' },
    { id: 'General', icon: <FaCube />, color: 'hover:border-teal-500 hover:text-teal-500', active: 'bg-teal-500/20 border-teal-500 text-teal-400' }
  ];

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto pb-24 relative">
        
        <header className="mb-8 text-center">
          <div className="w-20 h-20 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-4xl text-teal-400 mx-auto mb-4 shadow-xl">
            {formData.listingType === 'donation' ? <FaHandHoldingHeart /> : <FaBoxOpen />}
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
            CREATE <span className={formData.listingType === 'donation' ? 'text-teal-400' : 'text-blue-400'}>LISTING.</span>
          </h1>
          <p className="text-white/50 text-sm font-bold mt-2">Share details with the community to make an impact.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* SECTION 1: Listing Type Toggle */}
          <div className="bg-[#111] p-2 rounded-2xl border border-white/10 flex shadow-lg">
            <button 
              type="button" 
              onClick={() => setFormData({...formData, listingType: 'donation'})}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.listingType === 'donation' ? 'bg-teal-500 text-white shadow-md' : 'text-white/40 hover:text-white'}`}
            >
              I am Donating
            </button>
            <button 
              type="button" 
              onClick={() => setFormData({...formData, listingType: 'request'})}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.listingType === 'request' ? 'bg-blue-600 text-white shadow-md' : 'text-white/40 hover:text-white'}`}
            >
              I am Requesting
            </button>
          </div>

          {/* SECTION 2: Interactive Category Cards */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-white/50 ml-2 mb-3 block">1. Select Category</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => setFormData({...formData, category: cat.id})}
                  className={`cursor-pointer flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 ${formData.category === cat.id ? cat.active : `bg-[#111] border-white/5 text-white/40 ${cat.color}`}`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <span className="font-bold text-xs tracking-wider">{cat.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Main Details */}
          <div className="bg-[#111] p-6 rounded-[2rem] border border-white/10 shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 block">Item Title *</label>
                <input required type="text" placeholder="e.g. 10 Fresh Apples, Winter Jacket..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold placeholder-white/20 focus:border-teal-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 block">Quantity / Size</label>
                <input type="text" placeholder="e.g. 5 kgs, Size M" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold placeholder-white/20 focus:border-teal-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 block">Description *</label>
              <textarea required rows="3" placeholder="Describe the item, location specifics, or reason for requesting..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm placeholder-white/20 focus:border-teal-500 outline-none transition-all resize-none"></textarea>
            </div>
          </div>

          {/* SECTION 4: Category Specific Data */}
          <div className="bg-[#111] p-6 rounded-[2rem] border border-white/10 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.category === 'Food' && (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 flex items-center gap-2"><FaLeaf /> Food Type</label>
                  <select value={formData.foodType} onChange={e => setFormData({...formData, foodType: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500 cursor-pointer appearance-none">
                    <option value="Veg">Vegetarian</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 flex items-center gap-2"><FaCalendarAlt /> Expiry/Best Before</label>
                  <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500" />
                </div>
              </>
            )}

            {formData.category === 'Book' && (
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 flex items-center gap-2"><FaBook /> Author Name</label>
                <input type="text" placeholder="Author name" value={formData.bookAuthor} onChange={e => setFormData({...formData, bookAuthor: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500 placeholder-white/20" />
              </div>
            )}

            {(formData.category === 'Clothes' || formData.category === 'Book' || formData.category === 'General') && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 flex items-center gap-2"><FaTags /> Condition</label>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500 cursor-pointer appearance-none">
                  <option value="New">Brand New</option>
                  <option value="Good">Gently Used</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 flex items-center gap-2"><FaClock /> Preferred Pickup Time</label>
              <input type="text" placeholder="e.g. 5 PM - 7 PM" value={formData.pickupTime} onChange={e => setFormData({...formData, pickupTime: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500 placeholder-white/20" />
            </div>
          </div>

          {/* SECTION 5: Location & Image */}
          <div className="bg-[#111] p-6 rounded-[2rem] border border-white/10 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 block">Location *</label>
              <div className="flex gap-2">
                <input required type="text" placeholder="Type city or use GPS..." value={formData.addressText} onChange={e => setFormData({...formData, addressText: e.target.value})} className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder-white/20 focus:border-teal-500 outline-none transition-all" />
                <button 
                  type="button" 
                  onClick={handleGetLocation} 
                  disabled={isFetchingLocation} 
                  className="px-5 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-2xl hover:bg-teal-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center shadow-lg" 
                  title="Detect My Location"
                >
                  {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-2 block">Upload Image</label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
              <div 
                onClick={() => fileInputRef.current.click()} 
                className="w-full h-[58px] bg-black/50 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-white/5 hover:border-teal-500 transition-all text-white/60 hover:text-white overflow-hidden relative group"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                    <span className="relative z-10 font-bold text-xs uppercase tracking-widest text-white drop-shadow-md flex items-center gap-2"><FaUpload /> Change Image</span>
                  </>
                ) : (
                  <><FaUpload className="text-lg" /> <span className="font-bold text-xs uppercase tracking-widest">Select Image</span></>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`w-full py-5 rounded-2xl font-black text-white uppercase tracking-widest text-sm transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] ${formData.listingType === 'donation' ? 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'} disabled:opacity-50 disabled:active:scale-100 mt-4`}
          >
            {isSubmitting ? <FaSpinner className="animate-spin text-2xl" /> : (
              <>
                {formData.listingType === 'donation' ? <FaHandHoldingHeart className="text-xl" /> : <FaBoxOpen className="text-xl" />} 
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