export const menuItems = [
    {
        path: "/dashboard",
        label: "仪表盘",
        icon: "LayoutDashboard", // Placeholder for actual icon component or name
        requiredRoles: ["admin", "editor", "viewer"]
    },
    {
        path: "/knowledgebases",
        label: "知识库管理",
        icon: "Database",
        requiredRoles: ["admin", "editor"]
    },
    {
        path: "/users",
        label: "用户管理",
        icon: "Users",
        requiredRoles: ["admin"]
    },
    {
        path: "/audit-logs",
        label: "审计日志",
        icon: "FileText",
        requiredRoles: ["admin"]
    },
    {
        path: "/settings",
        label: "系统设置",
        icon: "Settings",
        requiredRoles: ["admin"]
    }
    // Add more menu items as needed, for example:
    // {
    //     path: "/profile",
    //     label: "个人资料",
    //     icon: "UserCircle",
    //     requiredRoles: ["admin", "editor", "viewer"] // Or simply check if user is authenticated
    // }
];

// Example of how to define specific permissions if your backend supports them
export const PERMISSIONS = {
    KNOWLEDGEBASE_CREATE: "knowledgebase:create",
    KNOWLEDGEBASE_EDIT: "knowledgebase:edit",
    KNOWLEDGEBASE_DELETE: "knowledgebase:delete",
    USER_MANAGE: "user:manage",
    SETTINGS_VIEW: "settings:view",
    AUDIT_LOG_VIEW: "auditlog:view"
};

