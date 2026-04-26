import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { HelmetProvider } from "react-helmet-async";

// 👉 IMPORT THE NEW MASTER LOADER & ERROR BOUNDARY
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";

// 👉 LAZY LOADED PAGES
const CreateDonation = lazy(() => import("./pages/CreateDonation"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Chat = lazy(() => import("./pages/Chat"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Donations = lazy(() => import("./pages/Donations"));
const BloodBank = lazy(() => import("./pages/BloodBank"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const BloodRadar = lazy(() => import("./pages/BloodRadar"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          {/* TOASTER STYLED FOR LIGHT MODE TO AVOID FLASHES OF DARK */}
          <Toaster 
            position="top-right" 
            toastOptions={{ 
              duration: 3000,
              style: {
                background: '#ffffff',
                color: '#29524a',
                border: '1px solid #846b8a'
              },
              success: {
                style: {
                  background: '#ffffff',
                  color: '#29524a',
                  border: '1px solid #29524a'
                }
              },
              error: {
                style: {
                  background: '#ffffff',
                  color: '#ff4a1c',
                  border: '1px solid #ff4a1c'
                }
              }
            }} 
          />

          <ErrorBoundary>
            <Suspense fallback={<Loader fullScreen={true} text="Connecting to Sahayam..." />}>
              <Routes>
                {/* Public & Auth Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Auth Recovery Routes */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:id/:token" element={<ResetPassword />} />

                {/* Main App Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/radar" element={<BloodRadar />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Form / Posting Routes */}
                <Route path="/donate" element={<CreateDonation />} /> 
                <Route path="/donations" element={<Donations />} /> 
                <Route path="/blood-bank" element={<BloodBank />} />
                
                {/* Chat Routes */}
                <Route path="/chat/inbox" element={<Inbox />} />
                <Route path="/chat/:donationId" element={<Chat />} />
                
                {/* Admin Command Center */}
                <Route path="/admin" element={<AdminDashboard />} />
                
                {/* 404 CATCH-ALL ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;