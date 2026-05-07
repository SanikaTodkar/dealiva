import { apiRequest} from "./config";

export const loginUser = async (payload) => {
    return await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const registerUser = async (payload) => {
    return await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};