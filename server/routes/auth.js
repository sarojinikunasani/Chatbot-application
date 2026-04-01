// login-register-app/server/routes/auth.js
const express = require('express');
const router = express.Router();

// You'll need to import these from the correct controller
// Assuming they are in authController.js for this example,
// but they are better placed in a userController.js or preferenceController.js
const {
    registerUser,
    loginUser,
    getLoggedInUser,
    getDashboardLayout,  // <--- NEW
    saveDashboardLayout   // <--- NEW
} = require('../controllers/authController'); // OR from '../controllers/userController'

const authMiddleware = require('../middleware/authMiddleware');

// --- Authentication Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Authenticated User Data Routes ---
router.get('/me', authMiddleware, getLoggedInUser);

// --- NEW: Dashboard Layout Preference Routes ---
router.get('/dashboard-layout', authMiddleware, getDashboardLayout);
router.put('/dashboard-layout', authMiddleware, saveDashboardLayout);

module.exports = router;
