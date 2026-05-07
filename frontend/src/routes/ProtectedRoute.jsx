import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, role, logout } = useAuth();

    // Handle session expiration
    useEffect(() => {
        if (!isAuthenticated) {
            logout();
        }
    }, [isAuthenticated, logout]);

    // Not logged in
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role not allowed
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;