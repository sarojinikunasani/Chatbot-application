import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Register from './components/Register';
import Login from './components/Login';
import ChatPageLayout from './pages/ChatPageLayout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const API_BASE_URL = `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5002}/api/auth`;

function App() {
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(true);

    const fetchFullUserProfile = async (token) => {
        console.log("(App.js) fetchFullUserProfile called.");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE_URL}/me`, config);
            if (response && response.data) setLoggedInUser(response.data);
            else throw new Error("No user data from /me");
        } catch (err) {
            localStorage.removeItem('authToken');
            setLoggedInUser(null);
            console.error("(App.js) fetchFullUserProfile - /me FAILED:", err.message);
        } finally {
            if (isLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        if (token) {
            fetchFullUserProfile(token);
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleLoginSuccess = async () => {
        const token = localStorage.getItem('authToken');
        if (token) await fetchFullUserProfile(token);
        else if (isLoading) setIsLoading(false);
    };

    const handleRegisterSuccess = () => setShowLogin(true);
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setLoggedInUser(null);
        setShowLogin(true);
    };

    const switchToRegisterView = () => setShowLogin(false);
    const switchToLoginView = () => setShowLogin(true);

    if (isLoading) return <div className="loading-app">Authenticating...</div>;

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={
                        loggedInUser ? (
                            <Navigate to="/chat" replace />
                        ) : (
                            <Login
                                onLoginSuccess={handleLoginSuccess}
                                switchToRegister={switchToRegisterView}
                            />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        loggedInUser ? (
                            <Navigate to="/chat" replace />
                        ) : (
                            <Register
                                onRegisterSuccess={handleRegisterSuccess}
                                switchToLogin={switchToLoginView}
                            />
                        )
                    }
                />

                {/* Protected Chat Route */}
                <Route
                    element={<ProtectedRoute user={loggedInUser} redirectPath="/login" />}
                >
                    <Route path="/chat" element={<ChatPageLayout />} />
                </Route>

                {/* Fallback route */}
                <Route
                    path="*"
                    element={
                        loggedInUser ? (
                            <Navigate to="/chat" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
