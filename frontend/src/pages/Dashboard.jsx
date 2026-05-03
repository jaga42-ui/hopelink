// Developed by guruprasad and team
import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  FaUtensils,
  FaTshirt,
  FaBook,
  FaBell,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import api from "../utils/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace("/api", "")
  : "https://hopelink-api.onrender.com";

const FILTER_OPTIONS = [
  { label: "All", icon: FaBoxOpen },
  { label: "Blood", icon: FaHeartbeat },
  { label: "Medical", icon: FaBoxOpen },
  { label: "NGO Relief", icon: FaHandsHelping },
  { label: "Other", icon: FaHandsHelping },
];

const CATEGORY_META = {
  blood: {
    label: "Blood",
    icon: FaHeartbeat,
    panel:
      "bg-blazing-flame/10 text-blazing-flame border-blazing-flame/20",
  },
  medical: {
    label: "Medical",
    icon: FaBoxOpen,
    panel: "bg-pine-teal/10 text-pine-teal border-pine-teal/20",
  },
  ngo_relief: {
    label: "NGO Relief",
    icon: FaHandsHelping,
    panel:
      "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20",
  },
  other: {
    label: "Other",
    icon: FaHandsHelping,
    panel:
      "bg-dusty-lavender/10 text-dusty-lavender border-dusty-lavender/20",
  },
  general: {
    label: "General",
    icon: FaHandsHelping,
    panel: "bg-pearl-beige/60 text-pine-teal border-dusty-lavender/20",
  },
};

const MotionDiv = motion.div;
const MotionSection = motion.section;
const MotionArticle = motion.article;
const MotionButton = motion.button;
const MotionH1 = motion.h1;
const MotionP = motion.p;

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  show: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
      delay: Math.min(index * 0.035, 0.22),
    },
  }),
  exit: { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.18 } },
};

const optimizeImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("cloudinary.com")) {
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  }
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
};

const getCategoryMeta = (category) =>
  CATEGORY_META[category?.toLowerCase()] || CATEGORY_META.general;

const SkeletonCard = () => (
  <div className="relative h-[430px] overflow-hidden rounded-[2rem] border border-white/60 bg-white/55 p-5 shadow-[0_18px_50px_rgba(41,82,74,0.08)] backdrop-blur-2xl">
    <div className="dashboard-card-sheen absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    <div className="flex animate-pulse flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-white/70" />
        <div className="flex-1">
          <div className="mb-2 h-3 w-1/2 rounded-full bg-white/70" />
          <div className="h-2 w-1/3 rounded-full bg-white/60" />
        </div>
      </div>
      <div className="h-44 w-full rounded-[1.5rem] bg-white/60" />
      <div className="space-y-3">
        <div className="h-4 w-4/5 rounded-full bg-white/70" />
        <div className="h-3 w-full rounded-full bg-white/60" />
        <div className="h-3 w-2/3 rounded-full bg-white/60" />
      </div>
      <div className="mt-7 h-12 w-full rounded-2xl bg-white/60" />
    </div>
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
        setPage(1);
      } catch {
        toast.error("Failed to load feed");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (!user || !socket) return;

    const handleDonorComing = (data) => {
      setResponders((prev) => [...prev, data]);
      toast.success(`${data.donorName} is en route to help!`);
      setTimeout(
        () =>
          setResponders((prev) =>
            prev.filter((responder) => responder.blastId !== data.blastId),
          ),
        10000,
      );
    };

    const handleNewListing = (newDonation) =>
      setFeed((prev) => [newDonation, ...prev]);
    const handleListingUpdated = (updatedItem) =>
      setFeed((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item)),
      );
    const handleListingDeleted = (deletedId) =>
      setFeed((prev) => prev.filter((item) => item._id !== deletedId));

    socket.on("donor_coming", handleDonorComing);
    socket.on("new_listing", handleNewListing);
    socket.on("listing_updated", handleListingUpdated);
    socket.on("listing_deleted", handleListingDeleted);

    return () => {
      socket.off("donor_coming", handleDonorComing);
      socket.off("new_listing", handleNewListing);
      socket.off("listing_updated", handleListingUpdated);
      socket.off("listing_deleted", handleListingDeleted);
    };
  }, [user, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  const processedFeed = useMemo(
    () =>
      feed.filter(
        (item) =>
          filterCategory === "All" ||
          item.category?.toLowerCase() === filterCategory.toLowerCase(),
      ),
    [feed, filterCategory],
  );

  const dashboardStats = useMemo(() => {
    const emergencyCount = feed.filter((item) => item.isEmergency).length;
    const responderCount = feed.reduce(
      (total, item) => total + (item.requestedBy?.length || 0),
      0,
    );
    const fulfilledCount = feed.filter(
      (item) => item.status === "fulfilled",
    ).length;

    return [
      {
        label: filterCategory === "All" ? "Active Signals" : "Showing",
        value: processedFeed.length,
        icon: FaBoxOpen,
        tone: "text-pine-teal",
        bg: "bg-pine-teal/10",
        border: "border-pine-teal/15",
      },
      {
        label: "SOS Alerts",
        value: emergencyCount,
        icon: FaExclamationTriangle,
        tone: "text-blazing-flame",
        bg: "bg-blazing-flame/10",
        border: "border-blazing-flame/20",
      },
      {
        label: "Responders",
        value: responderCount,
        icon: FaUsers,
        tone: "text-dark-raspberry",
        bg: "bg-dark-raspberry/10",
        border: "border-dark-raspberry/20",
      },
      {
        label: "Completed",
        value: fulfilledCount,
        icon: FaCheckCircle,
        tone: "text-dusty-lavender",
        bg: "bg-dusty-lavender/10",
        border: "border-dusty-lavender/20",
      },
    ];
  }, [feed, filterCategory, processedFeed.length]);

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
    } catch {
      toast.error("Failed to fetch more listings.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported.");
    }

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

          if (data?.features?.length > 0) {
            const cityString = data.features[0].place_name.split(",")[0];
            setSosData((prev) => ({
              ...prev,
              addressText: cityString,
              lat: latitude,
              lng: longitude,
            }));
            setSuggestions([]);
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

          if (data?.features) {
            setSuggestions(
              data.features.map((feature) => ({
                display_name: feature.place_name,
                lat: feature.center[1],
                lon: feature.center[0],
              })),
            );
          }
        } catch {
          console.error("Autocomplete failed");
        }
      }, 600);

      setTypingTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const locationLabel =
      suggestion.display_name?.split(",").slice(0, 2).join(",") ||
      suggestion.display_name;

    setSosData((prev) => ({
      ...prev,
      addressText: locationLabel,
      lat: suggestion.lat,
      lng: suggestion.lon,
    }));
    setSuggestions([]);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
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

      const { data } = await api.post("/donations", formData);
      setFeed((prev) => [data, ...prev]);
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
    if (!window.confirm("Delete this post?")) return;

    try {
      await api.delete(`/donations/${id}`);
      setFeed((prev) => prev.filter((item) => item._id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const handleRequestItem = async (donationId) => {
    try {
      await api.post(`/donations/${donationId}/request`, {});
      setFeed((prev) =>
        prev.map((item) =>
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
      ? `URGENT: ${item.bloodGroup} blood needed at ${item.addressText?.split(",")[0] || "nearby"}. Can you help?`
      : `Sahayam: ${item.title} available near ${item.addressText?.split(",")[0] || "you"}.`;
    const shareData = {
      title: item.title,
      text: shareText,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.log("Share cancelled");
      }
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${shareData.text} -> ${shareData.url}`)}`,
      );
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="dashboard-shell relative min-h-screen overflow-hidden bg-pearl-beige font-sans text-pine-teal">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="dashboard-grid absolute inset-0 opacity-30 md:opacity-60" />
          <div className="dashboard-sheen absolute -top-24 left-[-25%] hidden h-80 w-[150%] opacity-60 md:block" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-32 md:pb-24">
          <div className="pointer-events-none fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 flex-col gap-2">
            <AnimatePresence>
              {responders.map((res, index) => (
                <MotionDiv
                  key={`${res.blastId}-${index}`}
                  initial={{ y: -20, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.96 }}
                  className="pointer-events-auto flex items-center gap-3 rounded-full border border-blazing-flame/30 bg-white/90 px-5 py-3 text-pine-teal shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blazing-flame/10">
                    <FaRunning className="text-blazing-flame" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">
                    {res.donorName} is coming!
                  </span>
                </MotionDiv>
              ))}
            </AnimatePresence>
          </div>

          <header className="border-b border-dusty-lavender/30 pb-4 pt-5 md:pb-7 md:pt-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <MotionDiv
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 hidden items-center gap-2 rounded-full border border-pine-teal/15 bg-white/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm backdrop-blur-xl sm:inline-flex"
                >
                  <span className="h-2 w-2 rounded-full bg-blazing-flame shadow-[0_0_14px_rgba(255,74,28,0.8)]" />
                  Live Community Feed
                </MotionDiv>
                <MotionH1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 }}
                  className="text-2xl font-black leading-tight tracking-tight text-pine-teal sm:text-4xl md:text-6xl"
                >
                  <span className="sm:hidden">Hi, </span>
                  <span className="hidden sm:inline">Welcome, </span>
                  <br className="hidden sm:block md:hidden" />
                  {user?.name?.split(" ")[0] || "Friend"}.
                </MotionH1>
                <MotionP
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 hidden max-w-2xl text-sm font-bold leading-relaxed text-pine-teal/70 sm:block md:text-base"
                >
                  {isDonor
                    ? "Share supplies, answer requests, and keep urgent posts visible."
                    : "Track available support, respond quickly, and keep emergency needs moving."}
                </MotionP>
              </div>

              <MotionDiv
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 220 }}
                className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-dusty-lavender/30 bg-white/50 p-1.5 shadow-sm backdrop-blur-xl sm:flex sm:w-auto sm:rounded-[1.5rem] sm:border-white/70 sm:bg-white/65 sm:p-2 sm:shadow-[0_18px_45px_rgba(41,82,74,0.1)]"
              >
                <MotionButton
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/donations")}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md transition-all sm:min-h-12 sm:rounded-2xl sm:py-3 sm:shadow-lg md:px-5 ${
                    isDonor
                      ? "bg-pine-teal shadow-pine-teal/25"
                      : "bg-dark-raspberry shadow-dark-raspberry/25"
                  }`}
                >
                  <FaBoxOpen className="text-sm" />
                  {isDonor ? "Post" : "Request"}
                </MotionButton>

                {!user?.isAdmin && (
                  <MotionButton
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={switchRole}
                    className="hidden min-h-12 items-center justify-center gap-2 rounded-2xl border border-dusty-lavender/20 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm transition-all hover:border-pine-teal/30 sm:flex md:px-5"
                  >
                    <FaUsers className="text-sm text-dark-raspberry" />
                    {isDonor ? "Receiver" : "Donor"}
                  </MotionButton>
                )}

                <MotionButton
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={enableNotifications}
                  className="hidden min-h-12 items-center justify-center gap-2 rounded-2xl border border-dusty-lavender/20 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm transition-all hover:border-blazing-flame/30 sm:flex md:px-5"
                >
                  <FaBell className="text-sm text-blazing-flame" />
                  Alerts
                </MotionButton>

                <MotionButton
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowSOS(true)}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blazing-flame px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-blazing-flame/20 transition-all sm:min-h-12 sm:rounded-2xl sm:py-3 sm:shadow-lg sm:shadow-blazing-flame/25 md:px-5"
                >
                  <FaHeartbeat className="text-sm" />
                  SOS
                </MotionButton>
              </MotionDiv>
            </div>
          </header>

          <MotionSection
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
            className="hidden grid-cols-2 gap-3 py-6 sm:grid lg:grid-cols-4"
          >
            {dashboardStats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <MotionDiv
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className={`relative overflow-hidden rounded-[1.5rem] border ${stat.border} bg-white/65 p-4 shadow-[0_14px_35px_rgba(41,82,74,0.07)] backdrop-blur-xl`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-dusty-lavender">
                        {stat.label}
                      </p>
                      <p className="mt-2 truncate text-2xl font-black tracking-tight text-pine-teal">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${stat.border} ${stat.bg}`}
                    >
                      <StatIcon className={`text-lg ${stat.tone}`} />
                    </div>
                  </div>
                </MotionDiv>
              );
            })}
          </MotionSection>

          <div className="sticky top-0 z-30 -mx-4 mb-5 border-y border-dusty-lavender/30 bg-pearl-beige/95 px-4 py-2.5 backdrop-blur-xl sm:mb-6 md:static md:mx-0 md:rounded-[1.5rem] md:border md:bg-white/50">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {FILTER_OPTIONS.map((option) => {
                const FilterIcon = option.icon;
                const isActive = filterCategory === option.label;

                return (
                  <MotionButton
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    key={option.label}
                    onClick={() => setFilterCategory(option.label)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-[10px] ${
                      isActive
                        ? "border-pine-teal bg-pine-teal text-white shadow-lg shadow-pine-teal/20"
                        : "border-dusty-lavender/20 bg-white/50 text-dusty-lavender shadow-sm hover:border-pine-teal/20 hover:text-pine-teal sm:border-white/70 sm:bg-white/65"
                    }`}
                  >
                    <FilterIcon className="text-xs sm:text-sm" />
                    {option.label}
                  </MotionButton>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((number) => (
                <SkeletonCard key={number} />
              ))}
            </div>
          ) : processedFeed.length === 0 ? (
            <MotionDiv
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-dashed border-pine-teal/20 bg-white/55 px-6 py-20 text-center shadow-[0_18px_45px_rgba(41,82,74,0.08)] backdrop-blur-xl"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-pine-teal/10 bg-pine-teal/10 text-pine-teal">
                <FaBoxOpen className="text-3xl" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-pine-teal">
                No active signals
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-relaxed text-pine-teal/60">
                Try another category or create a fresh community listing.
              </p>
              <button
                onClick={() => navigate("/donations")}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-pine-teal px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-pine-teal/25 transition-all active:scale-95"
              >
                <FaBoxOpen />
                New Listing
              </button>
            </MotionDiv>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {processedFeed.map((item, index) => {
                  const donorId = item.donorId?._id || item.donorId;
                  const receiverId = item.receiverId?._id || item.receiverId;
                  const isMine = donorId === user._id;
                  const alreadyReq = item.requestedBy?.some(
                    (requester) => (requester._id || requester) === user._id,
                  );
                  const isApprovedReceiver =
                    item.status === "pending" && receiverId === user._id;
                  const meta = getCategoryMeta(item.category);
                  const CategoryIcon = meta.icon;
                  const avatarName = encodeURIComponent(
                    item.donorId?.name || "Sahayam User",
                  );
                  const createdAt = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "Recently";

                  return (
                    <MotionArticle
                      layout
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      whileHover={{ y: -6 }}
                      key={item._id}
                      className={`group relative flex min-h-[430px] flex-col overflow-hidden rounded-[2rem] border bg-white/70 p-4 shadow-[0_18px_45px_rgba(41,82,74,0.08)] backdrop-blur-2xl transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(41,82,74,0.16)] ${
                        item.isEmergency
                          ? "border-blazing-flame/40"
                          : "border-white/70"
                      }`}
                    >
                      <div className="dashboard-card-sheen absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                      <div
                        className={`absolute inset-x-0 top-0 h-1 ${
                          item.isEmergency
                            ? "bg-blazing-flame"
                            : "bg-gradient-to-r from-pine-teal via-dusty-lavender to-dark-raspberry"
                        }`}
                      />

                      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={
                              item.donorId?.profilePic ||
                              `https://ui-avatars.com/api/?name=${avatarName}&background=e8dab2&color=29524a`
                            }
                            alt="User"
                            className="h-11 w-11 shrink-0 rounded-2xl border border-white/70 object-cover shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate text-sm font-black tracking-tight text-pine-teal">
                              <span className="truncate">
                                {item.donorId?.name || "Community Member"}
                              </span>
                              {item.donorId?.points >= 50 && (
                                <FaMedal className="shrink-0 text-blazing-flame" />
                              )}
                            </p>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-dusty-lavender">
                              {createdAt}
                            </p>
                          </div>
                        </div>

                        {item.isEmergency ? (
                          <span className="flex shrink-0 items-center gap-1 rounded-xl bg-blazing-flame px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-blazing-flame/25">
                            <FaExclamationTriangle />
                            SOS
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-xl border border-white/70 bg-white/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-pine-teal shadow-sm">
                            {meta.label}
                          </span>
                        )}
                      </div>

                      {item.image ? (
                        <div className="relative z-10 h-44 w-full shrink-0 overflow-hidden rounded-[1.5rem] bg-pearl-beige shadow-inner">
                          <img
                            src={optimizeImageUrl(item.image)}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            alt={item.title || "Donation item"}
                          />
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-pine-teal/30 to-transparent" />
                        </div>
                      ) : item.category?.toLowerCase() === "blood" ? (
                        <div
                          className={`relative z-10 flex h-44 w-full shrink-0 flex-col items-center justify-center overflow-hidden rounded-[1.5rem] text-white shadow-inner ${
                            item.isEmergency
                              ? "bg-gradient-to-br from-blazing-flame to-[#e03a12]"
                              : "bg-gradient-to-br from-dark-raspberry to-[#850e53]"
                          }`}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_45%,rgba(0,0,0,0.12))]" />
                          <FaHeartbeat className="relative mb-2 text-4xl drop-shadow-md" />
                          <span className="relative text-4xl font-black drop-shadow-md">
                            {item.bloodGroup || "Blood"}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`relative z-10 flex h-44 w-full shrink-0 flex-col items-center justify-center rounded-[1.5rem] border ${meta.panel} shadow-inner`}
                        >
                          <CategoryIcon className="mb-3 text-4xl" />
                          <span className="text-xs font-black uppercase tracking-[0.2em]">
                            {meta.label}
                          </span>
                        </div>
                      )}

                      <div className="relative z-10 mt-4 flex flex-1 flex-col">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          {item.quantity && (
                            <span className="rounded-lg border border-pine-teal/10 bg-pine-teal/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-pine-teal">
                              {item.quantity}
                            </span>
                          )}
                          <span className="rounded-lg border border-dusty-lavender/15 bg-white/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-dusty-lavender">
                            {item.status || "active"}
                          </span>
                        </div>

                        <h3 className="mb-2 line-clamp-2 text-lg font-black leading-snug tracking-tight text-pine-teal">
                          {item.title}
                        </h3>
                        <p className="mb-4 line-clamp-2 flex-1 text-sm font-medium leading-relaxed text-pine-teal/70">
                          {item.description}
                        </p>
                        <div className="mt-auto flex items-center gap-2 rounded-2xl border border-dark-raspberry/10 bg-dark-raspberry/5 p-3 text-[10px] font-black uppercase tracking-widest text-dark-raspberry">
                          <FaMapMarkerAlt className="shrink-0 text-sm" />
                          <span className="truncate">
                            {item.addressText || "Location pending"}
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 mt-4 flex gap-3 border-t border-dusty-lavender/10 pt-4">
                        {isMine ? (
                          item.status === "fulfilled" ? (
                            <button
                              disabled
                              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/60 py-3.5 text-[10px] font-black uppercase tracking-widest text-dusty-lavender shadow-sm"
                            >
                              <FaCheckCircle />
                              Completed
                            </button>
                          ) : (
                            <>
                              <MotionButton
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() =>
                                  setRequestsModal({
                                    isOpen: true,
                                    donation: item,
                                  })
                                }
                                disabled={!item.requestedBy?.length}
                                className={`flex flex-[2] items-center justify-center gap-2 rounded-2xl border py-3.5 text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${
                                  item.requestedBy?.length > 0
                                    ? "border-pine-teal/20 bg-white text-pine-teal hover:border-pine-teal/40"
                                    : "cursor-not-allowed border-white/60 bg-white/50 text-dusty-lavender"
                                }`}
                              >
                                <FaUsers />
                                Requests ({item.requestedBy?.length || 0})
                              </MotionButton>
                              <MotionButton
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => handleDeletePost(item._id)}
                                aria-label="Delete post"
                                className="flex w-12 items-center justify-center rounded-2xl border border-white/70 bg-white text-blazing-flame shadow-sm transition-all hover:border-blazing-flame/40"
                              >
                                <FaTrash className="text-sm" />
                              </MotionButton>
                            </>
                          )
                        ) : item.status === "fulfilled" ? (
                          <button
                            disabled
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/60 py-3.5 text-[10px] font-black uppercase tracking-widest text-dusty-lavender shadow-sm"
                          >
                            <FaLock />
                            Closed
                          </button>
                        ) : isApprovedReceiver ? (
                          <MotionButton
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() =>
                              navigate(`/chat/${item._id}_${user._id}`)
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-dark-raspberry to-[#850e53] py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-dark-raspberry/25"
                          >
                            <FaCommentDots className="text-sm" />
                            Connect
                          </MotionButton>
                        ) : alreadyReq ? (
                          <button
                            disabled
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-pine-teal/20 bg-white py-3.5 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm"
                          >
                            <FaCheck />
                            Sent
                          </button>
                        ) : (
                          <>
                            <MotionButton
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => handleRequestItem(item._id)}
                              className={`flex flex-[2] items-center justify-center gap-2 rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                                item.isEmergency
                                  ? "bg-gradient-to-r from-blazing-flame to-[#e03a12] shadow-blazing-flame/25"
                                  : "bg-gradient-to-r from-pine-teal to-[#1a3630] shadow-pine-teal/25"
                              }`}
                            >
                              <FaHandsHelping className="text-sm" />
                              {item.isEmergency ? "Respond" : "Claim"}
                            </MotionButton>
                            <MotionButton
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleShare(item)}
                              aria-label="Share post"
                              className="flex w-12 items-center justify-center rounded-2xl border border-white/70 bg-white text-pine-teal shadow-sm transition-all hover:border-pine-teal/40"
                            >
                              <FaShareAlt className="text-sm" />
                            </MotionButton>
                          </>
                        )}
                      </div>
                    </MotionArticle>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {hasMore && (
            <div className="mt-12 flex justify-center">
              <MotionButton
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={loadMoreListings}
                disabled={loadingMore}
                className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-pine-teal shadow-xl backdrop-blur-xl disabled:opacity-60"
              >
                {loadingMore ? (
                  <FaSpinner className="animate-spin text-lg" />
                ) : (
                  <>
                    <FaBoxOpen />
                    Load More
                  </>
                )}
              </MotionButton>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center p-4 sm:items-center">
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/60 backdrop-blur-md"
                onClick={() => setShowSOS(false)}
              />
              <MotionDiv
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_24px_70px_rgba(41,82,74,0.22)] backdrop-blur-2xl sm:p-8"
              >
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-blazing-flame">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blazing-flame/20 bg-blazing-flame/10">
                      <FaExclamationTriangle className="text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight">
                        SOS Broadcast
                      </h2>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-dusty-lavender">
                        Urgent blood request
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSOS(false)}
                    className="rounded-full bg-pearl-beige p-3 text-dusty-lavender shadow-inner transition-colors hover:text-pine-teal"
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
                      className="flex-1 rounded-2xl border border-dusty-lavender/30 bg-white px-4 py-4 text-xs font-black uppercase tracking-widest text-pine-teal shadow-sm outline-none focus:border-blazing-flame"
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
                      className="w-24 rounded-2xl border border-dusty-lavender/30 bg-white px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-pine-teal shadow-sm outline-none focus:border-blazing-flame"
                    />
                  </div>
                  <input
                    required
                    placeholder="Hospital / Facility Name"
                    value={sosData.hospital}
                    onChange={(e) =>
                      setSosData({ ...sosData, hospital: e.target.value })
                    }
                    className="w-full rounded-2xl border border-dusty-lavender/30 bg-white px-5 py-4 text-sm font-bold text-pine-teal shadow-sm outline-none focus:border-blazing-flame"
                  />

                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        required
                        placeholder="Search Area"
                        value={sosData.addressText}
                        onChange={handleLocationType}
                        className="min-w-0 flex-1 rounded-2xl border border-dusty-lavender/30 bg-white px-5 py-4 text-sm font-bold text-pine-teal shadow-sm outline-none focus:border-blazing-flame"
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isFetchingLocation}
                        className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-pine-teal text-white shadow-md transition-colors hover:bg-[#1a3630] disabled:opacity-60"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin text-lg" />
                        ) : (
                          <FaLocationArrow className="text-lg" />
                        )}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-dusty-lavender/30 bg-white shadow-xl">
                        {suggestions.map((suggestion, index) => (
                          <button
                            type="button"
                            key={`${suggestion.display_name}-${index}`}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="block w-full border-b border-dusty-lavender/10 px-5 py-3.5 text-left text-xs font-bold text-pine-teal transition-colors last:border-0 hover:bg-pearl-beige"
                          >
                            {suggestion.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    required
                    rows="2"
                    placeholder="Critical patient details..."
                    value={sosData.description}
                    onChange={(e) =>
                      setSosData({ ...sosData, description: e.target.value })
                    }
                    className="w-full resize-none rounded-2xl border border-dusty-lavender/30 bg-white px-5 py-4 text-sm font-bold text-pine-teal shadow-sm outline-none focus:border-blazing-flame"
                  />

                  <MotionButton
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blazing-flame to-[#e03a12] py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_35px_rgba(255,74,28,0.35)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin text-lg" />
                    ) : (
                      <>
                        <FaHeartbeat />
                        Deploy SOS
                      </>
                    )}
                  </MotionButton>
                </form>
              </MotionDiv>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/60 backdrop-blur-md"
                onClick={() =>
                  setRequestsModal({ isOpen: false, donation: null })
                }
              />
              <MotionDiv
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
              >
                <div className="mb-5 flex items-center justify-between border-b border-dusty-lavender/20 pb-5">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-pine-teal">
                      Active Requests
                    </h2>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-dusty-lavender">
                      Select a responder
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setRequestsModal({ isOpen: false, donation: null })
                    }
                    className="rounded-full bg-pearl-beige p-3 text-dusty-lavender shadow-inner transition-colors hover:text-pine-teal"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="max-h-[50vh] space-y-3 overflow-y-auto pb-2 no-scrollbar">
                  {requestsModal.donation.requestedBy.map((requester) => (
                    <div
                      key={requester._id}
                      className="flex items-center justify-between rounded-2xl border border-dusty-lavender/20 bg-white p-4 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-pine-teal/20 bg-pine-teal/10 text-sm font-black uppercase text-pine-teal shadow-sm">
                          {requester.name?.charAt(0)}
                        </div>
                        <span className="truncate text-sm font-bold leading-none text-pine-teal">
                          {requester.name}
                        </span>
                      </div>
                      <MotionButton
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() =>
                          handleApproveRequest(
                            requestsModal.donation._id,
                            requester._id,
                          )
                        }
                        disabled={approvingId === requester._id}
                        className="flex items-center justify-center gap-2 rounded-xl bg-pine-teal px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-md disabled:opacity-60"
                      >
                        {approvingId === requester._id ? (
                          <FaSpinner className="animate-spin text-sm" />
                        ) : (
                          <>
                            <FaCheck />
                            Approve
                          </>
                        )}
                      </MotionButton>
                    </div>
                  ))}
                </div>
              </MotionDiv>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Dashboard;
