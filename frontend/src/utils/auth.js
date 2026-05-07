const TOKEN_KEY = "access_token";
const ROLE_KEY = "user_role";

// =====================
// TOKEN
// =====================

export const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

// =====================
// ROLE
// =====================

export const setRole = (role) => {
    localStorage.setItem(ROLE_KEY, role);
};

export const getRole = () => {
    return localStorage.getItem(ROLE_KEY);
};

export const removeRole = () => {
    localStorage.removeItem(ROLE_KEY);
};

// =====================
// AUTH HELPERS
// =====================

export const clearAuth = () => {
    removeToken();
    removeRole();
};

export const isAuthenticated = () => {
    return !!getToken();
};