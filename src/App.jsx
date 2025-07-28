// src/App.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ActivatePage from "./pages/ActivatePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import AdminPage from "./pages/AdminPage";
import HomePage from './pages/HomePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardInsightsPage from './pages/DashboardInsightsPage';
import AdminProfilePage from './pages/AdminProfilePage';
//import keepServerAwake from './utils/keepServerAwake';
import PlansPage from './pages/PlansPage';
import FAQPage from './pages/FAQPage';

// Theme context for dark/light mode
const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const profileId = localStorage.getItem("profileId");
  return profileId ? children : <Navigate to="/login" replace />;
}

export default function App() {

  return (
    <ThemeProvider>
      <Router>
        <Routes>

          {/* Public pages */}
          <Route path="/activate" element={<ActivatePage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Change admin route to a 19-character custom slug */}
          <Route path="/admin-bs1978av1123ss2402" element={<AdminPage />} />
          <Route path="/p/:activationCode" element={<PublicProfilePage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* FAQ page */}
          <Route path="/faq" element={<FAQPage />} />

          {/* Protected customer dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Insights page for dashboard */}
          <Route
            path="/dashboard/insights"
            element={
              <ProtectedRoute>
                <DashboardInsightsPage />
              </ProtectedRoute>
            }
          />
          {/* Admin profile details page */}
          <Route path="/admin-7x9q2v4k1b8z6r3p0/profile/:id" element={<AdminProfilePage />} />

          {/* Plans page */}
          <Route path="/plans" element={<PlansPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
