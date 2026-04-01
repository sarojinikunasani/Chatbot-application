
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; 

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!username || !password) {
            setError("Username and password are required");
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/login`, {
                username: username,
                password: password,
            });

            setMessage(response.data.message || 'Login successful!');
            setError(''); 

                if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                if(onLoginSuccess) {
                    onLoginSuccess(response.data.user); // Pass user data if needed
                }
            }

             setUsername(''); 
             setPassword('');

        } catch (err) {
             if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Login failed. Please check credentials.');
            }
            setMessage(''); // Clear success message on error
            console.error("Login error:", err.response || err.message || err);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="login-username">Username:</label>
                    <input
                        type="text"
                        id="login-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="login-password">Password:</label>
                    <input
                        type="password"
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default Login;
