import { useAuth } from "../auth/authContext";

/**
 * Custom hook to check user permissions and roles.
 */
export const usePermissions = () => {
    const { user, hasRole, hasPermission: contextHasPermission } = useAuth();

    /**
     * Checks if the current user has a specific role or one of a list of roles.
     * @param {string | string[]} roleOrRoles - The role or array of roles to check.
     * @returns {boolean} True if the user has the role, false otherwise.
     */
    const checkRole = (roleOrRoles) => {
        return hasRole(roleOrRoles);
    };

    /**
     * Checks if the current user has a specific permission.
     * This is a placeholder and should be adapted based on how permissions are structured in your user object.
     * @param {string} permission - The permission string to check (e.g., "knowledgebase:create").
     * @returns {boolean} True if the user has the permission, false otherwise.
     */
    const checkPermission = (permission) => {
        if (!user || !user.permissions) {
            // console.warn("User object or user.permissions is undefined. Cannot check permission:", permission);
            return false;
        }
        // Assuming user.permissions is an array of permission strings
        // Or it could be an object struktur like user.permissions.knowledgebase.canCreate
        if (Array.isArray(user.permissions)) {
            return user.permissions.includes(permission);
        } else if (typeof user.permissions === "object") {
            // Example for a nested permission structure, adapt as needed:
            // const parts = permission.split(':'); // e.g., "knowledgebase:create"
            // if (parts.length === 2 && user.permissions[parts[0]] && user.permissions[parts[0]].includes(parts[1])) {
            //     return true;
            // }
            console.warn("User.permissions is an object, but direct check for permission string is not implemented yet. Adapt checkPermission function in usePermissions.js");
            return false; // Needs specific implementation based on your permissions object structure
        }
        // Fallback to the context's hasPermission if it's more sophisticated
        if (contextHasPermission) {
            return contextHasPermission(permission);
        }
        return false;
    };

    return { user, checkRole, checkPermission, isAuthenticated: !!user };
};

