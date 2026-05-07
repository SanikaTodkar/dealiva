import { useState } from "react";
import {
    getToken,
    getRole,
    setToken,
    setRole,
    clearAuth,
} from "../utils/auth";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }) => {
    const [token, setTokenState] = useState(() => getToken());
    const [role, setRoleState] = useState(() => getRole());

    const login = (token, role) => {
        // Save to localStorage
        setToken(token);
        setRole(role);

        // Update state
        setTokenState(token);
        setRoleState(role);
    };

    const logout = () => {
        // Clear from storage
        clearAuth();

        // Clear state
        setTokenState(null);
        setRoleState(null);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                role,
                isAuthenticated: !!token,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};