import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaHeartbeat, FaMapMarkerAlt, FaCommentDots, FaSpinner, FaTimes,
  FaExclamationTriangle, FaTrash, FaBoxOpen, FaLocationArrow,
  FaEnvelope, FaCheckCircle, FaCheck, FaCalendarAlt, // 👉 FaCheck is added here!
  FaSearch, FaLock, FaStar, FaUsers, FaRunning, FaDownload,
  FaHandsHelping, FaBullhorn, FaCalendarPlus, FaClock, FaEdit, FaChevronRight
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import api from "../utils/api";

const BACKEND_URL = "https://hopelink-api.onrender.com";

// 👉 COMPRESSION ENGINE
const optimizeImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("cloudinary.com"))
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
};

const Dashboard = () => {
  const { user, switchRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState("p2p");
  const [localRole, setLocalRole] = useState(user?.activeRole || "donor");
  const [feed, setFeed] = useState([]);
  const [eventsFeed, setEventsFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [responders, setResponders] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("urgent");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Modals
  const [showSOS, setShowSOS] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme Config based on Role
  const isDonor = localRole === "donor";
  const roleTheme = {
    primary: isDonor
      ? "from-teal-500 to-emerald-600"
      : "from-blue-500 to-indigo-600",
    text: isDonor ? "text-teal-400" : "text-blue-400",
    bg: isDonor ? "bg-teal-500/10" : "bg-blue-500/10",
    border: isDonor ? "border-teal-500/30" : "border-blue-500/30",
    button: isDonor
      ? "bg-teal-600 hover:bg-teal-500"
      : "bg-blue-600 hover:bg-blue-500",
  };

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

  // Fetch Data Based on Active Tab
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

        const { data: inboxData } = await api.get("/chat/inbox");
        if (Array.isArray(inboxData)) {
          setUnreadCount(
            inboxData.reduce((acc, chat) => acc + chat.unreadCount, 0),
          );
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

    socket.on("new_message_notification", () => {
      setUnreadCount((prev) => prev + 1);
      toast("💬 Secure Transmission Received!", {
        style: {
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.2)",
        },
      });
    });

    socket.on("donor_coming", (data) => {
      setResponders((prev) => [...prev, data]);
      toast.success(`${data.donorName} is en route to help! 🦸‍♂️`, {
        duration: 8000,
        style: { background: "#ef4444", color: "#fff", fontWeight: "bold" },
      });
    });

    return () => socket.disconnect();
  }, [user]);

  const handleRoleToggle = () => {
    const newRole = isDonor ? "receiver" : "donor";
    setLocalRole(newRole);
    switchRole();
    toast.success(`Switched to ${newRole.toUpperCase()} Mode`, { icon: "🔄" });
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstallable(false);
    setDeferredPrompt(null);
  };

  const handleGetLocation = async (isEvent = false) => {
    if (!navigator.geolocation)
      return toast.error("Geolocation is not supported.");

    setIsFetchingLocation(true);
    toast.loading("Locking onto GPS...", { id: "gps-toast" });

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

          if (isEvent) {
            setEventData((prev) => ({
              ...prev,
              addressText: cityString,
              lat: latitude,
              lng: longitude,
            }));
          } else {
            setSosData((prev) => ({
              ...prev,
              addressText: cityString,
              lat: latitude,
              lng: longitude,
            }));
          }
          toast.success(`Coordinates locked: ${cityString}`, {
            id: "gps-toast",
          });
        } catch (error) {
          toast.error("Could not resolve address.", { id: "gps-toast" });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        toast.error("Failed to acquire location.", { id: "gps-toast" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleLocationType = (e, isEvent = false) => {
    const val = e.target.value;
    if (isEvent) setEventData((prev) => ({ ...prev, addressText: val }));
    else setSosData((prev) => ({ ...prev, addressText: val }));

    if (typingTimeout) clearTimeout(typingTimeout);
    if (val.length > 2) {
      const newTimer = setTimeout(async () => {
        try {
          const { data } = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${val}&limit=4&email=hopelink.dev@example.com`,
          );
          setSuggestions(data);
        } catch (error) {
          console.error("Autocomplete failed");
        }
      }, 600);
      setTypingTimeout(newTimer);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (locationObj, isEvent = false) => {
    const cleanName = locationObj.display_name.split(",")[0];
    if (isEvent) {
      setEventData((prev) => ({
        ...prev,
        addressText: cleanName,
        lat: locationObj.lat,
        lng: locationObj.lon,
      }));
    } else {
      setSosData((prev) => ({
        ...prev,
        addressText: cleanName,
        lat: locationObj.lat,
        lng: locationObj.lon,
      }));
    }
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

      const { data } = await api.post("/donations", formData);
      setFeed([data, ...feed]);
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
    } catch (error) {
      toast.error("Failed to broadcast SOS");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditEventModal = (event) => {
    setEditingEventId(event._id);
    const formattedDate = new Date(event.eventDate).toISOString().split("T")[0];
    setEventData({
      title: event.title,
      description: event.description,
      category: event.category,
      eventDate: formattedDate,
      startTime: event.startTime,
      endTime: event.endTime,
      addressText: event.locationText,
      lat: event.location?.coordinates[1] || null,
      lng: event.location?.coordinates[0] || null,
      image: null,
    });
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEventId(null);
    setEventData({
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
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", eventData.title);
      formData.append("description", eventData.description);
      formData.append("category", eventData.category);
      formData.append("eventDate", eventData.eventDate);
      formData.append("startTime", eventData.startTime);
      formData.append("endTime", eventData.endTime);
      formData.append("locationText", eventData.addressText);
      if (eventData.lat) formData.append("lat", eventData.lat);
      if (eventData.lng) formData.append("lng", eventData.lng);
      if (eventData.image) formData.append("image", eventData.image);

      if (editingEventId) {
        const { data } = await api.put(`/events/${editingEventId}`, formData);
        setEventsFeed(
          eventsFeed.map((ev) => (ev._id === editingEventId ? data : ev)),
        );
        toast.success("Event updated successfully!");
      } else {
        const { data } = await api.post("/events", formData);
        setEventsFeed([data, ...eventsFeed]);
        toast.success("Event broadcasted to all nearby users!");
      }
      closeEventModal();
    } catch (error) {
      toast.error(
        editingEventId ? "Failed to update event." : "Failed to create event.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Delete this event completely?")) {
      try {
        await api.delete(`/events/${id}`);
        setEventsFeed(eventsFeed.filter((ev) => ev._id !== id));
        toast.success("Event removed.");
      } catch (error) {
        toast.error("Failed to delete event.");
      }
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Retract this transmission?")) {
      try {
        await api.delete(`/donations/${id}`);
        setFeed(feed.filter((item) => item._id !== id));
        toast.success("Transmission successfully retracted.");
      } catch (error) {
        toast.error("Failed to delete the listing.");
      }
    }
  };

  const handleRequestItem = async (donationId) => {
    const previousFeed = [...feed];
    setFeed(
      feed.map((item) =>
        item._id === donationId
          ? {
              ...item,
              requestedBy: [
                ...(item.requestedBy || []),
                { _id: user._id, name: user.name },
              ],
            }
          : item,
      ),
    );
    try {
      await api.post(`/donations/${donationId}/request`, {});
      toast.success("Response sent! The author has been notified.");
    } catch (error) {
      setFeed(previousFeed);
      toast.error("Network unstable. Failed to send request.");
    }
  };

  const handleApproveRequest = async (donationId, receiverId) => {
    try {
      const { data } = await api.patch(`/donations/${donationId}/approve`, {
        receiverId,
      });
      const receiverName =
        requestsModal.donation.requestedBy.find((r) => r._id === receiverId)
          ?.name || "Receiver";
      setFeed(
        feed.map((item) =>
          item._id === donationId
            ? { ...item, status: "pending", receiverId: receiverId }
            : item,
        ),
      );
      setRequestsModal({ isOpen: false, donation: null });
      toast.success("Approved! Secure comms channel established.");
      navigate(`/chat/${data.chatRoomId}`, {
        state: {
          otherUserId: receiverId,
          otherUserName: receiverName,
          itemTitle: requestsModal.donation.title,
        },
      });
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/donations/${fulfillModal.donationId}/fulfill`, {
        pin: fulfillModal.pin,
        rating: fulfillModal.rating,
      });
      setFeed(feed.filter((item) => item._id !== fulfillModal.donationId));
      toast.success("Handshake Verified! Points securely applied.");
      setFulfillModal({ isOpen: false, donationId: null, pin: "", rating: 5 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Incorrect Access PIN");
    } finally {
      setIsSubmitting(false);
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
      <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-24 relative min-h-screen text-white">
        {/* RESPONDER HUD */}
        <div className="fixed top-20 right-4 md:top-24 md:right-8 z-[100] w-56 md:w-72 space-y-3 pointer-events-none">
          <AnimatePresence>
            {responders.map((res, i) => (
              <motion.div
                key={i}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-red-600 border border-red-400 p-3 md:p-4 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center text-white shrink-0">
                  <FaRunning className="text-lg md:text-xl" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[8px] md:text-[10px] text-white/70 font-black uppercase tracking-widest">
                    En Route
                  </p>
                  <p className="text-xs md:text-sm font-bold text-white truncate">
                    {res.donorName}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* MOBILE HUD: HEADER */}
        <header className="pt-6 pb-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-black text-white tracking-tight"
            >
              HOPE<span className={roleTheme.text}>LINK.</span>
            </motion.h1>

            {/* ROLE SWITCHER ANIMATED */}
            {!user.isAdmin && (
              <div
                onClick={handleRoleToggle}
                className="relative w-32 h-10 bg-white/10 rounded-full border border-white/20 flex items-center cursor-pointer p-1 overflow-hidden shrink-0"
              >
                <motion.div
                  animate={{ x: isDonor ? 0 : 76 }}
                  className={`absolute w-14 h-8 rounded-full bg-gradient-to-r ${roleTheme.primary} shadow-lg shadow-teal-500/20`}
                />
                <div className="z-10 w-full flex justify-around text-[10px] font-black uppercase tracking-widest text-white">
                  <span className={isDonor ? "text-black" : "opacity-50"}>
                    Give
                  </span>
                  <span className={!isDonor ? "text-black" : "opacity-50"}>
                    Take
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS ROW */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setShowSOS(true)}
              className="flex-shrink-0 px-5 py-3 bg-red-600 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-red-600/30 border border-red-500"
            >
              <FaHeartbeat className="animate-pulse" /> Emergency SOS
            </button>
            {isDonor && viewMode === "p2p" && (
              <button
                onClick={() => navigate("/donations")}
                className="flex-shrink-0 px-5 py-3 bg-white rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest text-teal-900 shadow-xl"
              >
                <FaBoxOpen /> Create Post
              </button>
            )}
            {user?.isAdmin && viewMode === "events" && (
              <button
                onClick={() => {
                  setEditingEventId(null);
                  setShowEventModal(true);
                }}
                className="flex-shrink-0 px-5 py-3 bg-purple-600 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest text-white shadow-xl border border-purple-400"
              >
                <FaCalendarPlus /> Post Drive
              </button>
            )}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="flex-shrink-0 px-5 py-3 bg-teal-500 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest text-white shadow-xl border border-teal-400"
              >
                <FaDownload /> App
              </button>
            )}
          </div>
        </header>

        {/* FEED TOGGLE */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            onClick={() => setViewMode("p2p")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === "p2p" ? "bg-white text-slate-900 shadow-xl" : "text-white/40"}`}
          >
            Community
          </button>
          <button
            onClick={() => setViewMode("events")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === "events" ? "bg-white text-slate-900 shadow-xl" : "text-white/40"}`}
          >
            Events
          </button>
        </div>

        {/* ========================================= */}
        {/* VIEW 1: PEER TO PEER FEED                 */}
        {/* ========================================= */}
        {viewMode === "p2p" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-white/10 backdrop-blur-xl p-3 md:p-4 rounded-2xl md:rounded-[2rem] border border-white/20 shadow-lg">
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0 scroll-smooth">
                {["All", "Blood", "Food", "Clothes", "Book"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-[11px] whitespace-nowrap transition-colors ${filterCategory === cat ? "bg-white text-teal-800" : "bg-white/10 text-white"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-[11px] font-bold outline-none cursor-pointer"
              >
                <option value="urgent" className="text-black">
                  Urgent First
                </option>
                <option value="newest" className="text-black">
                  Newest First
                </option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-white" />
              </div>
            ) : processedFeed.length === 0 ? (
              <div className="text-center py-20 text-white/70 font-medium text-sm">
                No listings found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {processedFeed.map((item) => {
                    const isMine = item.donorId?._id === user._id;
                    const alreadyReq = item.requestedBy?.some(
                      (r) => r._id === user._id,
                    );
                    const isEmergency = item.isEmergency;

                    return (
                      <motion.div
                        layout
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`relative overflow-hidden flex flex-col rounded-[2.5rem] border bg-white/5 backdrop-blur-3xl transition-all ${isEmergency ? "border-red-500/50 ring-1 ring-red-500/20 shadow-2xl shadow-red-500/10" : "border-white/10"}`}
                      >
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-2xl overflow-hidden border-2 ${isDonor ? "border-teal-500/50" : "border-blue-500/50"}`}
                              >
                                <img
                                  src={
                                    item.donorId?.profilePic ||
                                    `https://ui-avatars.com/api/?name=${item.donorId?.name}`
                                  }
                                  className="w-full h-full object-cover"
                                  alt="User"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-black text-white leading-none">
                                  {item.donorId?.name}
                                </p>
                                <p
                                  className={`text-[10px] font-black uppercase tracking-widest mt-1 opacity-50`}
                                >
                                  {item.category}{" "}
                                  {item.bloodGroup && `• ${item.bloodGroup}`}
                                </p>
                              </div>
                            </div>
                            {isMine && (
                              <button
                                onClick={() => handleDeletePost(item._id)}
                                className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                              >
                                <FaTrash size={14} />
                              </button>
                            )}
                          </div>

                          {item.image ? (
                            <div className="w-full h-44 rounded-[2rem] overflow-hidden mb-4 relative shrink-0">
                              <img
                                src={optimizeImageUrl(item.image)}
                                className="w-full h-full object-cover"
                                alt="intel"
                              />
                              {isEmergency && (
                                <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 rounded-full text-[8px] font-black uppercase text-white shadow-xl">
                                  SOS
                                </div>
                              )}
                            </div>
                          ) : (
                            item.category === "blood" && (
                              <div className="w-full h-32 mb-4 rounded-2xl overflow-hidden border border-red-500/20 bg-red-900/20 flex flex-col items-center justify-center shrink-0">
                                <FaHeartbeat className="text-4xl text-red-400 mb-2" />
                                <span className="text-2xl font-black text-white">
                                  {item.bloodGroup}
                                </span>
                              </div>
                            )
                          )}

                          <h3 className="text-xl font-black text-white leading-tight mb-2 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                            {item.description}
                          </p>

                          <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold mt-auto">
                            <FaMapMarkerAlt className={roleTheme.text} />{" "}
                            <span className="truncate">
                              {item.location?.addressText ||
                                item.donorId?.addressText ||
                                "Nearby"}
                            </span>
                          </div>
                        </div>

                        {/* TACTICAL ACTION BAR */}
                        <div className="p-4 mt-2 bg-white/5 border-t border-white/5">
                          {isMine ? (
                            <button
                              onClick={() =>
                                item.status === "active"
                                  ? setRequestsModal({
                                      isOpen: true,
                                      donation: item,
                                    })
                                  : setFulfillModal({
                                      isOpen: true,
                                      donationId: item._id,
                                      pin: "",
                                      rating: 5,
                                    })
                              }
                              className={`w-full py-4 rounded-3xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${item.status === "active" ? "bg-white text-slate-900" : "bg-yellow-500 text-black"}`}
                            >
                              {item.status === "active" ? (
                                <>
                                  <FaUsers /> View{" "}
                                  {item.requestedBy?.length || 0} Responses
                                </>
                              ) : (
                                <>
                                  <FaCheckCircle /> Verify Handshake
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (item.status === "active") {
                                    if (!alreadyReq)
                                      handleRequestItem(item._id);
                                    else toast("Awaiting approval.");
                                  }
                                }}
                                disabled={
                                  alreadyReq || item.status !== "active"
                                }
                                className={`flex-1 py-4 rounded-3xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${
                                  item.status !== "active"
                                    ? "bg-black/40 text-white/30"
                                    : alreadyReq
                                      ? "bg-white/10 text-white/30"
                                      : isEmergency
                                        ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                                        : `bg-gradient-to-r ${roleTheme.primary} text-white shadow-lg shadow-teal-500/20`
                                }`}
                              >
                                {item.status !== "active" ? (
                                  <>
                                    <FaLock /> Resolved
                                  </>
                                ) : alreadyReq ? (
                                  <>
                                    <FaCheck /> Signal Sent
                                  </>
                                ) : (
                                  <>
                                    <FaHandsHelping /> Send Signal
                                  </>
                                )}
                              </button>
                              {item.status === "pending" &&
                                item.receiverId === user._id && (
                                  <button
                                    onClick={() =>
                                      navigate(`/chat/${item._id}_${user._id}`)
                                    }
                                    className="w-14 h-14 rounded-3xl bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-95 shrink-0"
                                  >
                                    <FaCommentDots size={20} />
                                  </button>
                                )}
                            </div>
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
                  className="px-10 py-4 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  {loadingMore ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    "Request More Data"
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================= */}
        {/* VIEW 2: ORGANIZATION EVENTS FEED          */}
        {/* ========================================= */}
        {viewMode === "events" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div className="flex justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-purple-500" />
              </div>
            ) : eventsFeed.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                <FaBullhorn className="text-6xl text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  No Upcoming Events
                </h3>
                <p className="text-white/50 text-sm">
                  There are no blood camps or drives scheduled nearby.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {eventsFeed.map((event) => {
                    const isOwner = user?._id === event.organizationId?._id;
                    return (
                      <motion.div
                        layout
                        key={event._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="group relative overflow-hidden rounded-[2.5rem] border border-purple-500/30 bg-purple-900/5 backdrop-blur-3xl flex flex-col"
                      >
                        {event.image ? (
                          <div className="h-56 w-full relative overflow-hidden shrink-0">
                            <img
                              src={optimizeImageUrl(event.image)}
                              className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                              alt="event"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent" />
                            <div className="absolute top-4 right-4 flex gap-2">
                              {(user?.isAdmin || isOwner) && (
                                <>
                                  <button
                                    onClick={() => openEditEventModal(event)}
                                    className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90"
                                  >
                                    <FaEdit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event._id)}
                                    className="w-10 h-10 rounded-2xl bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 flex items-center justify-center active:scale-90"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-20 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between px-6 shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
                              {event.category}
                            </span>
                            {(user?.isAdmin || isOwner) && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditEventModal(event)}
                                  className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90"
                                >
                                  <FaEdit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event._id)}
                                  className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center active:scale-90"
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex gap-4 items-start mb-6">
                            <div className="bg-purple-600 rounded-2xl p-3 flex flex-col items-center justify-center w-16 shadow-lg shadow-purple-600/20 shrink-0">
                              <span className="text-[9px] font-black uppercase text-white/70">
                                {new Date(event.eventDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short" },
                                )}
                              </span>
                              <span className="text-2xl font-black text-white">
                                {new Date(event.eventDate).getDate()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-black text-xl text-white leading-tight mb-2">
                                {event.title}
                              </h3>
                              <div className="flex flex-col gap-1 text-purple-300/60 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                  <FaClock className="shrink-0" />{" "}
                                  {event.startTime} - {event.endTime}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <FaMapMarkerAlt className="shrink-0" />{" "}
                                  <span className="truncate">
                                    {event.locationText.split(",")[0]}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-white/50 text-[13px] leading-relaxed line-clamp-3 mb-6 flex-1">
                            {event.description}
                          </p>

                          <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-purple-400 overflow-hidden">
                                {event.organizationId?.profilePic ? (
                                  <img
                                    src={event.organizationId.profilePic}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  event.organizationId?.name?.charAt(0)
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                                {event.organizationId?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* Floating Inbox Button */}
        <button
          onClick={() => navigate("/chat/inbox")}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-white text-teal-800 hover:bg-gray-100 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white/20 active:scale-95 transition-transform"
        >
          <div className="relative">
            <FaEnvelope className="text-xl md:text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </button>

        {/* ========================================= */}
        {/* MODALS SECTION                            */}
        {/* ========================================= */}

        {/* SOS MODAL */}
        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowSOS(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-white/10 backdrop-blur-3xl border-t sm:border border-white/20 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-white"
              >
                <button
                  type="button"
                  onClick={() => setShowSOS(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/20 p-2 rounded-full"
                >
                  <FaTimes className="text-sm" />
                </button>
                <div className="flex items-center gap-3 mb-6 text-red-500">
                  <FaHeartbeat className="text-4xl animate-pulse" />
                  <h2 className="text-2xl font-black tracking-tight">
                    Emergency Request
                  </h2>
                </div>
                <form onSubmit={handleSOSSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                        Blood Group
                      </label>
                      <select
                        required
                        value={sosData.bloodGroup}
                        onChange={(e) =>
                          setSosData({ ...sosData, bloodGroup: e.target.value })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-red-500"
                      >
                        <option value="" disabled className="text-black">
                          Select
                        </option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                          (bg) => (
                            <option key={bg} value={bg} className="text-black">
                              {bg}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
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
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                      Hospital
                    </label>
                    <input
                      required
                      value={sosData.hospital}
                      onChange={(e) =>
                        setSosData({ ...sosData, hospital: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                      Area / GPS
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={sosData.addressText}
                        onChange={(e) => handleLocationType(e, false)}
                        className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleGetLocation(false)}
                        disabled={isFetchingLocation}
                        className="px-5 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30 flex items-center justify-center"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin text-lg" />
                        ) : (
                          <FaLocationArrow className="text-lg" />
                        )}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute bottom-full mb-2 z-50 w-full bg-[#111] border border-white/20 rounded-2xl max-h-40 overflow-y-auto">
                        {suggestions.map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(s, false)}
                            className="px-4 py-3 text-sm text-white/80 border-b border-white/10 cursor-pointer"
                          >
                            {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                      Details
                    </label>
                    <textarea
                      required
                      value={sosData.description}
                      onChange={(e) =>
                        setSosData({ ...sosData, description: e.target.value })
                      }
                      rows="2"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-red-500 resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-600/30 text-white"
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

        {/* EVENT CREATE/EDIT MODAL */}
        <AnimatePresence>
          {showEventModal && (
            <div className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={closeEventModal}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-lg bg-white/10 backdrop-blur-3xl border-t sm:border border-white/20 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto no-scrollbar text-white"
              >
                <button
                  type="button"
                  onClick={closeEventModal}
                  className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/20 p-2 rounded-full"
                >
                  <FaTimes className="text-sm" />
                </button>
                <div className="flex items-center gap-3 mb-6 text-purple-400">
                  <FaCalendarPlus className="text-3xl" />
                  <h2 className="text-2xl font-black tracking-tight">
                    {editingEventId ? "Edit Drive" : "Schedule Drive"}
                  </h2>
                </div>
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                      Event Title
                    </label>
                    <input
                      required
                      value={eventData.title}
                      onChange={(e) =>
                        setEventData({ ...eventData, title: e.target.value })
                      }
                      placeholder="e.g. City-Wide Blood Camp"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                        Category
                      </label>
                      <select
                        required
                        value={eventData.category}
                        onChange={(e) =>
                          setEventData({
                            ...eventData,
                            category: e.target.value,
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-purple-500"
                      >
                        <option className="text-black" value="Blood Camp">
                          Blood Camp
                        </option>
                        <option className="text-black" value="Food Drive">
                          Food Drive
                        </option>
                        <option className="text-black" value="Clothes Drive">
                          Clothes Drive
                        </option>
                        <option className="text-black" value="Fundraiser">
                          Fundraiser
                        </option>
                        <option
                          className="text-black"
                          value="General Announcement"
                        >
                          General Announcement
                        </option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                        Date
                      </label>
                      <input
                        required
                        type="date"
                        value={eventData.eventDate}
                        onChange={(e) =>
                          setEventData({
                            ...eventData,
                            eventDate: e.target.value,
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-purple-500 text-white invert-calendar-icon"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                        Start Time
                      </label>
                      <input
                        required
                        type="time"
                        value={eventData.startTime}
                        onChange={(e) =>
                          setEventData({
                            ...eventData,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-purple-500"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                        End Time
                      </label>
                      <input
                        required
                        type="time"
                        value={eventData.endTime}
                        onChange={(e) =>
                          setEventData({
                            ...eventData,
                            endTime: e.target.value,
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-purple-500"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                      Exact Location (GPS Required)
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={eventData.addressText}
                        onChange={(e) => handleLocationType(e, true)}
                        placeholder="Search address to set 10km radius..."
                        className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleGetLocation(true)}
                        disabled={isFetchingLocation}
                        className="px-5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30 flex items-center justify-center"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin text-lg" />
                        ) : (
                          <FaLocationArrow className="text-lg" />
                        )}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute bottom-full mb-2 z-50 w-full bg-[#111] border border-white/20 rounded-2xl max-h-40 overflow-y-auto">
                        {suggestions.map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(s, true)}
                            className="px-4 py-3 text-sm text-white/80 border-b border-white/10 cursor-pointer"
                          >
                            {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                      Event Poster (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEventData({ ...eventData, image: e.target.files[0] })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1">
                      Details
                    </label>
                    <textarea
                      required
                      value={eventData.description}
                      onChange={(e) =>
                        setEventData({
                          ...eventData,
                          description: e.target.value,
                        })
                      }
                      rows="3"
                      placeholder="What to bring, requirements, contact info..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-purple-500 resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !eventData.lat}
                    className="w-full mt-4 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-600/30 text-white"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaBullhorn />{" "}
                        {editingEventId
                          ? "Save Changes"
                          : "Broadcast to 10km Radius"}
                      </>
                    )}
                  </button>
                  {!eventData.lat && (
                    <p className="text-center text-[10px] text-red-500 mt-2 font-black uppercase tracking-widest">
                      ⚠️ GPS Location is required to notify nearby users
                    </p>
                  )}
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FULFILL MODAL */}
        <AnimatePresence>
          {fulfillModal.isOpen && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() =>
                  setFulfillModal({
                    isOpen: false,
                    donationId: null,
                    pin: "",
                    rating: 5,
                  })
                }
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-sm bg-white/10 backdrop-blur-3xl border-t sm:border border-white/20 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-center shadow-2xl text-white"
              >
                <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-white/30">
                  <FaLock />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2">
                  Secure Exchange
                </h2>
                <p className="text-white/50 text-xs uppercase font-bold tracking-widest mb-6">
                  Enter the 4-digit PIN
                </p>
                <form onSubmit={handleFulfillSubmit}>
                  <input
                    type="text"
                    required
                    maxLength="4"
                    placeholder="PIN"
                    value={fulfillModal.pin}
                    onChange={(e) =>
                      setFulfillModal({
                        ...fulfillModal,
                        pin: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full bg-black/40 border-2 border-dashed border-white/30 rounded-3xl px-5 py-6 text-center text-white text-3xl tracking-[1em] font-black outline-none focus:border-white mb-6"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || fulfillModal.pin.length !== 4}
                    className="w-full py-4 bg-white text-slate-900 rounded-3xl font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin mx-auto text-xl" />
                    ) : (
                      "Verify & Complete"
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* REQUESTS MODAL */}
        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() =>
                  setRequestsModal({ isOpen: false, donation: null })
                }
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-white/10 backdrop-blur-3xl border-t sm:border border-white/20 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-white"
              >
                <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-6 sm:hidden" />
                <h2 className="text-2xl font-black tracking-tight mb-1">
                  Community Requests
                </h2>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                  Select a user to connect with
                </p>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-4">
                  {requestsModal.donation.requestedBy.map((requester) => (
                    <div
                      key={requester._id}
                      className="flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded-3xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-white">
                          {requester.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-sm">
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
                        className="px-5 py-3 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md"
                      >
                        Approve
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
