// client/src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const API_BASE_URL = `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5002}/api/auth`;

function Register({ onRegisterSuccess, switchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handlePhoneNumberChange = (e) => {
        const value = e.target.value;
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length <= 10) {
            setPhoneNumber(digitsOnly);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!username || !password || !email) {
            setError("Username, password, and email are required");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Please provide a valid email address");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }
        if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
            setError("Phone number must be exactly 10 digits, if provided.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                username,
                password,
                email,
                phone_number: phoneNumber || null
            };
            const response = await axios.post(`${API_BASE_URL}/register`, payload);
            setMessage(response.data.message || 'Registration successful!');
            setError('');
            setUsername('');
            setPassword('');
            setEmail('');
            setPhoneNumber('');

            if (onRegisterSuccess) {
                onRegisterSuccess();
            }
            setTimeout(() => {
                if (switchToLogin) {
                    switchToLogin(); // Call if prop exists (for App.js state mode)
                    // Also navigate for URL consistency if using state mode
                    navigate('/login');
                } else {
                    navigate('/login'); // Default navigation if no switchToLogin prop
                }
            }, 1500);

        } catch (err) {
            setMessage('');
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container register-container">
            <div className="auth-header">
                <h2>Sign Up</h2>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                 {error && <p className="error-message">{error}</p>}
                 {message && <p className="success-message">{message}</p>}

                <div className="form-group">
                    <label htmlFor="reg-username">USERNAME</label>
                    <input
                        type="text" id="reg-username" placeholder="Choose a username"
                        value={username} onChange={(e) => setUsername(e.target.value)}
                        required disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-email">EMAIL</label>
                    <input
                        type="email" id="reg-email" placeholder="Your email address"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        required disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-phone">PHONE NUMBER (10 digits, Optional)</label>
                    <input
                        type="tel"
                        id="reg-phone"
                        placeholder="Your 10-digit phone number"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        maxLength={10}
                        pattern="\d{10}"
                        title="Phone number must be 10 digits."
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-password">PASSWORD</label>
                    <input
                        type="password" id="reg-password" placeholder="Create a password (min 6 chars)"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        required minLength="6" disabled={loading}
                    />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>

            <div className="switch-auth-link">
                Already have an account?{' '}
                <button
                    type="button"
                    onClick={() => {
                        if (switchToLogin) {
                            switchToLogin();
                            navigate('/login'); // Ensure URL changes if using App.js state for switch
                        } else {
                             navigate('/login'); // Default navigation if only using router
                        }
                    }}
                    className="link-button"
                    disabled={loading}
                >
                    Sign In
                </button>
            </div>
        </div>
    );
}

export default Register;
