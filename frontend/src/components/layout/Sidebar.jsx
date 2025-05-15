import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext'; // Adjust path as necessary
import { menuItems } from '../config/menuConfig'; // Adjust path as necessary
// You might want to use an icon library, e.g., Lucide React
// import { Home, Users, Settings, FileText, Database } from 'lucide-react';

// Placeholder for icon mapping - replace with your actual icon components or a helper function
const iconMap = {
    LayoutDashboard: () => <span></span>, // Replace with <LayoutDashboardIcon />
    Database: () => <span></span>,      // Replace with <DatabaseIcon />
    Users: () => <span></span>,         // Replace with <UsersIcon />
    FileText: () => <span></span>,      // Replace with <FileTextIcon />
    Settings: () => <span></span>,      // Replace with <SettingsIcon />
    UserCircle: () => <span></span>    // Replace with <UserCircleIcon />
};

const Sidebar = () => {
    const { user, hasRole, logout } = useAuth();
    const location = useLocation();

    if (!user) {
        // Optionally, render a minimal sidebar or nothing if user is not logged in
        // Or this component might not even be rendered if routes are protected
        return null;
    }

    const handleLogout = async () => {
        try {
            await logout();
            // Redirect to login page or home page after logout
            // This might be handled by ProtectedRoute or a navigation hook
            window.location.href = '/login'; 
        } catch (error) {
            console.error("Logout failed:", error);
            // Handle logout error (e.g., show a notification)
        }
    };

    return (
        <aside className="w-64 bg-gray-800 text-white p-4 space-y-2 flex flex-col h-screen">
            <div className="text-2xl font-semibold mb-5 text-center">Financial AI Agent</div>
            <nav className="flex-grow">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const IconComponent = iconMap[item.icon] || (() => <span></span>);
                        if (item.requiredRoles && hasRole(item.requiredRoles)) {
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700 ${
                                            location.pathname.startsWith(item.path) ? 'bg-gray-700 font-semibold' : ''
                                        }`}
                                    >
                                        <IconComponent size={20} />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        }
                        return null;
                    })}
                </ul>
            </nav>
            <div className="mt-auto">
                <div className="p-2 border-t border-gray-700">
                    <p className="text-sm">User: {user.email || user.username}</p>
                    <p className="text-xs">Roles: {user.roles?.join(', ') || 'N/A'}</p>
                </div>
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 p-2 rounded-md bg-red-600 hover:bg-red-700 text-white mt-2"
                >
                    {/* <LogOut size={20} /> */}
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

