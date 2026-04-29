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
  FaMedal,
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
  <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-lg border border-white/50 flex flex-col gap-4 animate-pulse h-[380px]">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/60 rounded-full"></div>
      <div className="flex-1">
        <div className="h-3 w-1/3 bg-white/60 rounded-full mb-2"></div>
        <div className="h-2 w-1/4 bg-white/60 rounded-full"></div>
      </div>
    </div>
    <div className="w-full h-40 bg-white/50 rounded-[1.5rem]"></div>
    <div className="space-y-2 mt-2">
      <div className="h-4 w-3/4 bg-white/60 rounded-full"></div>
      <div className="h-3 w-full bg-white/60 rounded-full"></div>
    </div>
    <div className="mt-auto h-12 w-full bg-white/50 rounded-2xl"></div>
  </div>
);

const Dashboard = () => {
  const { user, switchRole, socket, enableNotifications } =
    useContext(AuthContext);
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
      );
    });
    socket.on("new_listing", (newDonation) =>
      setFeed((prev) => [newDonation, ...prev]),
    );
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
          if (data && data.features)
            setSuggestions(
              data.features.map((f) => ({
                display_name: f.place_name,
                lat: f.center[1],
                lon: f.center[0],
              })),
            );
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

  const handleShare = async (item) => {
    const shareText = item.isEmergency
      ? `🚨 URGENT: ${item.bloodGroup} Blood needed at ${item.addressText?.split(",")[0] || "nearby"}. Can you help?`
      : `🙏 Sahayam: ${item.title} available near ${item.addressText?.split(",")[0] || "you"}.`;
    const shareData = {
      title: item.title,
      text: shareText,
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareData.text + " -> " + shareData.url)}`,
      );
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
      <div className="relative min-h-screen font-sans bg-[#fbf9f4] overflow-hidden">
        {/* 👉 THE MASTERPIECE: Animated Ambient Glassmorphism Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-pine-teal/10 blur-[120px] animate-[spin_30s_linear_infinite]" />
          <div className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-blazing-flame/10 blur-[150px] animate-[spin_40s_linear_infinite_reverse]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-dark-raspberry/5 blur-[150px] animate-[spin_50s_linear_infinite]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-24 relative z-10">
          {/* RESPONDER TOAST */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
              {responders.map((res, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/90 backdrop-blur-xl border border-blazing-flame/30 text-pine-teal px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto"
                >
                  <div className="w-8 h-8 rounded-full bg-blazing-flame/10 flex items-center justify-center">
                    <FaRunning className="text-blazing-flame" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">
                    {res.donorName} is coming!
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <header className="pt-10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
            <div className="relative z-10">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black tracking-tighter text-pine-teal leading-tight drop-shadow-sm"
              >
                Welcome, <br className="md:hidden" />{" "}
                {user?.name?.split(" ")[0]}.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-dusty-lavender text-xs md:text-sm font-bold uppercase tracking-widest mt-2"
              >
                The grid is active and waiting.
              </motion.p>
            </div>

            {/* 👉 THE MASTERPIECE: Liquid Physics Quick Action Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-white/60 backdrop-blur-2xl p-2 rounded-[1.5rem] shadow-xl border border-white/60 relative z-10"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => navigate("/donations")}
                className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all shadow-lg ${isDonor ? "bg-pine-teal text-white shadow-pine-teal/30" : "bg-dark-raspberry text-white shadow-dark-raspberry/30"}`}
              >
                {isDonor ? "Post Intel" : "Request Support"}
              </motion.button>
              <div className="w-px h-10 bg-dusty-lavender/20 mx-1"></div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => setShowSOS(true)}
                className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs bg-blazing-flame/10 text-blazing-flame hover:bg-blazing-flame hover:text-white transition-all shadow-sm flex items-center gap-2"
              >
                <FaHeartbeat className="animate-pulse text-base" /> Broadcast
                SOS
              </motion.button>
            </motion.div>
          </header>

          {/* MINIMALIST FILTERS */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 mb-8 relative z-10">
            {["All", "Blood", "Food", "Clothes", "Book", "General"].map(
              (cat) => (
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm border ${filterCategory === cat ? "bg-pine-teal text-white border-pine-teal shadow-pine-teal/30" : "bg-white/60 backdrop-blur-md text-dusty-lavender hover:bg-white border-white/50"}`}
                >
                  {cat}
                </motion.button>
              ),
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SkeletonCard key={n} />
              ))}
            </div>
          ) : processedFeed.length === 0 ? (
            <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/50 shadow-lg relative z-10">
              <FaBoxOpen className="text-6xl text-pine-teal/20 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-pine-teal/50 text-sm">
                Sector Clear. No active signals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              <AnimatePresence mode="popLayout">
                {processedFeed.map((item) => {
                  const isMine = item.donorId?._id === user._id;
                  const alreadyReq = item.requestedBy?.some(
                    (r) => r._id === user._id,
                  );
                  const isApprovedReceiver =
                    item.status === "pending" && item.receiverId === user._id;

                  return (
                    // 👉 THE MASTERPIECE: 3D Hover Cards with Radiant Glow
                    <motion.div
                      layout
                      key={item._id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      whileHover={{ y: -8 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className={`relative flex flex-col bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(41,82,74,0.15)] transition-all duration-300 border ${item.isEmergency ? "border-blazing-flame/50 shadow-[0_15px_50px_rgba(255,74,28,0.2)]" : "border-white/60"} overflow-hidden group`}
                    >
                      {/* Inner Radiant Glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/80 via-white/20 to-transparent pointer-events-none" />

                      <div className="flex justify-between items-start relative z-10 mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.donorId?.profilePic ||
                              `https://ui-avatars.com/api/?name=${item.donorId?.name}&background=e8dab2&color=29524a`
                            }
                            alt="User"
                            className="w-11 h-11 rounded-[1.1rem] object-cover shadow-md border border-white/50"
                          />
                          <div>
                            <p className="text-sm font-black text-pine-teal tracking-tight flex items-center gap-1">
                              {item.donorId?.name}{" "}
                              {item.donorId?.points >= 50 && (
                                <FaMedal className="text-blazing-flame" />
                              )}
                            </p>
                            <p className="text-[9px] text-dusty-lavender uppercase font-bold tracking-widest mt-0.5">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {item.isEmergency ? (
                          <span className="bg-gradient-to-r from-blazing-flame to-[#e03a12] text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                            SOS ALERT
                          </span>
                        ) : (
                          <span className="bg-white/80 backdrop-blur-md text-pine-teal border border-white/50 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {item.image ? (
                        <div className="w-full h-44 rounded-[1.5rem] overflow-hidden bg-pearl-beige shrink-0 relative z-10 shadow-inner">
                          <img
                            src={optimizeImageUrl(item.image)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            alt="Item"
                          />
                        </div>
                      ) : item.category === "blood" ? (
                        <div
                          className={`w-full h-44 rounded-[1.5rem] flex flex-col items-center justify-center shrink-0 relative z-10 shadow-inner ${item.isEmergency ? "bg-gradient-to-br from-blazing-flame to-[#e03a12] text-white" : "bg-gradient-to-br from-dark-raspberry to-[#850e53] text-white"}`}
                        >
                          <FaHeartbeat className="text-4xl mb-2 opacity-90 drop-shadow-md" />
                          <span className="text-4xl font-black drop-shadow-md">
                            {item.bloodGroup}
                          </span>
                        </div>
                      ) : null}

                      <div className="flex-1 flex flex-col relative z-10 mt-4">
                        <h3 className="text-lg font-black text-pine-teal line-clamp-1 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-pine-teal/70 font-medium leading-relaxed line-clamp-2 mb-4 flex-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-dark-raspberry text-[10px] font-black uppercase tracking-widest mt-auto bg-dark-raspberry/5 p-2.5 rounded-xl border border-dark-raspberry/10">
                          <FaMapMarkerAlt className="text-sm" />{" "}
                          <span className="truncate">
                            {item.addressText || "Unknown Sector"}
                          </span>
                        </div>
                      </div>

                      {/* 👉 THE MASTERPIECE: Magnetic Action Buttons */}
                      <div className="pt-4 mt-4 border-t border-dusty-lavender/10 flex gap-3 relative z-10">
                        {isMine ? (
                          item.status === "fulfilled" ? (
                            <button
                              disabled
                              className="flex-1 py-3.5 bg-white/50 text-dusty-lavender rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/50 cursor-not-allowed"
                            >
                              Mission Accomplished
                            </button>
                          ) : (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  setRequestsModal({
                                    isOpen: true,
                                    donation: item,
                                  })
                                }
                                disabled={!item.requestedBy?.length}
                                className={`flex-[2] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${item.requestedBy?.length > 0 ? "bg-white text-pine-teal border-white hover:border-pine-teal" : "bg-white/50 text-dusty-lavender border-white/50 cursor-not-allowed"}`}
                              >
                                View Comms ({item.requestedBy?.length || 0})
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeletePost(item._id)}
                                className="w-12 flex items-center justify-center bg-white border border-white hover:border-blazing-flame/50 text-blazing-flame shadow-sm rounded-xl transition-all"
                              >
                                <FaTrash className="text-sm" />
                              </motion.button>
                            </>
                          )
                        ) : item.status === "fulfilled" ? (
                          <button
                            disabled
                            className="flex-1 py-3.5 bg-white/50 text-dusty-lavender border border-white/50 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm cursor-not-allowed flex justify-center items-center gap-2"
                          >
                            <FaLock /> Locked
                          </button>
                        ) : isApprovedReceiver ? (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              navigate(`/chat/${item._id}_${user._id}`)
                            }
                            className="flex-1 py-3.5 bg-gradient-to-r from-dark-raspberry to-[#850e53] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(159,17,100,0.3)] flex justify-center items-center gap-2"
                          >
                            <FaCommentDots className="text-sm" /> Connect
                          </motion.button>
                        ) : alreadyReq ? (
                          <button
                            disabled
                            className="flex-1 py-3.5 bg-white border border-pine-teal/30 text-pine-teal rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex justify-center items-center gap-2"
                          >
                            <FaCheck /> Signal Sent
                          </button>
                        ) : (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRequestItem(item._id)}
                              className={`flex-[2] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex justify-center items-center gap-2 ${item.isEmergency ? "bg-gradient-to-r from-blazing-flame to-[#e03a12] shadow-blazing-flame/30" : "bg-gradient-to-r from-pine-teal to-[#1a3630] shadow-pine-teal/30"}`}
                            >
                              {item.isEmergency ? (
                                <>
                                  <FaHandsHelping className="text-sm" /> Respond
                                </>
                              ) : (
                                "Claim Directive"
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleShare(item)}
                              className="w-12 flex items-center justify-center bg-white border border-white hover:border-pine-teal/50 text-pine-teal shadow-sm rounded-xl transition-all"
                            >
                              <FaShareAlt className="text-sm" />
                            </motion.button>
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
            <div className="mt-12 flex justify-center relative z-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadMoreListings}
                disabled={loadingMore}
                className="px-8 py-4 bg-white/80 backdrop-blur-md border border-white shadow-xl rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-pine-teal flex items-center gap-3"
              >
                {loadingMore ? (
                  <FaSpinner className="animate-spin text-lg" />
                ) : (
                  "Access More Intel"
                )}
              </motion.button>
            </div>
          )}
        </div>

        {/* SOS MODAL (Glassmorphic) */}
        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/60 backdrop-blur-md"
                onClick={() => setShowSOS(false)}
              />
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl border border-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4 text-blazing-flame">
                    <div className="w-12 h-12 bg-blazing-flame/10 rounded-2xl flex items-center justify-center border border-blazing-flame/20">
                      <FaHeartbeat className="text-2xl animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight">
                        SOS Override
                      </h2>
                      <p className="text-[9px] uppercase tracking-widest font-bold text-dusty-lavender">
                        Bypass standard protocols
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSOS(false)}
                    className="p-3 bg-pearl-beige rounded-full text-dusty-lavender hover:text-pine-teal shadow-inner"
                  >
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleSOSSubmit} className="space-y-5">
                  <div className="flex gap-3">
                    <select
                      required
                      value={sosData.bloodGroup}
                      onChange={(e) =>
                        setSosData({ ...sosData, bloodGroup: e.target.value })
                      }
                      className="flex-1 bg-white border border-dusty-lavender/30 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-pine-teal outline-none focus:border-blazing-flame shadow-sm"
                    >
                      <option value="" disabled>
                        Type
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
                      className="w-24 bg-white border border-dusty-lavender/30 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-pine-teal outline-none focus:border-blazing-flame shadow-sm text-center"
                    />
                  </div>
                  <input
                    required
                    placeholder="Hospital / Facility Name"
                    value={sosData.hospital}
                    onChange={(e) =>
                      setSosData({ ...sosData, hospital: e.target.value })
                    }
                    className="w-full bg-white border border-dusty-lavender/30 rounded-2xl px-5 py-4 text-sm font-bold text-pine-teal outline-none focus:border-blazing-flame shadow-sm"
                  />

                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        required
                        placeholder="Search Area Coordinates"
                        value={sosData.addressText}
                        onChange={handleLocationType}
                        className="flex-1 bg-white border border-dusty-lavender/30 rounded-2xl px-5 py-4 text-sm font-bold text-pine-teal outline-none focus:border-blazing-flame shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isFetchingLocation}
                        className="w-14 bg-pine-teal text-white rounded-2xl shadow-md flex items-center justify-center hover:bg-[#1a3630] transition-colors"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin text-lg" />
                        ) : (
                          <FaLocationArrow className="text-lg" />
                        )}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-dusty-lavender/30 rounded-2xl shadow-xl overflow-hidden">
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectSuggestion(s)}
                            className="px-5 py-3.5 text-xs font-bold text-pine-teal hover:bg-pearl-beige cursor-pointer border-b border-dusty-lavender/10 last:border-0"
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
                    placeholder="Critical details regarding the patient..."
                    value={sosData.description}
                    onChange={(e) =>
                      setSosData({ ...sosData, description: e.target.value })
                    }
                    className="w-full bg-white border border-dusty-lavender/30 rounded-2xl px-5 py-4 text-sm font-bold text-pine-teal outline-none focus:border-blazing-flame resize-none shadow-sm"
                  ></textarea>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-gradient-to-r from-blazing-flame to-[#e03a12] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_10px_30px_rgba(255,74,28,0.4)] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin text-lg" />
                    ) : (
                      "Deploy SOS Sequence"
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* REVIEW REQUESTS MODAL */}
        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/60 backdrop-blur-md"
                onClick={() =>
                  setRequestsModal({ isOpen: false, donation: null })
                }
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl border border-white"
              >
                <div className="flex justify-between items-center border-b border-dusty-lavender/20 pb-5 mb-5">
                  <div>
                    <h2 className="text-xl font-black text-pine-teal uppercase tracking-tight">
                      Active Comms
                    </h2>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-dusty-lavender mt-1">
                      Select a responder
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setRequestsModal({ isOpen: false, donation: null })
                    }
                    className="p-3 bg-pearl-beige rounded-full text-dusty-lavender hover:text-pine-teal shadow-inner"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-2">
                  {requestsModal.donation.requestedBy.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center justify-between bg-white border border-dusty-lavender/30 p-4 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[1rem] bg-pine-teal/10 text-pine-teal border border-pine-teal/20 flex items-center justify-center font-black text-sm uppercase shadow-sm">
                          {req.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-pine-teal leading-none">
                          {req.name}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleApproveRequest(
                            requestsModal.donation._id,
                            req._id,
                          )
                        }
                        disabled={approvingId === req._id}
                        className="px-5 py-3 bg-pine-teal text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center justify-center"
                      >
                        {approvingId === req._id ? (
                          <FaSpinner className="animate-spin text-sm" />
                        ) : (
                          "Approve"
                        )}
                      </motion.button>
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
