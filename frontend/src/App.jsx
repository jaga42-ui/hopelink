import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";

// 👉 IMPORT THE NEW SEO & ANALYTICS ENGINES
import { HelmetProvider } from "react-helmet-async";
// import posthog from "posthog-js"; // 🛑 Temporarily disabled to silence console errors

// 👉 IMPORT THE NEW MASTER LOADER & ERROR BOUNDARY
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";

// 👉 INITIALIZE POSTHOG (Heatmaps & Analytics)
// 🛑 Temporarily disabled until you get a real API key!
// posthog.init("YOUR_POSTHOG_API_KEY", { api_host: "https://app.posthog.com" });

// 👉 LAZY LOADED PAGES: These only download when the user clicks them!
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
// 👉 NEW: Lazy load the 404 Page
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    // 👉 WRAP THE ENTIRE APP IN HELMET FOR SEO METADATA
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

          {/* 👉 GLOBAL ERROR BOUNDARY: Catches crashes so the app doesn't white-screen */}
          <ErrorBoundary>
            {/* 👉 SUSPENSE WRAPPER: Shows the glowing loader during page transitions */}
            <Suspense
              fallback={
                <Loader fullScreen={true} text="Connecting to Network..." />
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgotpassword" element={<ForgotPassword />} />
                <Route
                  path="/resetpassword/:resettoken"
                  element={<ResetPassword />}
                />
                {/* Main App Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/radar" element={<BloodRadar />} />
                <Route path="/profile" element={<Profile />} />
                {/* Form / Posting Routes */}
                <Route path="/donate" element={<CreateDonation />} />{" "}
                {/* Older form */}
                <Route path="/donations" element={<Donations />} />{" "}
                {/* 👉 New Glassmorphism Form */}
                <Route path="/blood-bank" element={<BloodBank />} />
                {/* Chat Routes */}
                <Route path="/chat/inbox" element={<Inbox />} />
                <Route path="/chat/:donationId" element={<Chat />} />
                {/* Admin Command Center */}
                <Route path="/admin" element={<AdminDashboard />} />
                {/* 👉 404 CATCH-ALL ROUTE: Must be at the very bottom! */}
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
