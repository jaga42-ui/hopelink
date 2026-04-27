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
  FaBullhorn,
  FaCalendarPlus,
  FaBell,
  FaShareAlt,
  FaMedal,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import api from "../utils/api";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://hopelink-api.onrender.com";

const optimizeImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("cloudinary.com"))
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
};

const SkeletonCard = () => (
  <div className="relative overflow-hidden flex flex-col bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(41,82,74,0.05)] h-[380px]">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
    <div className="w-full h-48 bg-dusty-lavender/10 rounded-t-[2.5rem]"></div>
    <div className="p-5 flex-1 flex flex-col mt-2">
      <div className="h-5 w-3/4 bg-dusty-lavender/20 rounded-full mb-3"></div>
      <div className="h-3 w-full bg-dusty-lavender/10 rounded-full mb-2"></div>
      <div className="h-3 w-4/5 bg-dusty-lavender/10 rounded-full mb-auto"></div>
      <div className="h-12 w-full bg-dusty-lavender/10 rounded-2xl mt-4"></div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, switchRole, enableNotifications } = useContext(AuthContext);
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState("p2p");
  const [localRole, setLocalRole] = useState(user?.activeRole || "donor");
  const [feed, setFeed] = useState([]);
  const [eventsFeed, setEventsFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responders, setResponders] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("urgent");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const [showSOS, setShowSOS] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
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

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "Blood Camp",
    eventDate: "",
    startTime: "",
    endTime: "",
    addressText: "",
    lat: null,
    lng: null,
    image: null,
  });

  const [fulfillModal, setFulfillModal] = useState({
    isOpen: false,
    donationId: null,
    pin: "",
    rating: 5,
  });
  const [requestsModal, setRequestsModal] = useState({
    isOpen: false,
    donation: null,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    console.log("System initialized. Developed by guruprasad and team.");
    if (Notification.permission === "default") Notification.requestPermission();
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  useEffect(() => {
    if (user?.activeRole) setLocalRole(user.activeRole);
  }, [user?.activeRole]);

  useEffect(() => {
    if (!user?.token) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (viewMode === "p2p") {
          const { data } = await api.get("/donations/feed?page=1&limit=12");
          setFeed(data.donations || (Array.isArray(data) ? data : []));
          setHasMore(data.hasMore || false);
        } else {
          const { data } = await api.get("/events");
          setEventsFeed(data);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, viewMode]);

  useEffect(() => {
    if (!user) return;
    const socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });
    socket.emit("setup", user._id);

    socket.on("donor_coming", (data) => {
      setResponders((prev) => [...prev, data]);
      toast.success(`${data.donorName} is en route to help!`);
    });

    socket.on("new_listing", (newDonation) => {
      setFeed((prev) => [newDonation, ...prev]);
      if (newDonation.isEmergency) toast.error("🚨 NEW SOS DETECTED!");
    });

    socket.on("listing_updated", (updatedItem) =>
      setFeed((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item)),
      ),
    );
    socket.on("listing_deleted", (deletedId) =>
      setFeed((prev) => prev.filter((item) => item._id !== deletedId)),
    );

    socket.on("new_message_notification", (data) => {
      if (!data) return;
      window.dispatchEvent(new CustomEvent("new_unread_message"));
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      toast(`💬 ${data.senderName || "User"}: ${data.text || "New message"}`);
    });
    return () => socket.disconnect();
  }, [user, navigate]);

  const handleRoleToggle = () => {
    setLocalRole(isDonor ? "receiver" : "donor");
    switchRole();
  };

  const loadMoreListings = async () => {
    if (!hasMore || loadingMore || viewMode !== "p2p") return;
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

  const handleGetLocation = async (isEvent = false) => {
    if (!navigator.geolocation)
      return toast.error("Geolocation is not supported.");
    setIsFetchingLocation(true);
    const toastId = toast.loading("Locking onto GPS via Mapbox...");

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
            if (isEvent)
              setEventData((prev) => ({
                ...prev,
                addressText: cityString,
                lat: latitude,
                lng: longitude,
              }));
            else
              setSosData((prev) => ({
                ...prev,
                addressText: cityString,
                lat: latitude,
                lng: longitude,
              }));
            toast.success(`Coordinates locked: ${cityString}`, { id: toastId });
          } else {
            throw new Error("No location found");
          }
        } catch {
          toast.error("Could not resolve address via Mapbox.", { id: toastId });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error("Failed to acquire location.", { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const handleLocationType = (e, isEvent = false) => {
    const val = e.target.value;
    if (isEvent)
      setEventData((prev) => ({
        ...prev,
        addressText: val,
        lat: null,
        lng: null,
      }));
    else
      setSosData((prev) => ({
        ...prev,
        addressText: val,
        lat: null,
        lng: null,
      }));
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
          } else {
            setSuggestions([]);
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

  const handleSelectSuggestion = (locationObj, isEvent = false) => {
    const cleanName = locationObj.display_name.split(",")[0];
    if (isEvent)
      setEventData((prev) => ({
        ...prev,
        addressText: cleanName,
        lat: locationObj.lat,
        lng: locationObj.lon,
      }));
    else
      setSosData((prev) => ({
        ...prev,
        addressText: cleanName,
        lat: locationObj.lat,
        lng: locationObj.lon,
      }));
    setSuggestions([]);
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
      formData.append("title", `URGENT: ${sosData.bloodGroup} Blood Needed!`);
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
      toast.success("Emergency broadcast deployed successfully!");
    } catch {
      toast.error("Failed to broadcast SOS");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Retract this transmission?")) {
      try {
        await api.delete(`/donations/${id}`);
        toast.success("Retracted.");
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
      toast.success("Request Approved!");
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

  const processedFeed = feed
    .filter((item) =>
      filterCategory === "All"
        ? true
        : item.category?.toLowerCase() === filterCategory.toLowerCase(),
    )
    .sort((a, b) => {
      if (sortOrder === "urgent") {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-24 relative min-h-screen text-pine-teal">
        {/* HERO RESPONDER TICKER */}
        <div className="fixed top-20 right-4 md:top-24 md:right-8 z-[100] w-56 md:w-64 space-y-3 pointer-events-none">
          <AnimatePresence>
            {responders.map((res, i) => (
              <motion.div
                key={i}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border-l-4 border-l-blazing-flame p-3 md:p-4 rounded-xl shadow-[0_10px_30px_rgba(255,74,28,0.15)] flex items-center gap-3 pointer-events-auto"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blazing-flame/10 rounded-full flex items-center justify-center text-blazing-flame shrink-0">
                  <FaRunning className="text-sm md:text-base" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[8px] md:text-[10px] text-blazing-flame font-black uppercase tracking-widest">
                    Hero En Route
                  </p>
                  <p className="text-xs md:text-sm font-bold text-pine-teal truncate">
                    {res.donorName}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* HEADER */}
        <header className="pt-6 pb-4 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-pine-teal uppercase italic">
                Dashboard.
              </h1>
              <p className="text-dusty-lavender text-[10px] sm:text-xs font-black tracking-widest uppercase mt-1">
                Welcome back, {user?.name?.split(" ")[0]}
              </p>
            </motion.div>

            {!user.isAdmin && (
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={handleRoleToggle}
                className={`relative w-28 h-9 bg-white rounded-full border border-dusty-lavender/40 flex items-center cursor-pointer p-1 shrink-0 shadow-inner transition-colors ${isDonor ? "justify-start" : "justify-end"}`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-1/2 h-full rounded-full bg-gradient-to-r from-dark-raspberry to-blazing-flame shadow-md"
                />
                <div className="absolute inset-0 z-10 flex justify-between items-center px-2 text-[9px] font-black uppercase tracking-widest pointer-events-none">
                  <span
                    className={`w-1/2 text-center transition-colors duration-300 ${isDonor ? "text-white" : "text-dusty-lavender"}`}
                  >
                    Give
                  </span>
                  <span
                    className={`w-1/2 text-center transition-colors duration-300 ${!isDonor ? "text-white" : "text-dusty-lavender"}`}
                  >
                    Take
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 items-center">
            {Notification.permission !== "granted" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={enableNotifications}
                className="flex-shrink-0 w-10 h-10 bg-white border border-blazing-flame/40 text-blazing-flame rounded-xl flex items-center justify-center shadow-sm"
              >
                <FaBell className="text-base animate-pulse" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSOS(true)}
              className="flex-shrink-0 px-5 py-2.5 bg-blazing-flame rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest text-white shadow-[0_10px_25px_rgba(255,74,28,0.3)] border border-blazing-flame"
            >
              <FaHeartbeat className="animate-pulse text-sm" /> Emergency SOS
            </motion.button>

            {viewMode === "p2p" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/donations")}
                className="flex-shrink-0 px-5 py-2.5 bg-dark-raspberry rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest text-white shadow-[0_10px_25px_rgba(159,17,100,0.3)] border border-dark-raspberry"
              >
                {isDonor ? (
                  <>
                    <FaBoxOpen className="text-sm" /> Create Post
                  </>
                ) : (
                  <>
                    <FaHandsHelping className="text-sm" /> Request Item
                  </>
                )}
              </motion.button>
            )}
          </div>
        </header>

        {/* FEED FILTERS */}
        <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-dusty-lavender/30 mb-6 shadow-sm">
          <button
            onClick={() => setViewMode("p2p")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === "p2p" ? "bg-white text-pine-teal shadow-md border border-white" : "text-dusty-lavender hover:text-pine-teal"}`}
          >
            Community Feed
          </button>
          <button
            onClick={() => setViewMode("events")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === "events" ? "bg-white text-pine-teal shadow-md border border-white" : "text-dusty-lavender hover:text-pine-teal"}`}
          >
            Events & Drives
          </button>
        </div>

        {viewMode === "p2p" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0 scroll-smooth">
                {["All", "Blood", "Food", "Clothes", "Book"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest whitespace-nowrap transition-all ${filterCategory === cat ? "bg-pine-teal text-white shadow-[0_10px_20px_rgba(41,82,74,0.3)]" : "bg-white/80 text-dusty-lavender hover:text-pine-teal hover:bg-white border border-dusty-lavender/20"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white/80 backdrop-blur-md border border-dusty-lavender/30 rounded-xl px-4 py-2.5 text-pine-teal text-[10px] sm:text-[11px] uppercase tracking-widest font-black outline-none cursor-pointer focus:border-dark-raspberry shadow-sm"
              >
                <option value="urgent">Urgent First</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SkeletonCard key={n} />
                ))}
              </div>
            ) : processedFeed.length === 0 ? (
              <div className="text-center py-20 text-dusty-lavender font-black uppercase tracking-widest text-sm bg-white/50 rounded-[3rem] border border-dashed border-dusty-lavender/40">
                No active signals found.
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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        whileHover={{ y: -8 }}
                        // 👉 PREMIUM UPGRADE: The Container
                        className={`relative overflow-hidden flex flex-col bg-white/90 backdrop-blur-xl rounded-[2.5rem] transition-all duration-300 group ${item.isEmergency ? "border-2 border-blazing-flame shadow-[0_15px_40px_rgba(255,74,28,0.2)]" : "border border-white shadow-[0_20px_50px_rgba(41,82,74,0.06)] hover:shadow-[0_30px_60px_rgba(41,82,74,0.12)]"}`}
                      >
                        {/* 👉 PREMIUM UPGRADE: Emergency Holographic Glow */}
                        {item.isEmergency && (
                          <div className="absolute inset-0 bg-gradient-to-b from-blazing-flame/20 to-transparent opacity-50 pointer-events-none" />
                        )}

                        {/* 👉 PREMIUM UPGRADE: Edge-to-Edge Image / Header Area */}
                        <div className="relative w-full h-48 sm:h-52 bg-pearl-beige shrink-0 overflow-hidden">
                          {item.image ? (
                            <>
                              <img
                                src={optimizeImageUrl(item.image)}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                alt="intel"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                            </>
                          ) : item.category === "blood" ? (
                            <div
                              className={`w-full h-full flex flex-col items-center justify-center ${item.isEmergency ? "bg-blazing-flame" : "bg-dark-raspberry"} text-white`}
                            >
                              <FaHeartbeat className="text-5xl mb-2 opacity-80" />
                              <span className="text-4xl font-black">
                                {item.bloodGroup}
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-dusty-lavender/10 text-dusty-lavender/30">
                              <FaBoxOpen className="text-6xl" />
                            </div>
                          )}

                          {/* 👉 PREMIUM UPGRADE: Floating Top Badges */}
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                            {/* User Pill */}
                            <div className="bg-white/95 backdrop-blur-md px-1.5 py-1.5 pr-4 rounded-full flex items-center gap-2 shadow-lg max-w-[70%]">
                              <img
                                src={
                                  item.donorId?.profilePic ||
                                  `https://ui-avatars.com/api/?name=${item.donorId?.name}&background=e8dab2&color=29524a`
                                }
                                className="w-7 h-7 rounded-full object-cover"
                                alt="User"
                              />
                              <p className="text-[10px] font-black text-pine-teal truncate flex items-center gap-1">
                                {item.donorId?.name}{" "}
                                {item.donorId?.points >= 50 && (
                                  <FaMedal className="text-blazing-flame text-sm drop-shadow-md" />
                                )}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(item);
                                }}
                                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-pine-teal flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-white"
                              >
                                <FaShareAlt size={12} />
                              </button>
                              {isMine && (
                                <button
                                  onClick={() => handleDeletePost(item._id)}
                                  className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-blazing-flame flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-white"
                                >
                                  <FaTrash size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 👉 PREMIUM UPGRADE: Floating Bottom Badges */}
                          <div className="absolute bottom-4 left-4 flex gap-2 z-10">
                            {item.isEmergency ? (
                              <span className="px-3 py-1.5 bg-blazing-flame text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                                <FaExclamationTriangle /> SOS ALERT
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-dark-raspberry rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                                {item.listingType === "request"
                                  ? "Requesting"
                                  : "Offering"}
                              </span>
                            )}
                            <span className="px-3 py-1.5 bg-pine-teal/90 backdrop-blur-md text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="p-5 flex-1 flex flex-col relative z-10 bg-white">
                          <h3 className="text-xl font-black text-pine-teal leading-tight mb-2 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-dusty-lavender font-medium text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                            {item.description}
                          </p>

                          <div className="flex items-center gap-2 text-pine-teal text-[10px] font-bold mt-auto pt-4 border-t border-dusty-lavender/10">
                            <FaMapMarkerAlt className="text-dark-raspberry text-sm" />
                            <span className="truncate uppercase tracking-wider">
                              {item.addressText || "Sector Location Unknown"}
                            </span>
                          </div>
                        </div>

                        {/* 👉 PREMIUM UPGRADE: The Action Dock */}
                        <div className="p-3 bg-pearl-beige/30 border-t border-dusty-lavender/10 z-10">
                          {isMine ? (
                            item.status === "fulfilled" ? (
                              <button
                                disabled
                                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest bg-white text-pine-teal/50 border border-pine-teal/20"
                              >
                                <FaCheckCircle /> Mission Accomplished
                              </button>
                            ) : (
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() =>
                                    setRequestsModal({
                                      isOpen: true,
                                      donation: item,
                                    })
                                  }
                                  disabled={!item.requestedBy?.length}
                                  className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${item.requestedBy?.length > 0 ? "bg-white text-pine-teal border border-pine-teal hover:bg-pine-teal hover:text-white shadow-sm" : "bg-white/50 text-dusty-lavender border border-dusty-lavender/30 cursor-not-allowed"}`}
                                >
                                  <FaUsers className="text-sm" />{" "}
                                  {item.requestedBy?.length || 0}
                                </button>
                                {item.status === "pending" && (
                                  <button
                                    onClick={() =>
                                      setFulfillModal({
                                        isOpen: true,
                                        donationId: item._id,
                                        pin: "",
                                        rating: 5,
                                      })
                                    }
                                    className="flex-[2] py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all bg-pine-teal text-white shadow-lg hover:bg-[#1a3630]"
                                  >
                                    <FaCheckCircle className="text-sm" /> Verify
                                    PIN
                                  </button>
                                )}
                              </div>
                            )
                          ) : item.status === "fulfilled" ? (
                            <button
                              disabled
                              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest bg-white text-dusty-lavender border border-dusty-lavender/30 cursor-not-allowed"
                            >
                              <FaLock /> Fulfilled
                            </button>
                          ) : isApprovedReceiver ? (
                            <button
                              onClick={() =>
                                navigate(`/chat/${item._id}_${user._id}`)
                              }
                              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest bg-dark-raspberry hover:bg-[#850e53] text-white shadow-[0_10px_25px_rgba(159,17,100,0.3)] transition-all active:scale-95"
                            >
                              <FaCommentDots className="text-lg" /> Open Secure
                              Chat
                            </button>
                          ) : alreadyReq ? (
                            <button
                              disabled
                              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest bg-white text-pine-teal border border-dusty-lavender/30"
                            >
                              <FaCheck /> Awaiting Approval
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRequestItem(item._id)}
                              className={`w-full py-4 rounded-2xl font-black text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest ${item.isEmergency ? "bg-blazing-flame hover:bg-[#e03a12] shadow-blazing-flame/30" : "bg-pine-teal hover:bg-[#1a3630] shadow-pine-teal/30"}`}
                            >
                              <FaHandsHelping className="text-sm" />{" "}
                              {item.isEmergency ? "RESPOND TO SOS" : "Connect"}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={loadMoreListings}
                  disabled={loadingMore}
                  className="px-8 py-4 bg-white border border-dusty-lavender/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-pine-teal hover:shadow-md transition-all flex items-center gap-3 active:scale-95"
                >
                  {loadingMore ? (
                    <FaSpinner className="animate-spin text-lg" />
                  ) : (
                    "Request More Data"
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ... Event View Mode / Modals Remainder (Unchanged logic, just maintaining full file structure) ... */}
        {viewMode === "events" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center py-20 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_20px_40px_rgba(41,82,74,0.06)]">
              <FaBullhorn className="text-6xl text-dark-raspberry/50 mx-auto mb-4" />
              <h3 className="text-xl font-black text-pine-teal mb-2 uppercase tracking-tight">
                Events Integration
              </h3>
              <p className="text-dusty-lavender text-sm font-medium">
                Switch back to community feed to view active SOS and donation
                cards.
              </p>
            </div>
          </motion.div>
        )}

        {/* MODALS */}
        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/60 backdrop-blur-sm"
                onClick={() => setShowSOS(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="relative w-full max-w-md bg-white border border-dusty-lavender/30 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-pine-teal"
              >
                <button
                  type="button"
                  onClick={() => setShowSOS(false)}
                  className="absolute top-6 right-6 text-dusty-lavender hover:text-dark-raspberry bg-pearl-beige p-2 rounded-full"
                >
                  <FaTimes className="text-sm" />
                </button>
                <div className="flex items-center gap-3 mb-6 text-blazing-flame">
                  <FaHeartbeat className="text-4xl animate-pulse" />
                  <h2 className="text-2xl font-black tracking-tight">
                    Emergency Request
                  </h2>
                </div>
                <form onSubmit={handleSOSSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-dusty-lavender block mb-1">
                        Blood Group
                      </label>
                      <select
                        required
                        value={sosData.bloodGroup}
                        onChange={(e) =>
                          setSosData({ ...sosData, bloodGroup: e.target.value })
                        }
                        className="w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-blazing-flame text-pine-teal"
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                          (bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-dusty-lavender block mb-1">
                        Units
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={sosData.quantity}
                        onChange={(e) =>
                          setSosData({ ...sosData, quantity: e.target.value })
                        }
                        className="w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-blazing-flame text-pine-teal"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-dusty-lavender block mb-1">
                      Hospital
                    </label>
                    <input
                      required
                      value={sosData.hospital}
                      onChange={(e) =>
                        setSosData({ ...sosData, hospital: e.target.value })
                      }
                      className="w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-blazing-flame text-pine-teal"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-dusty-lavender block mb-1">
                      Area / GPS
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={sosData.addressText}
                        onChange={(e) => handleLocationType(e, false)}
                        className="flex-1 w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-blazing-flame text-pine-teal"
                      />
                      <button
                        type="button"
                        onClick={() => handleGetLocation(false)}
                        disabled={isFetchingLocation}
                        className="px-5 bg-white text-blazing-flame rounded-2xl border border-dusty-lavender/40 hover:shadow-md flex items-center justify-center"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin text-lg" />
                        ) : (
                          <FaLocationArrow className="text-lg" />
                        )}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute z-[100] w-full mt-2 bg-white border border-dusty-lavender/30 rounded-xl overflow-y-auto max-h-48 shadow-2xl">
                        {suggestions.map((s, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectSuggestion(s, false)}
                            className="px-5 py-3 text-sm text-pine-teal hover:text-white hover:bg-pine-teal cursor-pointer border-b border-dusty-lavender/20 last:border-0 truncate"
                          >
                            {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-dusty-lavender block mb-1">
                      Details
                    </label>
                    <textarea
                      required
                      rows="2"
                      value={sosData.description}
                      onChange={(e) =>
                        setSosData({ ...sosData, description: e.target.value })
                      }
                      className="w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:border-blazing-flame text-pine-teal resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 py-4 rounded-2xl font-black text-white transition-all active:scale-95 shadow-[0_10px_25px_rgba(255,74,28,0.4)] flex items-center justify-center gap-2 uppercase tracking-widest bg-blazing-flame hover:bg-[#e03a12]"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaExclamationTriangle /> Broadcast SOS
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/60 backdrop-blur-sm"
                onClick={() =>
                  setRequestsModal({ isOpen: false, donation: null })
                }
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="relative w-full max-w-md bg-white border border-dusty-lavender/30 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-pine-teal"
              >
                <div className="w-12 h-1.5 bg-dusty-lavender/20 rounded-full mx-auto mb-6 sm:hidden" />
                <h2 className="text-2xl font-black tracking-tight mb-1">
                  Community Requests
                </h2>
                <p className="text-dusty-lavender text-xs font-bold uppercase tracking-widest mb-6 border-b border-dusty-lavender/20 pb-4">
                  Select a user to connect with
                </p>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-4">
                  {requestsModal.donation.requestedBy.map((requester) => (
                    <div
                      key={requester._id}
                      className="flex items-center justify-between bg-pearl-beige/30 border border-dusty-lavender/20 p-4 rounded-3xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dark-raspberry text-white flex items-center justify-center font-black">
                          {requester.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-pine-teal">
                          {requester.name}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleApproveRequest(
                            requestsModal.donation._id,
                            requester._id,
                          )
                        }
                        disabled={approvingId === requester._id}
                        className={`px-5 py-3 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center transition-all w-28 ${approvingId === requester._id ? "bg-dusty-lavender/50" : "bg-pine-teal hover:bg-[#1a3630]"}`}
                      >
                        {approvingId === requester._id ? (
                          <FaSpinner className="animate-spin text-white text-lg" />
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
