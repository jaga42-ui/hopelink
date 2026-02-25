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
  FaEnvelope,
  FaCheckCircle,
  FaLeaf,
  FaCalendarAlt,
  FaTags,
  FaBook,
  FaSearch,
  FaLock,
  FaStar,
  FaUsers,
  FaRunning,
  FaDownload,
  FaHandsHelping,
  FaBullhorn,
  FaCalendarPlus,
  FaClock,
  FaEdit, // 👉 NEW: Imported Edit Icon
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
  const [editingEventId, setEditingEventId] = useState(null); // 👉 NEW: Tracks which event we are editing
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 👉 NEW: Opens the modal pre-filled with event data for editing
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
      image: null, // Keep null so we don't accidentally send a string back
    });
    setShowEventModal(true);
  };

  // 👉 NEW: Clears form when modal is closed
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

  // 👉 UPGRADED: Handles both Create (POST) and Edit (PUT)
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
        // We are editing an existing event!
        const { data } = await api.put(`/events/${editingEventId}`, formData);
        setEventsFeed(
          eventsFeed.map((ev) => (ev._id === editingEventId ? data : ev)),
        );
        toast.success("Event updated successfully!");
      } else {
        // We are creating a new event!
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

        {/* HEADER AREA */}
        <header className="mb-6 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight">
              COMMUNITY HUB
            </h1>
          </div>

          <div className="w-full md:w-auto grid grid-cols-2 md:flex gap-3 md:gap-4 items-center">
            {user && !user.isAdmin && (
              <button
                onClick={() => {
                  setLocalRole(localRole === "donor" ? "receiver" : "donor");
                  switchRole();
                }}
                className="col-span-2 md:col-span-1 px-4 py-3 md:py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center gap-3 active:bg-white/20 transition-all shadow-lg"
              >
                <span
                  className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${localRole === "donor" ? "text-white" : "text-white/50"}`}
                >
                  Donor
                </span>
                <div className="w-10 h-5 bg-black/30 rounded-full relative shrink-0 border border-white/10">
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out ${localRole === "donor" ? "" : "translate-x-[19px]"}`}
                  ></div>
                </div>
                <span
                  className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${localRole === "receiver" ? "text-white" : "text-white/50"}`}
                >
                  Receiver
                </span>
              </button>
            )}

            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="col-span-2 md:col-span-1 px-4 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl font-bold text-[11px] md:text-sm shadow-xl flex items-center justify-center gap-2"
              >
                <FaDownload /> App
              </button>
            )}

            {localRole === "donor" && viewMode === "p2p" && (
              <button
                onClick={() => navigate("/donations")}
                className="px-4 py-3 bg-white text-teal-700 rounded-2xl font-extrabold text-[11px] md:text-sm shadow-xl flex items-center justify-center gap-2"
              >
                <FaBoxOpen /> Post Item
              </button>
            )}

            {/* If Admin and in Events mode, show Post Event button */}
            {user?.isAdmin && viewMode === "events" && (
              <button
                onClick={() => {
                  setEditingEventId(null); // Ensure we are in "Create" mode
                  setShowEventModal(true);
                }}
                className="col-span-2 md:col-span-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-extrabold text-[11px] md:text-sm shadow-xl flex items-center justify-center gap-2 border border-purple-500"
              >
                <FaCalendarPlus /> Create Event
              </button>
            )}

            {viewMode === "p2p" && (
              <button
                onClick={() => setShowSOS(true)}
                className="col-span-2 md:col-span-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-extrabold text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 border border-red-500"
              >
                <FaHeartbeat className="animate-pulse" /> SOS
              </button>
            )}
          </div>
        </header>

        {/* THE GRAND TOGGLE (P2P vs EVENTS) */}
        <div className="flex justify-center mb-8">
          <div className="bg-black/30 p-1.5 rounded-2xl border border-white/10 inline-flex w-full md:w-auto">
            <button
              onClick={() => setViewMode("p2p")}
              className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === "p2p" ? "bg-white text-teal-900 shadow-xl" : "text-white/50 hover:text-white"}`}
            >
              <FaUsers className="text-lg" /> Community Feed
            </button>
            <button
              onClick={() => setViewMode("events")}
              className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === "events" ? "bg-purple-600 text-white shadow-xl border border-purple-500" : "text-white/50 hover:text-white"}`}
            >
              <FaBullhorn className="text-lg" /> Local Events
            </button>
          </div>
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
            {/* Filters */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {processedFeed.map((item) => {
                  const isMine = item.donorId?._id === user._id;
                  const isEmergency = item.isEmergency;
                  const isRequest =
                    item.listingType === "request" && !isEmergency;
                  const alreadyRequested = item.requestedBy?.some(
                    (req) => req._id === user._id,
                  );
                  const isReceiver = item.receiverId === user._id;

                  let bannerClass = "bg-white/5 text-white/50";
                  let bannerText = "Broadcasting...";
                  let bannerIcon = (
                    <FaSpinner className="animate-spin opacity-50" />
                  );
                  if (isMine) {
                    if (
                      item.status === "active" &&
                      item.requestedBy?.length > 0
                    ) {
                      bannerClass = "bg-teal-500 text-white";
                      bannerText = `View Responders`;
                      bannerIcon = <FaUsers />;
                    } else if (item.status === "pending") {
                      bannerClass = "bg-yellow-500 text-black";
                      bannerText = "Complete Handshake";
                      bannerIcon = <FaCheckCircle />;
                    }
                  } else {
                    if (item.status === "active") {
                      if (alreadyRequested) {
                        bannerClass = "bg-white/10 text-white/50";
                        bannerText = "Response Pending...";
                        bannerIcon = (
                          <FaSpinner className="animate-spin opacity-50" />
                        );
                      } else {
                        bannerClass = isEmergency
                          ? "bg-red-600 text-white"
                          : "bg-white text-teal-900";
                        bannerText = isRequest ? "Offer Help" : "Respond";
                        bannerIcon = <FaHandsHelping />;
                      }
                    } else if (item.status === "pending") {
                      if (isReceiver) {
                        bannerClass = "bg-blue-600 text-white";
                        bannerText = `PIN: ${item.pickupPIN}`;
                        bannerIcon = <FaCommentDots />;
                      } else {
                        bannerClass = "bg-black/40 text-white/30";
                        bannerText = "Resolved";
                        bannerIcon = <FaLock />;
                      }
                    }
                  }

                  let cardStyle = isEmergency
                    ? "bg-red-900/30 border-red-500/30"
                    : isRequest
                      ? "bg-blue-900/30 border-blue-500/30"
                      : "bg-white/5 border-white/10";

                  return (
                    <motion.div
                      key={item._id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (isMine) {
                          if (
                            item.status === "active" &&
                            item.requestedBy?.length > 0
                          )
                            setRequestsModal({ isOpen: true, donation: item });
                          else if (item.status === "pending")
                            setFulfillModal({
                              isOpen: true,
                              donationId: item._id,
                              pin: "",
                              rating: 5,
                            });
                        } else {
                          if (item.status === "active") {
                            if (!alreadyRequested) handleRequestItem(item._id);
                            else toast("Awaiting approval.");
                          } else if (item.status === "pending" && isReceiver)
                            navigate(`/chat/${item._id}_${user._id}`);
                        }
                      }}
                      className={`rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border cursor-pointer group ${cardStyle}`}
                    >
                      {isMine && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(item._id);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 z-20"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      )}
                      {isEmergency && (
                        <div className="w-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1 z-10">
                          <FaExclamationTriangle className="inline mr-1" />{" "}
                          Emergency
                        </div>
                      )}

                      <div className="p-5 md:p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                          {item.donorId?.profilePic ? (
                            <img
                              src={item.donorId.profilePic}
                              className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white uppercase shadow-sm border border-white/10">
                              {item.donorId?.name?.charAt(0) || "?"}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-bold text-sm leading-tight">
                              {item.donorId?.name || "Unknown"}
                            </p>
                            <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">
                              {item.category}{" "}
                              {item.bloodGroup && `• ${item.bloodGroup}`}
                            </p>
                          </div>
                        </div>

                        {item.image ? (
                          <div className="w-full h-44 mb-4 rounded-2xl overflow-hidden relative flex-shrink-0 border border-white/10">
                            <img
                              src={optimizeImageUrl(item.image)}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          item.category === "blood" && (
                            <div className="w-full h-32 mb-4 rounded-2xl overflow-hidden border border-red-500/20 bg-red-900/20 flex flex-col items-center justify-center">
                              <FaHeartbeat className="text-4xl text-red-400 mb-2" />
                              <span className="text-2xl font-black text-white">
                                {item.bloodGroup}
                              </span>
                            </div>
                          )
                        )}

                        <h3 className="text-lg font-bold text-white mb-1.5 leading-snug drop-shadow-sm line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-white/70 text-sm mb-5 flex-1 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-medium mt-auto">
                          <FaMapMarkerAlt className="flex-shrink-0" />
                          <span className="truncate">
                            {item.location?.addressText ||
                              item.donorId?.addressText ||
                              "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-full py-4 flex items-center justify-center gap-2 font-black uppercase tracking-[0.15em] text-[10px] transition-all ${bannerClass}`}
                      >
                        {bannerIcon} {bannerText}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMoreListings}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <FaSpinner className="animate-spin text-lg" />
                  ) : (
                    "Load More Intel"
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
                {eventsFeed.map((event) => {
                  // 👉 NEW: Check if the current user is the creator of the event
                  const isEventOwner = user?._id === event.organizationId?._id;

                  return (
                    <div
                      key={event._id}
                      className="bg-gradient-to-br from-purple-900/40 to-black/60 backdrop-blur-xl border border-purple-500/30 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative group"
                    >
                      {/* 👉 NEW: Edit & Delete buttons show if Owner or Admin */}
                      {(user?.isAdmin || isEventOwner) && (
                        <div className="absolute top-3 right-3 flex gap-2 z-20">
                          <button
                            onClick={() => openEditEventModal(event)}
                            className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white/50 hover:text-blue-400 transition-colors"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      )}

                      {event.image ? (
                        <div className="h-48 w-full relative overflow-hidden">
                          <img
                            src={optimizeImageUrl(event.image)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-4 left-4">
                            <span className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                              {event.category}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 w-full bg-purple-900/50 flex items-center justify-center border-b border-purple-500/30 relative">
                          <FaCalendarAlt className="text-5xl text-purple-400/50" />
                          <span className="absolute bottom-3 left-4 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                            {event.category}
                          </span>
                        </div>
                      )}

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex gap-4 items-start mb-4 bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="bg-purple-500/20 text-purple-300 rounded-lg p-2 flex flex-col items-center justify-center w-14 shrink-0 border border-purple-500/30">
                            <span className="text-[10px] font-bold uppercase">
                              {new Date(event.eventDate).toLocaleDateString(
                                "en-US",
                                { month: "short" },
                              )}
                            </span>
                            <span className="text-xl font-black">
                              {new Date(event.eventDate).getDate()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white leading-tight mb-1">
                              {event.title}
                            </h3>
                            <p className="text-white/60 text-xs font-medium flex items-center gap-1.5">
                              <FaClock className="text-purple-400" />{" "}
                              {event.startTime} - {event.endTime}
                            </p>
                          </div>
                        </div>

                        <p className="text-white/70 text-sm mb-6 flex-1 line-clamp-3">
                          {event.description}
                        </p>

                        <div className="mt-auto border-t border-white/10 pt-4 flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            {event.organizationId?.profilePic ? (
                              <img
                                src={event.organizationId.profilePic}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                                {event.organizationId?.name?.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs font-bold text-white/80">
                              {event.organizationId?.name}
                            </span>
                            <FaCheckCircle
                              className="text-teal-400 text-[10px]"
                              title="Verified Organization"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-medium">
                            <FaMapMarkerAlt className="shrink-0 text-red-400" />
                            <span className="truncate">
                              {event.locationText}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Floating Inbox Button */}
        <button
          onClick={() => navigate("/chat/inbox")}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-white text-teal-800 hover:bg-gray-100 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white/20"
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
                className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border-t sm:border border-white/20 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-white"
              >
                <button
                  type="button"
                  onClick={() => setShowSOS(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white"
                >
                  <FaTimes className="text-xl" />
                </button>
                <div className="flex items-center gap-3 mb-6 text-red-400">
                  <FaHeartbeat className="text-4xl animate-pulse" />
                  <h2 className="text-2xl font-black">Emergency Request</h2>
                </div>
                <form onSubmit={handleSOSSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 block mb-1">
                        Blood Group
                      </label>
                      <select
                        required
                        value={sosData.bloodGroup}
                        onChange={(e) =>
                          setSosData({ ...sosData, bloodGroup: e.target.value })
                        }
                        className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-red-400"
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
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 block mb-1">
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
                        className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 block mb-1">
                      Hospital
                    </label>
                    <input
                      required
                      value={sosData.hospital}
                      onChange={(e) =>
                        setSosData({ ...sosData, hospital: e.target.value })
                      }
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-red-400"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 block mb-1">
                      Area / GPS
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={sosData.addressText}
                        onChange={(e) => handleLocationType(e, false)}
                        className="flex-1 w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-red-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleGetLocation(false)}
                        disabled={isFetchingLocation}
                        className="px-4 bg-red-500/20 text-red-300 rounded-xl border border-red-500/40 flex items-center"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin text-lg" />
                        ) : (
                          <FaLocationArrow className="text-lg" />
                        )}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute bottom-full mb-2 z-50 w-full bg-[#111] border border-white/20 rounded-xl max-h-40 overflow-y-auto">
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
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 block mb-1">
                      Details
                    </label>
                    <textarea
                      required
                      value={sosData.description}
                      onChange={(e) =>
                        setSosData({ ...sosData, description: e.target.value })
                      }
                      rows="2"
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-red-400"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-50"
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

        {/* 👉 CREATE / EDIT EVENT MODAL */}
        <AnimatePresence>
          {showEventModal && (
            <div className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={closeEventModal} // 👉 NEW
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="relative w-full max-w-lg bg-white/10 backdrop-blur-2xl border-t sm:border border-white/20 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto no-scrollbar text-white"
              >
                <button
                  type="button"
                  onClick={closeEventModal} // 👉 NEW
                  className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/40 p-2 rounded-full"
                >
                  <FaTimes />
                </button>
                <div className="flex items-center gap-3 mb-6 text-purple-400">
                  <FaCalendarPlus className="text-3xl" />
                  <h2 className="text-xl sm:text-2xl font-black">
                    {editingEventId ? "Edit Drive" : "Schedule Drive"}
                  </h2>
                </div>

                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                      Event Title
                    </label>
                    <input
                      required
                      value={eventData.title}
                      onChange={(e) =>
                        setEventData({ ...eventData, title: e.target.value })
                      }
                      placeholder="e.g. City-Wide Blood Camp"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400"
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
                      <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400 text-white invert-calendar-icon"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                      Exact Location (GPS Required)
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={eventData.addressText}
                        onChange={(e) => handleLocationType(e, true)}
                        placeholder="Search address to set 10km radius..."
                        className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleGetLocation(true)}
                        disabled={isFetchingLocation}
                        className="px-4 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/40 flex items-center"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin text-lg" />
                        ) : (
                          <FaLocationArrow className="text-lg" />
                        )}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute bottom-full mb-2 z-50 w-full bg-[#111] border border-white/20 rounded-xl max-h-40 overflow-y-auto">
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
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                      Event Poster (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEventData({ ...eventData, image: e.target.files[0] })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-purple-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
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
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400 resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !eventData.lat}
                    className="w-full mt-4 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all border border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
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
                    <p className="text-center text-[10px] text-red-400 mt-2 font-bold uppercase">
                      ⚠️ GPS Location is required to notify nearby users
                    </p>
                  )}
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Fulfill Modal */}
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
                className="relative w-full max-w-sm bg-white/10 backdrop-blur-2xl border-t sm:border border-white/20 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 text-center shadow-2xl text-white"
              >
                <div className="w-14 h-14 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  <FaLock />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">
                  Secure Exchange
                </h2>
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
                    className="w-full bg-black/30 border-2 border-dashed border-white/40 rounded-2xl px-5 py-4 text-center text-white text-2xl tracking-[0.5em] font-black outline-none mb-6 mt-4"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || fulfillModal.pin.length !== 4}
                    className="w-full py-4 bg-white text-teal-800 rounded-xl font-extrabold uppercase disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      "Verify & Complete"
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Requests Modal */}
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
                className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border-t sm:border border-white/20 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl text-white"
              >
                <h2 className="text-xl font-bold mb-6">Community Requests</h2>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-4">
                  {requestsModal.donation.requestedBy.map((requester) => (
                    <div
                      key={requester._id}
                      className="flex items-center justify-between bg-black/20 border border-white/10 p-3 sm:p-4 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
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
                        className="px-4 py-2.5 bg-white text-teal-800 rounded-lg text-xs font-extrabold"
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
