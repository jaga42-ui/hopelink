// Developed by guruprasad and team
import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUpload, FaSpinner, FaLocationArrow, FaBoxOpen, FaCalendarAlt,
  FaLeaf, FaClock, FaTags, FaInfoCircle, FaBook, FaHandHoldingHeart, FaSearch,
} from "react-icons/fa";
import toast from "react-hot-toast";

import api from "../utils/api";

const CreateDonation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    listingType: user?.activeRole === "receiver" ? "request" : "donation",
    category: "food", title: "", description: "", quantity: "", addressText: user?.addressText || "",
    condition: "Gently Used", foodType: "Veg", expiryDate: "", pickupTime: "", bookAuthor: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const isRequest = formData.listingType === "request";
  const themeAccent = isRequest ? "text-dark-raspberry" : "text-blazing-flame";
  const themeBg = isRequest ? "bg-dark-raspberry hover:bg-[#850e53]" : "bg-blazing-flame hover:bg-[#e03a12]";
  const themeFocusBorder = isRequest ? "focus:border-dark-raspberry" : "focus:border-blazing-flame";

  // 👉 MAPBOX REVERSE GEOCODING (GPS)
  const handleGetLocation = async () => {
    if (!navigator.geolocation) return toast.error("Geolocation is not supported.");
    setIsFetchingLocation(true);
    const toastId = toast.loading("Locking onto GPS via Mapbox...", { style: { background: "#ffffff", color: "#29524a", fontWeight: "bold" } });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) throw new Error("Mapbox token missing");

          const { data } = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`);
          
          if (data && data.features && data.features.length > 0) {
            const cityString = data.features[0].place_name.split(",")[0];
            setFormData((prev) => ({ ...prev, addressText: cityString, lat: latitude, lng: longitude }));
            toast.success(`Coordinates locked: ${cityString}`, { id: toastId });
          } else { throw new Error("No location found"); }
        } catch { toast.error("Could not resolve address via Mapbox.", { id: toastId }); } finally { setIsFetchingLocation(false); }
      },
      () => { setIsFetchingLocation(false); toast.error("Failed to acquire location.", { id: toastId }); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  // 👉 MAPBOX AUTOCOMPLETE
  const handleLocationType = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, addressText: val, lat: null, lng: null }));
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (val.length > 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) return;
          
          const { data } = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${apiKey}&autocomplete=true&limit=5&country=in`);
          
          if (data && data.features) {
            const formattedSuggestions = data.features.map(f => ({
              display_name: f.place_name,
              lat: f.center[1], 
              lon: f.center[0]
            }));
            setSuggestions(formattedSuggestions);
          } else { setSuggestions([]); }
        } catch (error) { console.error("Mapbox Autocomplete failed"); }
      }, 600);
      setTypingTimeout(timeoutId);
    } else { setSuggestions([]); }
  };

  const handleSelectSuggestion = (locationObj) => {
    const cleanName = locationObj.display_name.split(",")[0];
    setFormData((prev) => ({ ...prev, addressText: cleanName, lat: locationObj.lat, lng: locationObj.lon }));
    setSuggestions([]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isRequest && !imageFile) return toast.error("Please upload an image of the item you are donating.");
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
      if (imageFile) submitData.append("image", imageFile);

      if (formData.category === "food" && !isRequest && !formData.expiryDate) {
        setIsSubmitting(false); return toast.error("Please provide an expiry/consume-by date for food safety.");
      }

      await api.post("/donations", submitData);
      toast.success(isRequest ? "Request posted successfully!" : "Donation listed successfully!");
      navigate("/dashboard");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to post listing"); } finally { setIsSubmitting(false); }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 pb-32 min-h-screen text-pine-teal">
        <header className="mb-8 pt-4 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-pine-teal tracking-tight uppercase transition-colors duration-500">
              {isRequest ? "Request An " : "List An "} <span className={themeAccent}>Item.</span>
            </h1>
            <p className="text-dusty-lavender font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] mt-2">
              {isRequest ? "Ask the Sahayam community for help" : "Provide details to help the community"}
            </p>
          </div>
          <div className="flex bg-white/50 backdrop-blur-md border border-dusty-lavender/30 rounded-full p-1 shadow-sm relative overflow-hidden w-full md:w-auto">
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out ${themeBg}`} style={{ left: !isRequest ? "4px" : "calc(50%)" }}></div>
            <button type="button" onClick={() => setFormData({ ...formData, listingType: "donation" })} className={`relative z-10 flex-1 px-2 sm:px-6 py-3.5 md:py-3 font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors ${!isRequest ? "text-white" : "text-dusty-lavender hover:text-blazing-flame"}`}>I Want To Donate</button>
            <button type="button" onClick={() => setFormData({ ...formData, listingType: "request" })} className={`relative z-10 flex-1 px-2 sm:px-6 py-3.5 md:py-3 font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors ${isRequest ? "text-white" : "text-dusty-lavender hover:text-dark-raspberry"}`}>I Need An Item</button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className={`bg-white/70 backdrop-blur-lg border rounded-3xl md:rounded-[2.5rem] p-5 md:p-10 shadow-[0_20px_40px_rgba(41,82,74,0.08)] space-y-8 transition-colors duration-500 border-white`}>
          <div className="space-y-5 md:space-y-6">
            <h3 className="text-pine-teal text-sm md:text-base font-bold flex items-center gap-2 border-b border-dusty-lavender/20 pb-3">
              <FaInfoCircle className={themeAccent} /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors appearance-none cursor-pointer focus:bg-white ${themeFocusBorder}`}>
                  <option value="food">🍔 Food & Groceries</option><option value="clothes">👕 Clothes & Apparel</option><option value="book">📘 Books & Education</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Title</label>
                <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder={isRequest ? "e.g. Need Class 10 Math Textbook" : "e.g. Fresh Bread & Apples"} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors placeholder-dusty-lavender/70 focus:bg-white ${themeFocusBorder}`} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Description</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={isRequest ? "Why do you need it? Any specific details?" : "Describe the item details..."} rows="3" className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base outline-none transition-colors resize-none placeholder-dusty-lavender/70 focus:bg-white ${themeFocusBorder}`}></textarea>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Quantity</label>
                <input required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="e.g. 5 Servings / 2 Books" className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors placeholder-dusty-lavender/70 focus:bg-white h-auto md:h-[calc(100%-24px)] ${themeFocusBorder}`} />
              </div>
            </div>
          </div>

          <div className={`border rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-5 md:space-y-6 transition-colors duration-500 bg-white/50 border-white shadow-sm`}>
            <h3 className="text-pine-teal text-sm md:text-base font-bold flex items-center gap-2 border-b border-dusty-lavender/20 pb-3">
              <FaTags className={themeAccent} /> Specific Details
            </h3>
            <AnimatePresence mode="wait">
              {formData.category === "food" ? (
                <motion.div key="food" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 overflow-hidden">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaLeaf /> Diet Type</label>
                    <select value={formData.foodType} onChange={(e) => setFormData({ ...formData, foodType: e.target.value })} className={`w-full bg-white border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors appearance-none cursor-pointer ${themeFocusBorder}`}>
                      <option value="Veg">Vegetarian</option><option value="Non-Veg">Non-Vegetarian</option><option value="Vegan">Vegan</option><option value="Packaged">Packaged/Sealed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaCalendarAlt /> {isRequest ? "Latest Date Needed" : "Best Before / Expiry"}</label>
                    <input type="date" required={!isRequest && formData.category === "food"} value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className={`w-full bg-white border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors ${themeFocusBorder}`} />
                  </div>
                </motion.div>
              ) : formData.category === "book" ? (
                <motion.div key="book" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 overflow-hidden">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaBook /> Author / Publisher</label>
                    <input required value={formData.bookAuthor} onChange={(e) => setFormData({ ...formData, bookAuthor: e.target.value })} placeholder="e.g. R.S. Aggarwal" className={`w-full bg-white border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors ${themeFocusBorder}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaTags /> Condition {isRequest ? "Accepted" : ""}</label>
                    <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className={`w-full bg-white border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors appearance-none cursor-pointer ${themeFocusBorder}`}>
                      <option value="New">Brand New</option><option value="Like New">Like New</option><option value="Gently Used">Gently Used / Marked</option>{isRequest && <option value="Any">Any Condition is Fine</option>}
                    </select>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="clothes" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaTags /> Item Condition</label>
                  <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className={`w-full bg-white border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors appearance-none cursor-pointer ${themeFocusBorder}`}>
                    <option value="New">Brand New / Unused</option><option value="Like New">Like New</option><option value="Gently Used">Gently Used</option>{isRequest ? <option value="Any">Any Condition is Fine</option> : <option value="Worn/Old">Worn / Needs Repair</option>}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-5 md:space-y-6">
            <h3 className="text-pine-teal text-sm md:text-base font-bold flex items-center gap-2 border-b border-dusty-lavender/20 pb-3">
              <FaLocationArrow className={themeAccent} /> Logistics & Media
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-end">
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Your Location</label>
                <div className="flex gap-2">
                  <input required value={formData.addressText} onChange={handleLocationType} placeholder="Type city or use GPS..." className={`flex-1 w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold placeholder-dusty-lavender/70 outline-none transition-colors focus:bg-white ${themeFocusBorder}`} />
                  <button type="button" onClick={handleGetLocation} disabled={isFetchingLocation} className={`px-4 md:px-5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center border bg-white text-blazing-flame hover:bg-pearl-beige border-dusty-lavender/40 shadow-sm`} title="Use GPS">
                    {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute z-[100] w-full mt-2 bg-white border border-dusty-lavender/30 rounded-xl overflow-y-auto max-h-48 shadow-2xl">
                    {suggestions.map((s, index) => (<div key={index} onClick={() => handleSelectSuggestion(s)} className="px-5 py-3 text-sm text-pine-teal hover:text-white hover:bg-pine-teal cursor-pointer border-b border-dusty-lavender/20 last:border-0 truncate">{s.display_name}</div>))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 flex items-center gap-2"><FaClock /> Preferred {isRequest ? "Meetup" : "Pickup"} Time</label>
                <input required value={formData.pickupTime} onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })} placeholder="e.g. After 6 PM today, Weekends only" className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-pine-teal text-base font-bold outline-none transition-colors focus:bg-white ${themeFocusBorder}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Reference Image {isRequest && "(Optional)"}</label>
                <div className={`relative w-full h-[180px] md:h-[calc(100%-24px)] bg-white border-2 border-dashed border-dusty-lavender/50 rounded-2xl flex flex-col items-center justify-center transition-colors overflow-hidden group cursor-pointer hover:bg-pearl-beige/50 ${isRequest ? "hover:border-dark-raspberry" : "hover:border-blazing-flame"}`}>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="text-center p-4">
                      <FaUpload className={`text-2xl md:text-3xl text-dusty-lavender mx-auto mb-2 md:mb-3 transition-colors group-hover:${themeAccent}`} />
                      <p className="text-pine-teal text-xs md:text-sm font-bold">{isRequest ? "Upload reference photo" : "Upload an image"}</p>
                      <p className="text-dusty-lavender text-[9px] md:text-[10px] uppercase tracking-widest mt-1 px-4">{isRequest ? "Helps people know what you need" : "Clear photos get claimed faster"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full mt-8 py-4 md:py-5 rounded-2xl font-black text-white uppercase tracking-[0.1em] md:tracking-[0.2em] text-xs md:text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 md:gap-3 ${themeBg} ${isRequest ? "shadow-dark-raspberry/30" : "shadow-blazing-flame/30"}`}>
            {isSubmitting ? <FaSpinner className="animate-spin text-xl" /> : isRequest ? <><FaSearch className="text-lg" /> Broadcast Request</> : <><FaHandHoldingHeart className="text-lg" /> Publish Donation</>}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default CreateDonation;