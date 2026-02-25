import { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR HARDWIRED API PIPELINE
import api from '../utils/api';

// 👉 IMPORT FIREBASE TOKEN FUNCTION
import { requestFirebaseToken } from '../firebase';

const AuthContext = createContext();

// 👉 HARDWIRED SOCKET URL
const BACKEND_URL = 'https://hopelink-api.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 🚨 SECURITY TRIPWIRE: Listen for real-time admin role changes
  useEffect(() => {
    if (!user) return;

    // 👉 Connect to the live server
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'] // Ensures stable connection on Render
    });
    
    socket.emit('setup', user._id);

    const handleRoleUpdate = (data) => {
      // If the alert from the server is about ME...
      if (data.userId === user._id) {
        // Update my local storage and state instantly
        const updatedUser = { ...user, isAdmin: data.isAdmin };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Tactical Notifications (Updated to Solid Dark Slate Theme)
        if (!data.isAdmin) {
          toast.error("SECURITY ALERT: Your Admin privileges have been revoked.", {
            style: { background: '#0f172a', color: '#ef4444', border: '1px solid #7f1d1d' } // slate-900 bg, red-900 border
          });
        } else {
          toast.success("You have been promoted to System Admin!", {
            style: { background: '#0f172a', color: '#14b8a6', border: '1px solid #134e4a' } // slate-900 bg, teal-900 border
          });
        }
      }
    };

    socket.on('role_updated', handleRoleUpdate);
    
    // Cleanup listener when unmounting
    return () => {
      socket.off('role_updated', handleRoleUpdate);
      socket.disconnect();
    };
  }, [user]);

  // --- Role Switcher ---
  const switchRole = async () => {
    if (!user) return;
    
    try {
      const { data } = await api.put('/auth/role', {});
      
      const updatedUser = { ...user, activeRole: data.activeRole };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success(`Switched to ${data.activeRole.charAt(0).toUpperCase() + data.activeRole.slice(1)} Mode`, {
        style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' } // slate-900 bg, slate-800 border
      });
    } catch (error) {
      toast.error("Failed to switch roles in the system.", {
        style: { background: '#0f172a', color: '#ef4444', border: '1px solid #7f1d1d' }
      });
    }
  };

  // 👉 UPGRADED: Async Login Function with Firebase Trigger
  const login = async (userData) => {
    // 1. Instantly log the user into the UI
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // 2. Request Notification Permission & Firebase Token
    try {
      const fcmToken = await requestFirebaseToken();
      if (fcmToken) {
        // 3. Send the token to the backend so MongoDB knows how to ping this user
        await api.post('/auth/fcm-token', { fcmToken });
        console.log("Firebase Lock-Screen Notifications Enabled.");
      } else {
        console.log("User denied notifications or token generation failed.");
      }
    } catch (error) {
      console.error("FCM Token process failed:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;