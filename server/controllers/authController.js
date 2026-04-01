const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const registerUser = async (req, res) => {
    const { username, password, email, phone_number } = req.body;

    if (phone_number && phone_number.trim() !== "" && !/^[0-9]{10}$/.test(phone_number.trim())) {
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits (if provided).' });
    }

    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, password, and email are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
         return res.status(400).json({ message: 'Please provide a valid email address'});
    }

    try {
        const userCheck = await pool.query(
            'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (userCheck.rows.length > 0) {
            const existing = userCheck.rows[0];
            let conflictMessage = 'User already exists.';
            if (existing.username === username) {
                conflictMessage = 'Username already exists.';
            } else if (existing.email === email) {
                conflictMessage = 'Email already registered.';
            }
            return res.status(409).json({ message: conflictMessage });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUserQuery = `
            INSERT INTO users (username, password_hash, email, phone_number) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, username, email, phone_number, created_at`;
        const phoneToStore = (phone_number && phone_number.trim() !== "") ? phone_number.trim() : null;
        const newUserResult = await pool.query(newUserQuery, [username, passwordHash, email, phoneToStore]);
        
        const insertedUser = newUserResult.rows[0];

        res.status(201).json({
            message: 'User registered successfully',
            user: insertedUser
        });

    } catch (err) {
        console.error("Registration Error:", err.message, err.code);
        if (err.code === '23505') {
             return res.status(409).json({ message: 'Username or email is already taken' });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const userResult = await pool.query('SELECT id, username, email, password_hash FROM users WHERE username = $1', [username]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: { id: user.id, username: user.username }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error("JWT Signing Error:", err);
                    return res.status(500).json({ message: 'Error generating login token' });
                 }
                res.json({
                    message: 'Login successful',
                    token: token,
                    user: { id: user.id, username: user.username, email: user.email }
                });
            }
        );

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getLoggedInUser = async (req, res) => {
    try {
        const queryText = 'SELECT id, username, email, phone_number, created_at, dashboard_layout FROM users WHERE id = $1';
        const { rows } = await pool.query(queryText, [req.user.id]);

        if (rows.length === 0) {
             return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(rows[0]);

    } catch (err) {
        console.error("Get LoggedInUser Error:", err.message);
        res.status(500).json({ message: 'Server Error fetching user profile' });
    }
};

const getDashboardLayout = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            'SELECT dashboard_layout FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0].dashboard_layout || null);
        } else {
            res.status(404).json({ message: 'User not found, cannot fetch layout.' });
        }
    } catch (err) {
        console.error('Error fetching dashboard layout:', err.message, err.stack);
        res.status(500).json({ message: 'Server error fetching dashboard layout.' });
    }
};

const saveDashboardLayout = async (req, res) => {
    const userId = req.user.id;
    const { layout } = req.body;

    if (!layout || !Array.isArray(layout)) {
        return res.status(400).json({ message: 'Invalid layout data provided. Expected an array.' });
    }

    try {
        const layoutJsonString = JSON.stringify(layout);
        const result = await pool.query(
            'UPDATE users SET dashboard_layout = $1 WHERE id = $2 RETURNING id',
            [layoutJsonString, userId]
        );

        if (result.rowCount > 0) {
            res.json({ message: 'Dashboard layout saved successfully.' });
        } else {
            res.status(404).json({ message: 'User not found, layout not saved.' });
        }
    } catch (err) {
        console.error('Error saving dashboard layout:', err.message, err.stack);
        if (err.message && err.message.includes("invalid input syntax for type json")) {
             console.error("Detailed PG Error for JSON syntax:", err);
             return res.status(500).json({ message: 'Server error: Layout data could not be processed by the database.' });
        }
        res.status(500).json({ message: 'Server error saving dashboard layout.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getLoggedInUser,
    getDashboardLayout,
    saveDashboardLayout
};
