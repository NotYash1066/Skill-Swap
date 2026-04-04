import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VideoCallProvider } from "./contexts/VideoCallContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalVideoCall from "./components/video/GlobalVideoCall";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import ProfileSettings from "./pages/ProfileSettings";
import { AUTH_STATE_CHANGE_EVENT, clearAuthState, notifyAuthStateChange, storeAuthTokens } from "./utils/auth";
import "./styles/App.css";
import "./styles/themes.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("token")));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  const verifyToken = useCallback(async (token) => {
    try {
      const response = await axios.get("/api/auth/verify-token", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      return { valid: response.data.success, definitiveFailure: !response.data.success };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { valid: false, definitiveFailure: true };
      }
      console.error("Token verification failed:", error.message);
      return { valid: false, definitiveFailure: false };
    }
  }, []);

  const refreshAccessToken = useCallback(async (refreshToken) => {
    try {
      const response = await axios.post(
        "/api/auth/refresh-token",
        { refreshToken },
        { timeout: 5000 }
      );

      return { token: response.data.token, definitiveFailure: true };
    } catch (error) {
      if (error.response?.status === 401) {
        return { token: null, definitiveFailure: true };
      }

      if (error.response?.status !== 401) {
        console.error("Token refresh failed:", error.message);
      }

      return { token: null, definitiveFailure: false };
    }
  }, []);

  const syncAuthState = useCallback(async ({ startLoading = true } = {}) => {
    if (startLoading) {
      setLoading(true);
    }

		const token = localStorage.getItem("token");
		const refreshToken = localStorage.getItem("refreshToken");
		if (!token) {
		  setIsAuthenticated(false);
		  setLoading(false);
		  return;
		}

		const verificationResult = await verifyToken(token);
		let isValid = verificationResult.valid;

		if (!isValid && !verificationResult.definitiveFailure) {
		  setIsAuthenticated(true);
		  setLoading(false);
		  return;
		}

		if (!isValid && refreshToken) {
		  const refreshResult = await refreshAccessToken(refreshToken);

		  if (refreshResult.token) {
			const newToken = refreshResult.token;
			storeAuthTokens({ token: newToken, refreshToken });
			const refreshedVerificationResult = await verifyToken(newToken);
			isValid = refreshedVerificationResult.valid;

			if (!isValid && !refreshedVerificationResult.definitiveFailure) {
			  setIsAuthenticated(true);
			  setLoading(false);
			  return;
			}
		  } else if (!refreshResult.definitiveFailure) {
			setIsAuthenticated(true);
			setLoading(false);
			return;
		  }
		}

		setIsAuthenticated(isValid);

		if (!isValid) {
		  clearAuthState();
		  notifyAuthStateChange();
		}

		setLoading(false);
	  }, [refreshAccessToken, verifyToken]);

  useEffect(() => {
    const initialSyncId = window.setTimeout(() => {
      void syncAuthState({ startLoading: false });
    }, 0);

    const handleAuthStateChange = () => {
      void syncAuthState();
    };

    const handleStorage = (event) => {
      if (event.key && event.key !== "token" && event.key !== "refreshToken") {
        return;
      }

      void syncAuthState();
    };

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(initialSyncId);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncAuthState]);

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
                path="/forgot-password"
                element={<ForgotPassword />}
              />
              <Route
                path="/reset-password/:token"
                element={<ResetPassword />}
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
