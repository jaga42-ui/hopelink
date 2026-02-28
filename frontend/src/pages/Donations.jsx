import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import imageCompression from "browser-image-compression"; // 👉 ADDED COMPRESSION LIBRARY
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaBoxOpen,
  FaUpload,
  FaSpinner,
  FaLeaf,
  FaBook,
  FaTags,
  FaClock,
  FaCalendarAlt,
  FaLocationArrow,
  FaHamburger,
  FaTshirt,
  FaCube,
  FaHandHoldingHeart,
} from "react-icons/fa";
import toast from "react-hot-toast";

import api from "../utils/api";

const Donations = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    listingType: user?.activeRole === "donor" ? "donation" : "request",
    category: "food",
    title: "",
    description: "",
    quantity: "",
    addressText: user?.addressText || "",
    lat: null,
    lng: null,
    pickupTime: "",
    condition: "New",
    foodType: "Veg",
    expiryDate: "",
    bookAuthor: "",
    image: null,
  });

  const [suggestions, setSuggestions] = useState([]);
  const typingTimeoutRef = useRef(null);

  // 👉 SOLID DARK THEME VARIABLES
  const isRequest = formData.listingType === "request";
  const themeAccent = isRequest ? "text-blue-400" : "text-teal-400";
  const themeBg = isRequest ? "bg-blue-600" : "bg-teal-600";
  const themeHover = isRequest ? "hover:bg-blue-500" : "hover:bg-teal-500";
  const themeFocusBorder = isRequest
    ? "focus:border-blue-500"
    : "focus:border-teal-500";
  const themeContainerBorder = isRequest
    ? "border-blue-900/50"
    : "border-teal-900/50";

  const handleLocationType = (e) => {
    const val = e.target.value;

    setFormData((prev) => ({
      ...prev,
      addressText: val,
      lat: null,
      lng: null,
    }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (val.length > 2) {
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          const { data } = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=4&email=hopelink.dev@example.com`,
          );
          setSuggestions(data);
        } catch (error) {
          console.error("Autocomplete failed");
        }
      }, 600);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (locationObj) => {
    const cleanName = locationObj.display_name.split(",")[0];
    setFormData((prev) => ({
      ...prev,
      addressText: cleanName,
      lat: locationObj.lat,
      lng: locationObj.lon,
    }));
    setSuggestions([]);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error("GPS not supported");

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=hopelink.dev@example.com`,
          );
          const cityString =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.state ||
            "Unknown Location";

          setFormData((prev) => ({
            ...prev,
            addressText: cityString,
            lat: latitude,
            lng: longitude,
          }));
          toast.success(`Location locked: ${cityString} 📍`);
        } catch (error) {
          toast.error("Could not resolve location");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error("Please allow location permissions.");
      },
      { enableHighAccuracy: true },
    );
  };

  // 👉 THE FIX: Added Image Compression Engine!
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Show instant UI preview so the app feels lightning fast
      setImagePreview(URL.createObjectURL(file));

      // 2. Shrink it in the background before sending to the database
      try {
        const options = {
          maxSizeMB: 0.3, // Compresses 5MB photos down to ~300KB
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setFormData({ ...formData, image: compressedFile });
      } catch (error) {
        console.error("Compression Error:", error);
        // If compression fails, just fallback to the original file
        setFormData({ ...formData, image: file });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.addressText) {
      return toast.error("Please fill in all required fields.");
    }

    if (!formData.lat || !formData.lng) {
      return toast.error(
        "Please select a valid location from the dropdown or use GPS.",
      );
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) submitData.append(key, formData[key]);
      });

      await api.post("/donations", submitData);

      toast.success(
        formData.listingType === "donation"
          ? "Item posted for donation! 🚀"
          : "Request broadcasted! 📡",
      );
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    {
      id: "food",
      label: "Food",
      icon: <FaHamburger />,
      color: "hover:bg-slate-800 hover:border-orange-500",
      active:
        "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/50",
    },
    {
      id: "clothes",
      label: "Clothes",
      icon: <FaTshirt />,
      color: "hover:bg-slate-800 hover:border-pink-500",
      active:
        "bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/50",
    },
    {
      id: "book",
      label: "Book",
      icon: <FaBook />,
      color: "hover:bg-slate-800 hover:border-blue-500",
      active:
        "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50",
    },
    {
      id: "general",
      label: "General",
      icon: <FaCube />,
      color: "hover:bg-slate-800 hover:border-teal-500",
      active:
        "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/50",
    },
  ];

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 pb-32 md:pb-24 relative text-white min-h-screen">
        <header className="mb-6 md:mb-8 text-center pt-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-3xl md:text-4xl text-slate-300 mx-auto mb-4 shadow-xl">
            {formData.listingType === "donation" ? (
              <FaHandHoldingHeart className="text-teal-400" />
            ) : (
              <FaBoxOpen className="text-blue-400" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            CREATE <span className={themeAccent}>LISTING.</span>
          </h1>
          <p className="text-slate-400 text-[10px] md:text-sm font-bold mt-2 tracking-widest uppercase md:normal-case">
            Share details to make an impact.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* SECTION 1: Listing Type Toggle */}
          <div className="bg-slate-900 p-1.5 md:p-2 rounded-2xl border border-slate-800 flex shadow-inner">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, listingType: "donation" })
              }
              className={`flex-1 py-3 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${formData.listingType === "donation" ? "bg-teal-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              I am Donating
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, listingType: "request" })
              }
              className={`flex-1 py-3 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${formData.listingType === "request" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              I am Requesting
            </button>
          </div>

          {/* SECTION 2: Interactive Category Cards */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">
              1. Select Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`cursor-pointer flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 active:scale-95 ${formData.category === cat.id ? cat.active : `bg-slate-950 border-slate-800 text-slate-400 ${cat.color}`}`}
                >
                  <div className="text-2xl md:text-3xl mb-2">{cat.icon}</div>
                  <span className="font-bold text-[10px] md:text-xs tracking-wider uppercase">
                    {cat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN FORM WRAPPER */}
          <div
            className={`bg-slate-900 border rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 shadow-xl space-y-6 md:space-y-8 transition-colors duration-500 ${themeContainerBorder}`}
          >
            {/* SECTION 3: Main Details */}
            <div className="space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 block">
                    Item Title *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 10 Fresh Apples..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold placeholder-slate-500 outline-none transition-all shadow-inner ${themeFocusBorder}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 block">
                    Quantity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 kgs"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold placeholder-slate-500 outline-none transition-all shadow-inner ${themeFocusBorder}`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 block">
                  Description *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe the item, specifics..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm placeholder-slate-500 outline-none transition-all resize-none shadow-inner ${themeFocusBorder}`}
                ></textarea>
              </div>
            </div>

            {/* SECTION 4: Category Specific Data */}
            <div className="bg-slate-950 p-5 md:p-6 rounded-3xl border border-slate-800 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {formData.category === "food" && (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 flex items-center gap-2">
                      <FaLeaf className={themeAccent} /> Food Type
                    </label>
                    <select
                      value={formData.foodType}
                      onChange={(e) =>
                        setFormData({ ...formData, foodType: e.target.value })
                      }
                      className={`w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none cursor-pointer appearance-none ${themeFocusBorder}`}
                    >
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 flex items-center gap-2">
                      <FaCalendarAlt className={themeAccent} /> Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        setFormData({ ...formData, expiryDate: e.target.value })
                      }
                      className={`w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none [color-scheme:dark] ${themeFocusBorder}`}
                    />
                  </div>
                </>
              )}

              {formData.category === "book" && (
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 flex items-center gap-2">
                    <FaBook className={themeAccent} /> Author
                  </label>
                  <input
                    type="text"
                    placeholder="Author name"
                    value={formData.bookAuthor}
                    onChange={(e) =>
                      setFormData({ ...formData, bookAuthor: e.target.value })
                    }
                    className={`w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none placeholder-slate-500 ${themeFocusBorder}`}
                  />
                </div>
              )}

              {(formData.category === "clothes" ||
                formData.category === "book" ||
                formData.category === "general") && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 flex items-center gap-2">
                    <FaTags className={themeAccent} /> Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                    className={`w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none cursor-pointer appearance-none ${themeFocusBorder}`}
                  >
                    <option value="New">Brand New</option>
                    <option value="Good">Gently Used</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 flex items-center gap-2">
                  <FaClock className={themeAccent} /> Preferred Time
                </label>
                <input
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) =>
                    setFormData({ ...formData, pickupTime: e.target.value })
                  }
                  className={`w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-white text-base md:text-sm font-bold outline-none cursor-pointer [color-scheme:dark] ${themeFocusBorder}`}
                />
              </div>
            </div>

            {/* SECTION 5: Location & Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-end">
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 block">
                  Location *
                </label>
                <div className="flex gap-2">
                  <input
                    required
                    type="text"
                    placeholder="Use GPS..."
                    value={formData.addressText}
                    onChange={handleLocationType}
                    className={`flex-1 w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-white text-base md:text-sm font-bold placeholder-slate-500 outline-none transition-all shadow-inner ${themeFocusBorder}`}
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isFetchingLocation}
                    className="px-4 md:px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    {isFetchingLocation ? (
                      <FaSpinner className="animate-spin text-lg" />
                    ) : (
                      <FaLocationArrow className="text-lg" />
                    )}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute z-[100] w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-y-auto max-h-48 shadow-2xl">
                    {suggestions.map((s, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectSuggestion(s)}
                        className="px-5 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0 truncate"
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 md:ml-4 mb-1.5 block">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current.click()}
                  className={`w-full h-[120px] md:h-[58px] bg-slate-950 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 cursor-pointer hover:bg-slate-800 transition-all text-slate-400 overflow-hidden relative group shadow-inner ${themeFocusBorder.replace("focus:", "hover:")}`}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                      />
                      <span className="relative z-10 font-bold text-[10px] md:text-xs uppercase tracking-widest text-white drop-shadow-md flex flex-col md:flex-row items-center gap-1 md:gap-2">
                        <FaUpload /> Change Image
                      </span>
                    </>
                  ) : (
                    <>
                      <FaUpload
                        className={`text-2xl md:text-lg transition-colors group-hover:${themeAccent}`}
                      />{" "}
                      <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-center mt-1 md:mt-0">
                        Select Image
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-4 py-4 md:py-5 rounded-2xl font-black text-white uppercase tracking-[0.1em] md:tracking-[0.2em] text-xs md:text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 md:gap-3 ${themeBg} ${themeHover} ${isRequest ? "shadow-blue-900/50" : "shadow-teal-900/50"}`}
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin text-xl" />
              ) : (
                <>
                  {formData.listingType === "donation" ? (
                    <FaHandHoldingHeart className="text-lg" />
                  ) : (
                    <FaBoxOpen className="text-lg" />
                  )}
                  {formData.listingType === "donation"
                    ? "Publish Donation"
                    : "Broadcast Request"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Donations;
