import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/apiService'; // Assuming an apiService for backend calls

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                setUser(null);
                return;
            }
            try {
                // Configure apiService to use the token
                apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await apiService.get('/auth/users/me'); // Ensure this matches your backend API endpoint
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user or token invalid:", error);
                setUser(null);
                localStorage.removeItem('authToken');
                setToken(null);
                delete apiService.defaults.headers.common['Authorization'];
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const login = async (credentials) => {
        try {
            const response = await apiService.post('/auth/token', credentials); // Ensure this matches your backend login endpoint
            const newToken = response.data.access_token;
            localStorage.setItem('authToken', newToken);
            setToken(newToken);
            apiService.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            // Fetch user data immediately after login
            const userResponse = await apiService.get('/auth/users/me');
            setUser(userResponse.data);
            return userResponse.data;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('authToken');
        setToken(null);
        delete apiService.defaults.headers.common['Authorization'];
        // Optionally, call a backend logout endpoint
        // await apiService.post('/auth/logout');
    };

    const hasRole = (roleOrRoles) => {
        if (!user || !user.roles || user.roles.length === 0) return false;
        if (Array.isArray(roleOrRoles)) {
            return roleOrRoles.some(r => user.roles.includes(r));
        }
        return user.roles.includes(roleOrRoles);
    };

    // Placeholder for more granular permission checking if needed
    const hasPermission = (permission) => {
        // This would typically involve checking user.permissions array or object
        // For now, we can base it on roles or keep it simple
        if (!user || !user.permissions) return false; 
        return user.permissions.includes(permission);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, setToken, loading, login, logout, hasRole, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

