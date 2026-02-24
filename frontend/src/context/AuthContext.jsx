import { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// 👉 IMPORT YOUR HARDWIRED API PIPELINE
import api from '../utils/api';

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

    // 👉 FIXED: Connect to the live server, not localhost!
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
        
        // Tactical Notifications
        if (!data.isAdmin) {
          toast.error("SECURITY ALERT: Your Admin privileges have been revoked.", {
            style: { background: '#111', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' }
          });
        } else {
          toast.success("You have been promoted to System Admin!", {
            style: { background: '#111', color: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.5)' }
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

  // --- FIXED FUNCTION: Role Switcher ---
  const switchRole = async () => {
    if (!user) return;
    
    try {
      // 👉 FIXED: Uses your api.js file! No localhost, no manual token headers needed!
      const { data } = await api.put('/auth/role', {});
      
      // Update local state and storage instantly with the verified backend data
      const updatedUser = { ...user, activeRole: data.activeRole };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success(`Switched to ${data.activeRole.charAt(0).toUpperCase() + data.activeRole.slice(1)} Mode`);
    } catch (error) {
      toast.error("Failed to switch roles in the system.");
    }
  };

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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