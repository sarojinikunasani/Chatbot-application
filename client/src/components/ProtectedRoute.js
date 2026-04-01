// client/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute component
 * Ensures that only logged-in users can access certain routes.
 * If not authenticated, redirects to /login.
 */
function ProtectedRoute({ user, redirectPath = '/login' }) {
    if (!user) {
        console.warn("ProtectedRoute: No user found — redirecting to", redirectPath);
        return <Navigate to={redirectPath} replace />;
    }

    // If user is authenticated, render child routes
    return <Outlet />;
}

export default ProtectedRoute;
