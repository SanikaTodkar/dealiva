import { apiRequest } from "./config";

export const getShops = async ({ city = "", limit = 6, offset = 0}) => {
    let url = `/shops?limit=${limit}&offset=${offset}`;

    if (city) {
        url +=`&city=${city}`;
    }
    
    return await apiRequest(url);
}

export const getShopById = async (shopId) => {
    return await apiRequest(`/shops/${shopId}`);
};

export const getShopRatings = async (shopId) => {
    return await apiRequest(`/shops/${shopId}/ratings`);
};

export const getShopProducts = async (shopId) => {
    return await apiRequest(`/shops/${shopId}/products`);
};

export const getMyShop = async () => {
    return await apiRequest("/shops/my-shop");
};

export const registerShop = async (payload) => {
    return await apiRequest("/shops/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const updateShop = async (payload) => {
    return await apiRequest("/shops/update", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const sendShopOtp = async () => {
    return await apiRequest("/shops/otp/send", {
        method: "POST",
    });
};

export const verifyShopOtp = async (code) => {
    return await apiRequest("/shops/otp/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
    });
};

export const getShopDashboard = async () => {
    return await apiRequest("/shops/dashboard");
};

export const getShopMonthlySales = async () => {
    return await apiRequest("/shops/dashboard/monthly-sales");
};

export const getShopTopSellingProducts = async ({ limit = 5 } = {}) => {
    return await apiRequest(`/shops/dashboard/top-selling-products?limit=${limit}`);
};
