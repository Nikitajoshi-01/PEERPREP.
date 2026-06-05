import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import useAuth from "./hooks/useAuth.js";
import useAuthStore from "./store/authStore.js";
// add this import
import RecommendationsPage from "./pages/RecommendationsPage.jsx";



// ← separate component INSIDE BrowserRouter
const AppRoutes = () => {
  const { getCurrentUser } = useAuth();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) getCurrentUser();
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/chat/:groupId" element={
          <ProtectedRoute><ChatPage /></ProtectedRoute>
        } />
        {/* NEW route for AI recommendations */}
       
<Route path="/recommendations" element={
  <ProtectedRoute><RecommendationsPage /></ProtectedRoute>
} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

// ← App just wraps everything in BrowserRouter
const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;