// Developed by guruprasad and team
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaHeartbeat,
  FaMapMarkerAlt,
  FaCommentDots,
  FaSpinner,
  FaTimes,
  FaExclamationTriangle,
  FaTrash,
  FaBoxOpen,
  FaLocationArrow,
  FaCheckCircle,
  FaCheck,
  FaLock,
  FaUsers,
  FaRunning,
  FaHandsHelping,
  FaShareAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import api from "../utils/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace("/api", "")
  : "https://hopelink-api.onrender.com";

const optimizeImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("cloudinary.com"))
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
};

const SkeletonCard = () => (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-dusty-lavender/10 flex flex-col gap-4 animate-pulse h-[350px]">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-pearl-beige rounded-full"></div>
      <div className="flex-1">
        <div className="h-3 w-1/3 bg-pearl-beige rounded-full mb-2"></div>
        <div className="h-2 w-1/4 bg-pearl-beige rounded-full"></div>
      </div>
    </div>
    <div className="w-full h-32 bg-pearl-beige rounded-2xl"></div>
    <div className="space-y-2 mt-2">
      <div className="h-4 w-3/4 bg-pearl-beige rounded-full"></div>
      <div className="h-3 w-full bg-pearl-beige rounded-full"></div>
    </div>
    <div className="mt-auto h-10 w-full bg-pearl-beige rounded-xl"></div>
  </div>
);

const Dashboard = () => {
  const { user, switchRole, socket } = useContext(AuthContext);
  const navigate = useNavigate();

  const [localRole, setLocalRole] = useState(user?.activeRole || "donor");
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responders, setResponders] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showSOS, setShowSOS] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  const isDonor = localRole === "donor";

  const [sosData, setSosData] = useState({
    bloodGroup: "",
    quantity: "",
    hospital: "",
    addressText: "",
    description: "",
    lat: null,
    lng: null,
  });

  const [requestsModal, setRequestsModal] = useState({
    isOpen: false,
    donation: null,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    if (user?.activeRole) setLocalRole(user.activeRole);
  }, [user?.activeRole]);

  useEffect(() => {
    if (!user?.token) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/donations/feed?page=1&limit=12");
        setFeed(data.donations || (Array.isArray(data) ? data : []));
        setHasMore(data.hasMore || false);
      } catch (error) {
        toast.error("Failed to load feed");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (!user || !socket) return;

    socket.on("donor_coming", (data) => {
      setResponders((prev) => [...prev, data]);
      toast.success(`${data.donorName} is en route to help!`);
      setTimeout(
        () =>
          setResponders((prev) =>
            prev.filter((r) => r.blastId !== data.blastId),
          ),
        10000,
      ); // Auto clear responder pill
    });

    socket.on("new_listing", (newDonation) => {
      setFeed((prev) => [newDonation, ...prev]);
    });

    socket.on("listing_updated", (updatedItem) =>
      setFeed((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item)),
      ),
    );

    socket.on("listing_deleted", (deletedId) =>
      setFeed((prev) => prev.filter((item) => item._id !== deletedId)),
    );

    return () => {
      socket.off("donor_coming");
      socket.off("new_listing");
      socket.off("listing_updated");
      socket.off("listing_deleted");
    };
  }, [user, socket]);

  const loadMoreListings = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data } = await api.get(
        `/donations/feed?page=${nextPage}&limit=12`,
      );
      setFeed((prev) => [...prev, ...(data.donations || [])]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (error) {
      toast.error("Failed to fetch more listings.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation)
      return toast.error("Geolocation is not supported.");
    setIsFetchingLocation(true);
    const toastId = toast.loading("Locating...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) throw new Error("Mapbox Token Missing");

          const { data } = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`,
          );
          if (data && data.features && data.features.length > 0) {
            const cityString = data.features[0].place_name.split(",")[0];
            setSosData((prev) => ({
              ...prev,
              addressText: cityString,
              lat: latitude,
              lng: longitude,
            }));
            toast.success(`Location set: ${cityString}`, { id: toastId });
          }
        } catch {
          toast.error("Could not resolve address.", { id: toastId });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error("Failed to acquire location.", { id: toastId });
      },
      { enableHighAccuracy: true },
    );
  };

  const handleLocationType = (e) => {
    const val = e.target.value;
    setSosData((prev) => ({ ...prev, addressText: val, lat: null, lng: null }));
    if (typingTimeout) clearTimeout(typingTimeout);
    if (val.length > 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) return;
          const { data } = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${apiKey}&autocomplete=true&limit=5&country=in`,
          );
          if (data && data.features) {
            setSuggestions(
              data.features.map((f) => ({
                display_name: f.place_name,
                lat: f.center[1],
                lon: f.center[0],
              })),
            );
          }
        } catch (error) {
          console.error("Autocomplete failed");
        }
      }, 600);
      setTypingTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  };

  const handleSOSSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("listingType", "request");
      formData.append("category", "blood");
      formData.append("isEmergency", "true");
      formData.append("bloodGroup", sosData.bloodGroup);
      formData.append("quantity", `${sosData.quantity} Units`);
      formData.append("title", `URGENT: ${sosData.bloodGroup} Needed!`);
      formData.append("description", sosData.description);
      formData.append(
        "addressText",
        `${sosData.hospital}, ${sosData.addressText}`,
      );
      if (sosData.lat) formData.append("lat", sosData.lat);
      if (sosData.lng) formData.append("lng", sosData.lng);

      await api.post("/donations", formData);
      setShowSOS(false);
      setSosData({
        bloodGroup: "",
        quantity: "",
        hospital: "",
        addressText: "",
        description: "",
        lat: null,
        lng: null,
      });
      toast.success("Emergency broadcast deployed!");
    } catch {
      toast.error("Failed to broadcast SOS");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Delete this post?")) {
      try {
        await api.delete(`/donations/${id}`);
        toast.success("Deleted.");
      } catch {
        toast.error("Failed to delete.");
      }
    }
  };

  const handleRequestItem = async (donationId) => {
    try {
      await api.post(`/donations/${donationId}/request`, {});
      toast.success("Response sent!");
    } catch {
      toast.error("Failed to send request.");
    }
  };

  const handleApproveRequest = async (donationId, receiverId) => {
    setApprovingId(receiverId);
    try {
      await api.patch(`/donations/${donationId}/approve`, { receiverId });
      setRequestsModal({ isOpen: false, donation: null });
      setFeed((prev) =>
        prev.map((item) =>
          item._id === donationId
            ? { ...item, status: "pending", receiverId }
            : item,
        ),
      );
      toast.success("Approved!");
    } catch {
      toast.error("Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  const processedFeed = feed.filter(
    (item) =>
      filterCategory === "All" ||
      item.category?.toLowerCase() === filterCategory.toLowerCase(),
  );

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 pb-32 md:pb-24 relative min-h-screen font-sans bg-[#fdfbf7]">
        {/* RESPONDER TOAST (Cleaner, top center) */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {responders.map((res, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-pine-teal text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3 pointer-events-auto"
              >
                <FaRunning className="text-blazing-flame" />
                <span className="text-xs font-bold">
                  {res.donorName} is coming to help!
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* CLEAN HEADER & QUICK ACTIONS */}
        <header className="pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-pine-teal leading-tight">
                Welcome, {user?.name?.split(" ")[0]}.
              </h1>
              <p className="text-dusty-lavender text-sm font-medium mt-1">
                Here is what's happening in your community today.
              </p>
            </div>

            {/* Premium Quick Action Card */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-dusty-lavender/20">
              <button
                onClick={() => navigate("/donations")}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isDonor ? "bg-pine-teal text-white hover:bg-[#1a3630]" : "bg-dark-raspberry text-white hover:bg-[#850e53]"}`}
              >
                {isDonor ? "Post Item" : "Request Item"}
              </button>
              <div className="w-px h-8 bg-dusty-lavender/20"></div>
              <button
                onClick={() => setShowSOS(true)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-blazing-flame hover:bg-blazing-flame/10 transition-all flex items-center gap-2"
              >
                <FaHeartbeat /> SOS
              </button>
            </div>
          </div>
        </header>

        {/* MINIMALIST FILTERS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 mb-6 border-b border-dusty-lavender/10">
          {["All", "Blood", "Food", "Clothes", "Book", "General"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCategory === cat ? "bg-pine-teal text-white" : "bg-white text-dusty-lavender hover:bg-pearl-beige border border-dusty-lavender/20"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* CLEAN FEED GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : processedFeed.length === 0 ? (
          <div className="text-center py-24 text-dusty-lavender">
            <FaBoxOpen className="text-5xl opacity-20 mx-auto mb-4" />
            <p className="font-bold text-sm">
              No active posts found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {processedFeed.map((item) => {
                const isMine = item.donorId?._id === user._id;
                const alreadyReq = item.requestedBy?.some(
                  (r) => r._id === user._id,
                );
                const isApprovedReceiver =
                  item.status === "pending" && item.receiverId === user._id;

                return (
                  <motion.div
                    layout
                    key={item._id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 border ${item.isEmergency ? "border-blazing-flame/30" : "border-dusty-lavender/20"}`}
                  >
                    {/* User Info Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.donorId?.profilePic ||
                            `https://ui-avatars.com/api/?name=${item.donorId?.name}&background=e8dab2&color=29524a`
                          }
                          alt="User"
                          className="w-10 h-10 rounded-full object-cover bg-pearl-beige"
                        />
                        <div>
                          <p className="text-sm font-bold text-pine-teal leading-none">
                            {item.donorId?.name}
                          </p>
                          <p className="text-[10px] text-dusty-lavender font-medium mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {item.isEmergency ? (
                        <span className="bg-blazing-flame/10 text-blazing-flame px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
                          SOS
                        </span>
                      ) : (
                        <span className="bg-pearl-beige text-dusty-lavender px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Image / Graphic Area */}
                    {item.image ? (
                      <div className="w-full h-40 rounded-2xl overflow-hidden bg-pearl-beige shrink-0">
                        <img
                          src={optimizeImageUrl(item.image)}
                          className="w-full h-full object-cover"
                          alt="Item"
                        />
                      </div>
                    ) : item.category === "blood" ? (
                      <div
                        className={`w-full h-32 rounded-2xl flex flex-col items-center justify-center shrink-0 ${item.isEmergency ? "bg-blazing-flame/10 text-blazing-flame" : "bg-dark-raspberry/10 text-dark-raspberry"}`}
                      >
                        <FaHeartbeat className="text-3xl mb-2" />
                        <span className="text-2xl font-black">
                          {item.bloodGroup}
                        </span>
                      </div>
                    ) : null}

                    {/* Content Body */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-base font-black text-pine-teal line-clamp-1 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-dusty-lavender leading-snug line-clamp-2 mb-3 flex-1">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-2 text-pine-teal/70 text-[11px] font-medium mt-auto">
                        <FaMapMarkerAlt />{" "}
                        <span className="truncate">
                          {item.addressText || "Location unspecified"}
                        </span>
                      </div>
                    </div>

                    {/* Minimalist Action Dock */}
                    <div className="pt-4 border-t border-dusty-lavender/10 flex gap-2">
                      {isMine ? (
                        item.status === "fulfilled" ? (
                          <button
                            disabled
                            className="flex-1 py-3 bg-pearl-beige text-dusty-lavender rounded-xl text-xs font-bold"
                          >
                            Fulfilled
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setRequestsModal({
                                  isOpen: true,
                                  donation: item,
                                })
                              }
                              disabled={!item.requestedBy?.length}
                              className={`flex-[2] py-3 rounded-xl text-xs font-bold transition-all ${item.requestedBy?.length > 0 ? "bg-pine-teal/10 text-pine-teal hover:bg-pine-teal hover:text-white" : "bg-pearl-beige text-dusty-lavender cursor-not-allowed"}`}
                            >
                              Review Requests ({item.requestedBy?.length || 0})
                            </button>
                            <button
                              onClick={() => handleDeletePost(item._id)}
                              className="w-12 flex items-center justify-center bg-pearl-beige hover:bg-blazing-flame/10 text-dusty-lavender hover:text-blazing-flame rounded-xl transition-colors"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </>
                        )
                      ) : item.status === "fulfilled" ? (
                        <button
                          disabled
                          className="flex-1 py-3 bg-pearl-beige text-dusty-lavender rounded-xl text-xs font-bold flex justify-center items-center gap-2"
                        >
                          <FaLock /> Closed
                        </button>
                      ) : isApprovedReceiver ? (
                        <button
                          onClick={() =>
                            navigate(`/chat/${item._id}_${user._id}`)
                          }
                          className="flex-1 py-3 bg-dark-raspberry text-white rounded-xl text-xs font-bold hover:bg-[#850e53] transition-colors flex justify-center items-center gap-2"
                        >
                          <FaCommentDots /> Message Donor
                        </button>
                      ) : alreadyReq ? (
                        <button
                          disabled
                          className="flex-1 py-3 bg-pearl-beige text-pine-teal rounded-xl text-xs font-bold flex justify-center items-center gap-2"
                        >
                          <FaCheck /> Requested
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRequestItem(item._id)}
                            className={`flex-[2] py-3 rounded-xl text-xs font-bold text-white transition-colors ${item.isEmergency ? "bg-blazing-flame hover:bg-[#e03a12]" : "bg-pine-teal hover:bg-[#1a3630]"}`}
                          >
                            {item.isEmergency ? "Help Now" : "Request"}
                          </button>
                          <button
                            onClick={() => handleShare(item)}
                            className="w-12 flex items-center justify-center bg-pearl-beige hover:bg-dusty-lavender/20 text-pine-teal rounded-xl transition-colors"
                          >
                            <FaShareAlt className="text-sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={loadMoreListings}
              disabled={loadingMore}
              className="px-6 py-3 bg-white border border-dusty-lavender/30 rounded-full text-xs font-bold text-pine-teal hover:bg-pearl-beige transition-all flex items-center gap-2"
            >
              {loadingMore ? (
                <FaSpinner className="animate-spin" />
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}

        {/* CLEAN SOS MODAL */}
        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/40 backdrop-blur-sm"
                onClick={() => setShowSOS(false)}
              />
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="relative w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3 text-blazing-flame">
                    <div className="w-10 h-10 bg-blazing-flame/10 rounded-full flex items-center justify-center">
                      <FaHeartbeat className="text-xl animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black">SOS Alert</h2>
                  </div>
                  <button
                    onClick={() => setShowSOS(false)}
                    className="p-2 bg-pearl-beige rounded-full text-dusty-lavender hover:text-pine-teal"
                  >
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleSOSSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <select
                      required
                      value={sosData.bloodGroup}
                      onChange={(e) =>
                        setSosData({ ...sosData, bloodGroup: e.target.value })
                      }
                      className="flex-1 bg-pearl-beige/50 border border-dusty-lavender/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blazing-flame"
                    >
                      <option value="" disabled>
                        Blood Group
                      </option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ),
                      )}
                    </select>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Units"
                      value={sosData.quantity}
                      onChange={(e) =>
                        setSosData({ ...sosData, quantity: e.target.value })
                      }
                      className="w-24 bg-pearl-beige/50 border border-dusty-lavender/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blazing-flame"
                    />
                  </div>
                  <input
                    required
                    placeholder="Hospital Name"
                    value={sosData.hospital}
                    onChange={(e) =>
                      setSosData({ ...sosData, hospital: e.target.value })
                    }
                    className="w-full bg-pearl-beige/50 border border-dusty-lavender/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blazing-flame"
                  />

                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        required
                        placeholder="Location/Area"
                        value={sosData.addressText}
                        onChange={handleLocationType}
                        className="flex-1 bg-pearl-beige/50 border border-dusty-lavender/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blazing-flame"
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isFetchingLocation}
                        className="px-4 bg-white border border-dusty-lavender/20 rounded-xl text-blazing-flame flex items-center justify-center"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaLocationArrow />
                        )}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-dusty-lavender/20 rounded-xl shadow-lg overflow-hidden">
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectSuggestion(s)}
                            className="px-4 py-3 text-sm hover:bg-pearl-beige cursor-pointer border-b border-dusty-lavender/10 last:border-0"
                          >
                            {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    required
                    rows="2"
                    placeholder="Additional details..."
                    value={sosData.description}
                    onChange={(e) =>
                      setSosData({ ...sosData, description: e.target.value })
                    }
                    className="w-full bg-pearl-beige/50 border border-dusty-lavender/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blazing-flame resize-none"
                  ></textarea>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-blazing-flame hover:bg-[#e03a12] text-white rounded-xl font-black uppercase text-xs tracking-wider transition-colors disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? "Broadcasting..." : "Send SOS Now"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* REVIEW REQUESTS MODAL (Cleaned up) */}
        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/40 backdrop-blur-sm"
                onClick={() =>
                  setRequestsModal({ isOpen: false, donation: null })
                }
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-dusty-lavender/10 pb-4 mb-4">
                  <h2 className="text-lg font-black text-pine-teal">
                    Review Requests
                  </h2>
                  <button
                    onClick={() =>
                      setRequestsModal({ isOpen: false, donation: null })
                    }
                    className="text-dusty-lavender hover:text-pine-teal"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-2">
                  {requestsModal.donation.requestedBy.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center justify-between bg-pearl-beige/50 border border-dusty-lavender/10 p-3 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pine-teal text-white flex items-center justify-center font-bold text-xs">
                          {req.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-pine-teal">
                          {req.name}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleApproveRequest(
                            requestsModal.donation._id,
                            req._id,
                          )
                        }
                        disabled={approvingId === req._id}
                        className="px-4 py-2 bg-pine-teal text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#1a3630] transition-colors w-24 flex justify-center"
                      >
                        {approvingId === req._id ? (
                          <FaSpinner className="animate-spin text-sm" />
                        ) : (
                          "Approve"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Dashboard;
