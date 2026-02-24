import { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios'; // 👉 Added Axios back for the DB update
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 🚨 SECURITY TRIPWIRE: Listen for real-time admin role changes
  useEffect(() => {
    if (!user) return;

    // Connect to the socket and join the user's personal secure room
    const socket = io('http://localhost:5000');
    socket.emit('setup', user._id);

    const handleRoleUpdate = (data) => {
      // If the alert from the server is about ME...
      if (data.userId === user._id) {
        // Update my local storage and state instantly
        const updatedUser = { ...user, isAdmin: data.isAdmin };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Notify me of what just happened
        if (!data.isAdmin) {
          toast.error("SECURITY ALERT: Your Admin privileges have been revoked.");
        } else {
          toast.success("You have been promoted to System Admin!");
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

  // --- FIXED FUNCTION: Role Switcher (Now talks to the database!) ---
  const switchRole = async () => {
    if (!user) return;
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // 👉 Actually hit the backend so the Database knows about the switch!
      const { data } = await axios.put('http://localhost:5000/api/auth/role', {}, config);
      
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