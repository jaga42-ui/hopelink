import { createContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../utils/api";
import { requestFirebaseToken } from "../firebase";

const AuthContext = createContext();

// 👉 THE FIX: Dynamically pull the WebSocket URL, removing '/api' if present in the env variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL 
  ? import.meta.env.VITE_BACKEND_URL.replace('/api', '') 
  : "https://hopelink-api.onrender.com";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let socket;

    api.get("/chat/inbox")
      .then((res) => {
        if (Array.isArray(res.data)) {
          const count = res.data.reduce((acc, chat) => acc + chat.unreadCount, 0);
          setUnreadCount(count);
        }
      })
      .catch(console.error);

    socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"], 
    });

    socket.emit("setup", user._id);

    // 👉 GLOBAL LISTENER
    socket.on("new_message_notification", () => {
      setUnreadCount((prev) => prev + 1);
      
      // 👉 THE INBOX FIX: This event instantly triggers Inbox.jsx to re-fetch without a page reload
      window.dispatchEvent(new Event("new_unread_message"));

      toast("💬 Secure Transmission Received!", {
        style: { background: "#ffffff", color: "#29524a", border: "1px solid #846b8a" },
      });
    });

    const handleRoleUpdate = (data) => {
      if (data.userId === user._id) {
        const updatedUser = { ...user, isAdmin: data.isAdmin };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (!data.isAdmin) {
          toast.error("SECURITY ALERT: Your Admin privileges have been revoked.", {
            style: { background: "#ffffff", color: "#ff4a1c", border: "1px solid #ff4a1c" },
          });
        } else {
          toast.success("You have been promoted to System Admin!", {
            style: { background: "#ffffff", color: "#29524a", border: "1px solid #846b8a" },
          });
        }
      }
    };

    socket.on("role_updated", handleRoleUpdate);

    return () => {
      if (socket) {
        socket.off("role_updated", handleRoleUpdate);
        socket.off("new_message_notification");
        socket.disconnect();
      }
    };
  }, [user]);

  const switchRole = async () => {
    if (!user) return;
    try {
      const { data } = await api.put("/auth/role", {});
      const updatedUser = { ...user, activeRole: data.activeRole };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success(`Switched to ${data.activeRole.charAt(0).toUpperCase() + data.activeRole.slice(1)} Mode`);
    } catch (error) {
      toast.error("Failed to switch roles in the system.");
    }
  };

  const enableNotifications = async () => {
    const toastId = toast.loading("Requesting secure channel...", {
      style: { background: "#ffffff", color: "#29524a" },
    });

    try {
      const fcmToken = await requestFirebaseToken();
      if (fcmToken) {
        await api.post("/auth/fcm-token", { fcmToken });
        toast.success("Lock-Screen Alerts Enabled! 🚀", { id: toastId });
      } else {
        toast.error("Permission denied. Please check your browser site settings.", { id: toastId });
      }
    } catch (error) {
      toast.error("Failed to establish secure channel. Check console.", { id: toastId });
    }
  };

  const login = async (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    setTimeout(async () => {
        try {
          const fcmToken = await requestFirebaseToken();
          if (fcmToken) {
            await api.post("/auth/fcm-token", { fcmToken });
          }
        } catch (error) {
          console.error("FCM Token process failed on login:", error);
        }
    }, 500);
  };

  const logout = () => {
    setUser(null);
    setUnreadCount(0);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, setUser, unreadCount, setUnreadCount, enableNotifications }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;