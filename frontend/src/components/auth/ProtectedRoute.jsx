import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './authContext'; // Adjust path as necessary

/**
 * A component to protect routes that require authentication and optionally specific roles/permissions.
 * If the user is not authenticated, they are redirected to the login page.
 * If the user is authenticated but does not have the required roles/permissions, 
 * they are redirected to an unauthorized page (or a fallback page).
 */
const ProtectedRoute = ({ requiredRoles, requiredPermissions, redirectTo = '/login', unauthorizedRedirectTo = '/unauthorized' }) => {
    const { user, loading, hasRole, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        // You might want to show a loading spinner here
        return <div>Loading authentication status...</div>;
    }

    if (!user) {
        // User not authenticated, redirect to login page
        // Pass the current location to redirect back after login
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    let authorized = true;

    if (requiredRoles) {
        if (Array.isArray(requiredRoles)) {
            authorized = requiredRoles.some(role => hasRole(role));
        } else {
            authorized = hasRole(requiredRoles);
        }
    }

    // If role check passed or no roles required, check permissions if any
    if (authorized && requiredPermissions) {
        if (Array.isArray(requiredPermissions)) {
            authorized = requiredPermissions.every(permission => hasPermission(permission));
        } else {
            authorized = hasPermission(requiredPermissions);
        }
    }

    if (!authorized) {
        // User authenticated but does not have the required roles/permissions
        return <Navigate to={unauthorizedRedirectTo} state={{ from: location }} replace />;
    }

    // User is authenticated and has the required roles/permissions
    return <Outlet />;
};

export default ProtectedRoute;

