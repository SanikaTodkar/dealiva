import { apiRequest } from "./config";

export const getCart = async () => {
    return await apiRequest("/cart");
};

export const addToCart = async ({ productId, quantity = 1 }) => {
    return await apiRequest("/cart/add", {
        method: "POST",
        body: JSON.stringify({
            product_id: productId,
            quantity,
        }),
    });
};

export const updateCartQuantity = async ({ productId, quantity }) => {
    return await apiRequest("/cart/update-quantity", {
        method: "POST",
        body: JSON.stringify({
            product_id: productId,
            quantity,
        }),
    });
};

export const removeCartItem = async (productId) => {
    return await apiRequest("/cart/remove", {
        method: "POST",
        body: JSON.stringify({
            product_id: productId,
        }),
    });
};
