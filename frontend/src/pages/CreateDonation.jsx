import { useState, useContext } from 'react';
import axios from 'axios'; // We keep this JUST for the external Map API
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUpload, FaSpinner, FaLocationArrow, FaBoxOpen, 
  FaCalendarAlt, FaLeaf, FaClock, FaTags, FaInfoCircle, FaBook, FaHandHoldingHeart, FaSearch
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR API MANAGER
import api from '../utils/api';

const CreateDonation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    listingType: user?.activeRole === 'receiver' ? 'request' : 'donation', 
    category: 'food',
    title: '',
    description: '',
    quantity: '',
    addressText: user?.addressText || '',
    condition: 'Gently Used',
    foodType: 'Veg',
    expiryDate: '',
    pickupTime: '',
    bookAuthor: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const isRequest = formData.listingType === 'request';
  const themeAccent = isRequest ? 'text-blue-400' : 'text-teal-400';
  const themeBg = isRequest ? 'bg-blue-500' : 'bg-teal-500';
  const themeHover = isRequest ? 'hover:bg-blue-400' : 'hover:bg-teal-400';
  const themeBorder = isRequest ? 'border-blue-500' : 'border-teal-500';

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser'); return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // We keep standard axios here because it's an external third-party API!
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`);
          const addressInfo = data.address;
          const cityString = addressInfo.city || addressInfo.town || addressInfo.village || addressInfo.state || 'Unknown Location';
          
          setFormData(prev => ({ ...prev, addressText: cityString }));
          toast.success(`Location locked: ${cityString}`);
        } catch (error) { toast.error("Could not resolve location address"); } 
        finally { setIsFetchingLocation(false); }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error('Please allow location permissions');
      }
    );
  };

  const handleLocationType = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, addressText: val }));

    if (typingTimeout) clearTimeout(typingTimeout); 

    if (val.length > 2) {
      const newTimer = setTimeout(async () => {
        try {
          // We keep standard axios here because it's an external third-party API!
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&limit=4&email=hopelink.dev@example.com`);
          setSuggestions(data);
        } catch (error) { console.error("Autocomplete failed"); }
      }, 600); 
      setTypingTimeout(newTimer);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (locationName) => {
    const cleanName = locationName.split(',')[0]; 
    setFormData(prev => ({ ...prev, addressText: cleanName }));
    setSuggestions([]); 
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If it's a donation, an image is required. If it's a request, it's optional.
    if (!isRequest && !imageFile) return toast.error("Please upload an image of the item you are donating.");

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      
      submitData.append('listingType', formData.listingType);
      submitData.append('category', formData.category);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('quantity', formData.quantity);
      submitData.append('addressText', formData.addressText);
      submitData.append('pickupTime', formData.pickupTime);
      if (imageFile) submitData.append('image', imageFile);

      if (formData.category === 'food') {
        if (!isRequest && !formData.expiryDate) {
          setIsSubmitting(false);
          return toast.error("Please provide an expiry/consume-by date for food safety.");
        }
        submitData.append('expiryDate', formData.expiryDate);
        submitData.append('foodType', formData.foodType);
      } else if (formData.category === 'clothes') {
        submitData.append('condition', formData.condition);
      } else if (formData.category === 'book') {
        submitData.append('bookAuthor', formData.bookAuthor);
        submitData.append('condition', formData.condition);
      }

      // 👉 CLEAN REQUEST: Submitting form data to your backend! No localhost, no manual auth headers.
      await api.post('/donations', submitData);
      
      toast.success(isRequest ? "Request posted successfully!" : "Donation listed successfully!");
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-24">
        
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter transition-colors duration-500">
              {isRequest ? 'REQUEST AN ' : 'LIST AN '}<span className={themeAccent}>ITEM.</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">
              {isRequest ? 'Ask the community for help' : 'Provide details to help the community'}
            </p>
          </div>

          <div className="flex bg-[#111] border border-white/10 rounded-full p-1.5 shadow-xl relative overflow-hidden">
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full transition-all duration-300 ease-out ${themeBg}`}
              style={{ left: !isRequest ? '3px' : 'calc(50% + 3px)' }}
            ></div>
            <button 
              type="button" 
              onClick={() => setFormData({...formData, listingType: 'donation'})} 
              className={`relative z-10 flex-1 px-6 py-3 font-black text-xs uppercase tracking-widest transition-colors ${!isRequest ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
            >
              I Want To Donate
            </button>
            <button 
              type="button" 
              onClick={() => setFormData({...formData, listingType: 'request'})} 
              className={`relative z-10 flex-1 px-6 py-3 font-black text-xs uppercase tracking-widest transition-colors ${isRequest ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
            >
              I Need An Item
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className={`bg-[#111] border rounded-[2rem] p-6 md:p-10 shadow-2xl space-y-8 transition-colors duration-500 ${isRequest ? 'border-blue-500/20' : 'border-teal-500/20'}`}>
          
          <div className="space-y-6">
            <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/10 pb-3 transition-colors duration-500">
              <FaInfoCircle className={themeAccent} /> Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors appearance-none cursor-pointer focus:${themeBorder}`}>
                  <option value="food">🍱 Food & Groceries</option>
                  <option value="clothes">👕 Clothes & Apparel</option>
                  <option value="book">📚 Books & Education</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder={isRequest ? "e.g. Need Class 10 Math Textbook" : "e.g. Fresh Bread & Apples"} className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors focus:${themeBorder}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder={isRequest ? "Why do you need it? Any specific details?" : "Describe the item details..."} rows="3" className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none transition-colors resize-none focus:${themeBorder}`}></textarea>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Quantity</label>
                <input required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="e.g. 5 Servings / 2 Books" className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors h-[calc(100%-24px)] focus:${themeBorder}`} />
              </div>
            </div>
          </div>

          <div className={`border rounded-3xl p-6 space-y-6 transition-colors duration-500 ${isRequest ? 'bg-blue-500/5 border-blue-500/20' : 'bg-teal-500/5 border-teal-500/20'}`}>
            <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <FaTags className={themeAccent} /> Specific Details
            </h3>

            <AnimatePresence mode="wait">
              {formData.category === 'food' ? (
                <motion.div key="food" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 flex items-center gap-2"><FaLeaf /> Diet Type</label>
                    <select value={formData.foodType} onChange={e => setFormData({...formData, foodType: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors appearance-none cursor-pointer focus:${themeBorder}`}>
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Packaged">Packaged/Sealed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 flex items-center gap-2">
                      <FaCalendarAlt /> {isRequest ? 'Latest Date Needed' : 'Best Before / Expiry'}
                    </label>
                    <input type="date" required={!isRequest && formData.category === 'food'} value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors [color-scheme:dark] focus:${themeBorder}`} />
                  </div>
                </motion.div>
              ) : formData.category === 'book' ? (
                <motion.div key="book" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 flex items-center gap-2"><FaBook /> Author / Publisher</label>
                    <input required value={formData.bookAuthor} onChange={e => setFormData({...formData, bookAuthor: e.target.value})} placeholder="e.g. R.S. Aggarwal" className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors focus:${themeBorder}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 flex items-center gap-2"><FaTags /> Condition {isRequest ? 'Accepted' : ''}</label>
                    <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors appearance-none cursor-pointer focus:${themeBorder}`}>
                      <option value="New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Gently Used">Gently Used / Marked</option>
                      {isRequest && <option value="Any">Any Condition is Fine</option>}
                    </select>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="clothes" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 flex items-center gap-2"><FaTags /> Item Condition</label>
                  <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors appearance-none cursor-pointer focus:${themeBorder}`}>
                    <option value="New">Brand New / Unused</option>
                    <option value="Like New">Like New</option>
                    <option value="Gently Used">Gently Used</option>
                    {isRequest ? <option value="Any">Any Condition is Fine</option> : <option value="Worn/Old">Worn / Needs Repair</option>}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <FaLocationArrow className={themeAccent} /> Logistics & Media
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Your Location</label>
                  <div className="flex gap-2">
                    <input required value={formData.addressText} onChange={handleLocationType} placeholder="Type city or use GPS..." className={`flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors focus:${themeBorder}`} />
                    <button type="button" onClick={handleGetLocation} disabled={isFetchingLocation} className={`px-5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center border ${isRequest ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white' : 'bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500 hover:text-white'}`} title="Use GPS">
                      {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                    </button>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                      {suggestions.map((s, index) => (
                        <div key={index} onClick={() => handleSelectSuggestion(s.display_name)} className="px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 truncate">
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 flex items-center gap-2"><FaClock /> Preferred {isRequest ? 'Meetup' : 'Pickup'} Time</label>
                  <input required value={formData.pickupTime} onChange={e => setFormData({...formData, pickupTime: e.target.value})} placeholder="e.g. After 6 PM today, Weekends only" className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-colors focus:${themeBorder}`} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 mb-1 block">Reference Image {isRequest && '(Optional)'}</label>
                <div className={`relative w-full h-[calc(100%-24px)] min-h-[150px] bg-black/40 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center transition-colors overflow-hidden group cursor-pointer ${isRequest ? 'hover:border-blue-500/50' : 'hover:border-teal-500/50'}`}>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="text-center p-4">
                      <FaUpload className={`text-3xl text-white/20 mx-auto mb-3 transition-colors ${isRequest ? 'group-hover:text-blue-400' : 'group-hover:text-teal-400'}`} />
                      <p className="text-white/60 text-sm font-bold">{isRequest ? 'Upload a reference photo' : 'Upload an image'}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
                        {isRequest ? 'Helps people know what you need' : 'Clear photos get claimed faster'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full mt-8 py-5 rounded-2xl font-black text-white uppercase tracking-[0.2em] text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 ${themeBg} ${themeHover} ${isRequest ? 'shadow-blue-500/20' : 'shadow-teal-500/20'}`}>
            {isSubmitting ? <FaSpinner className="animate-spin text-xl" /> : (
              isRequest ? <><FaSearch className="text-lg" /> Broadcast Request</> : <><FaHandHoldingHeart className="text-lg" /> Publish Donation</>
            )}
          </button>
        </form>

      </div>
    </Layout>
  );
};

export default CreateDonation;