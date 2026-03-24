import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VideoCallProvider } from "./contexts/VideoCallContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalVideoCall from "./components/video/GlobalVideoCall";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import ProfileSettings from "./pages/ProfileSettings";
import "./styles/App.css";
import "./styles/themes.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get("/api/auth/verify-token", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      return response.data.success;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return false;
      }
      console.error("Token verification failed:", error.message);
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        const isValid = await verifyToken(token);
        setIsAuthenticated(isValid);
        if (!isValid) {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <VideoCallProvider>
          <Router future={{ 
            v7_startTransition: true, 
            v7_relativeSplatPath: true 
          }}>
          <div className="App">
            {/* Global video call overlay mounted at app level */}
            <GlobalVideoCall />
            <Routes>
              <Route 
                path="/login" 
                element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
              />
              <Route 
                path="/register" 
                element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} 
              />
              <Route 
                path="/dashboard" 
                element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/matches" 
                element={isAuthenticated ? <Matches /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/chat" 
                element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/profile-settings" 
                element={isAuthenticated ? <ProfileSettings /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/" 
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
              />
            </Routes>
          </div>
          </Router>
        </VideoCallProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
