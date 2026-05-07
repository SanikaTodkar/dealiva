import { apiRequest } from "./config";

export const getOwnerProducts = async ({ limit = 10, offset = 0 } = {}) => {
    return await apiRequest(`/products?limit=${limit}&offset=${offset}`);
};

export const createProduct = async (payload) => {
    return await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const updateProduct = async (productId, payload) => {
    return await apiRequest(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const deleteProduct = async (productId) => {
    return await apiRequest(`/products/${productId}`, {
        method: "DELETE",
    });
};
