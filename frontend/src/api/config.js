import { getToken, clearAuth } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // 🔴 Handle Unauthorized (Token expired/invalid)
        if (response.status === 401) {
            clearAuth();
            throw new Error("SESSION_EXPIRED");
        }

        // ❌ Handle errors
        if (!response.ok) {
            const errorData = await response.json();

            let message = "Something went wrong";

            // FastAPI: string error
            if (typeof errorData.detail === "string") {
                message = errorData.detail;
            }

            // FastAPI: validation error (422)
            else if (Array.isArray(errorData.detail)) {
                message = errorData.detail.map(err => err.msg).join(", ");
            }

            throw new Error(message);
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();

    } catch (error) {
        // Network / unexpected errors
        throw new Error(error.message || "Network error", { cause: error });
    }
};
