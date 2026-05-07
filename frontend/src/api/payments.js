import { apiRequest } from "./config";

export const createRazorpayOrder = async (orderId) => {
    return await apiRequest("/payments/razorpay/create-order", {
        method: "POST",
        body: JSON.stringify({
            order_id: orderId,
        }),
    });
};

export const verifyRazorpayPayment = async ({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
}) => {
    return await apiRequest("/payments/razorpay/verify", {
        method: "POST",
        body: JSON.stringify({
            order_id: orderId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        }),
    });
};
