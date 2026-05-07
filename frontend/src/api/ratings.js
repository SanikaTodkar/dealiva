import { apiRequest } from "./config";

export const submitShopRating = async ({ shopId, rating, feedback }) => {
    return await apiRequest("/ratings", {
        method: "POST",
        body: JSON.stringify({
            shop_id: shopId,
            rating,
            feedback: feedback.trim() || null,
        }),
    });
};
