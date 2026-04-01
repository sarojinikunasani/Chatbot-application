import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API_BASE_URL = `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5002}/api/auth`;

function Login({ onLoginSuccess, switchToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // For redirecting after successful login

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
            localStorage.setItem('authToken', response.data.token);
            if (onLoginSuccess) {
                onLoginSuccess(response.data.user);
            }
            // 🔄 Redirect to chat page after login
            navigate('/chat');
        } catch (err) {
            setMessage('');
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.request) {
                setError('Network error or server is not responding.');
            } else {
                setError('Login failed. Please check credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchToRegister = () => {
        console.log("Login.js: 'Sign Up' button clicked, calling switchToRegister prop.");
        if (switchToRegister) {
            switchToRegister();
            navigate('/register');
        } else {
            console.error("Login.js: switchToRegister prop is not defined!");
        }
    };

    return (
        <div className="auth-container login-container">
            <div className="auth-header">
                <h2>Sign In</h2>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}

                <div className="form-group">
                    <label htmlFor="login-username">USERNAME</label>
                    <input
                        type="text"
                        id="login-username"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="login-password">PASSWORD</label>
                    <input
                        type="password"
                        id="login-password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div className="switch-auth-link">
                Not a member?{' '}
                <button
                    type="button"
                    onClick={handleSwitchToRegister}
                    className="link-button"
                    disabled={loading}
                >
                    Sign Up
                </button>
            </div>
        </div>
    );
}

export default Login;
