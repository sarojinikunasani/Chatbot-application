// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db'); // Establishes DB connection pool

const authRoutes = require('./routes/auth'); // Assuming you have this for login/register
const chatRoutes = require('./routes/chatRoutes'); // Assuming you have this
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5002; // Defaulting to 5002 as per your confirmation
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: CLIENT_ORIGIN, methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] })); // Added PATCH
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)}`);
    next();
});

app.get('/', (req, res) => res.send('API is running successfully!'));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes are correctly prefixed

// 404 Handler for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found on this server.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("!!! UNHANDLED SERVER ERROR !!!");
    console.error("Error Status:", err.status || 500);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: isProduction ? undefined : err.stack // Don't send stack in production
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}. Accepting requests from: ${CLIENT_ORIGIN}`);
});
