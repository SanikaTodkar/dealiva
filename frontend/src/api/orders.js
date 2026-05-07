import { apiRequest } from "./config";

export const createOrder = async () => {
    return await apiRequest("/orders/create", {
        method: "POST",
    });
};

export const getMyOrders = async () => {
    return await apiRequest("/orders/my-orders");
};

export const getShopOrders = async () => {
    return await apiRequest("/orders/shop");
};

export const updateShopOrderStatus = async ({ orderId, status }) => {
    return await apiRequest(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
};
