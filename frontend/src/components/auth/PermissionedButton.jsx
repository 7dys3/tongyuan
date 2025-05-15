import React from 'react';
import { usePermissions } from '../../hooks/usePermissions'; // Adjust path as necessary

/**
 * A button component that is only rendered or enabled if the user has the required roles/permissions.
 */
const PermissionedButton = ({ children, requiredRoles, requiredPermissions, onClick, className, disabledText, ...rest }) => {
    const { checkRole, checkPermission } = usePermissions();

    let hasRequiredRoles = true;
    if (requiredRoles) {
        hasRequiredRoles = checkRole(requiredRoles);
    }

    let hasRequiredPermissions = true;
    if (requiredPermissions) {
        // Assuming checkPermission can handle an array or a single string
        if (Array.isArray(requiredPermissions)) {
            hasRequiredPermissions = requiredPermissions.every(permission => checkPermission(permission));
        } else {
            hasRequiredPermissions = checkPermission(requiredPermissions);
        }
    }

    const authorized = hasRequiredRoles && hasRequiredPermissions;

    if (!authorized) {
        if (disabledText) {
            // Render a disabled button with a tooltip or text
            return (
                <button className={`${className} opacity-50 cursor-not-allowed`} disabled title={disabledText} {...rest}>
                    {children}
                </button>
            );
        }
        return null; // Or render a disabled version, or nothing
    }

    return (
        <button onClick={onClick} className={className} {...rest}>
            {children}
        </button>
    );
};

export default PermissionedButton;

/*
Example Usage:

<PermissionedButton
    requiredRoles={['admin']}
    onClick={() => console.log('Admin action!')}
    className="p-2 bg-blue-500 text-white rounded"
>
    Admin Action
</PermissionedButton>

<PermissionedButton
    requiredPermissions={PERMISSIONS.KNOWLEDGEBASE_CREATE} // Assuming PERMISSIONS is defined in menuConfig.js or similar
    onClick={() => console.log('Create KB!')}
    className="p-2 bg-green-500 text-white rounded"
    disabledText="You don't have permission to create knowledge bases"
>
    Create Knowledgebase
</PermissionedButton>

<PermissionedButton
    requiredRoles={['editor']}
    requiredPermissions={PERMISSIONS.KNOWLEDGEBASE_EDIT}
    onClick={() => console.log('Edit KB!')}
    className="p-2 bg-yellow-500 text-black rounded"
>
    Edit Knowledgebase
</PermissionedButton>

*/

