import { apiRequest } from "./config";

export const getAdminDashboard = async () => {
    return await apiRequest("/admin/dashboard");
};

export const getAdminShops = async ({ limit = 10, offset = 0 } = {}) => {
    return await apiRequest(`/admin/shops?limit=${limit}&offset=${offset}`);
};

export const approveAdminShop = async (shopId) => {
    return await apiRequest(`/admin/shops/${shopId}/approve`, {
        method: "PATCH",
    });
};

export const blockAdminShop = async (shopId) => {
    return await apiRequest(`/admin/shops/${shopId}/block`, {
        method: "PATCH",
    });
};

export const getAdminCustomers = async () => {
    return await apiRequest("/admin/customers");
};

export const blockAdminCustomer = async (userId) => {
    return await apiRequest(`/admin/customers/${userId}/block`, {
        method: "PATCH",
    });
};

export const unblockAdminCustomer = async (userId) => {
    return await apiRequest(`/admin/customers/${userId}/unblock`, {
        method: "PATCH",
    });
};
