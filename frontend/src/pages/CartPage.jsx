import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCart, removeCartItem, updateCartQuantity } from "../api/cart";
import { createOrder } from "../api/orders";
import { createRazorpayOrder, verifyRazorpayPayment } from "../api/payments";
import shopPlaceholder from "../assets/shop-placeholder.jpg";

const formatCurrency = (value) => {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return "₹0";
    }

    return `₹${amount.toFixed(0)}`;
};

const loadRazorpayCheckout = () => {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
        document.body.appendChild(script);
    });
};

const CartPage = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [actionProductId, setActionProductId] = useState(null);
    const [error, setError] = useState("");
    const [paymentMessage, setPaymentMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadCart = async () => {
            setLoading(true);
            setError("");

            try {
                const data = await getCart();
                if (isMounted) setCart(data);
            } catch (err) {
                if (isMounted) setError(err.message || "Failed to load cart");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadCart();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleQuantityChange = async (item, nextQuantity) => {
        if (nextQuantity < 0) return;

        setActionProductId(item.product_id);
        setError("");

        try {
            const data = await updateCartQuantity({
                productId: item.product_id,
                quantity: nextQuantity,
            });
            setCart(data);
        } catch (err) {
            setError(err.message || "Failed to update cart");
        } finally {
            setActionProductId(null);
        }
    };

    const handleRemove = async (productId) => {
        setActionProductId(productId);
        setError("");

        try {
            const data = await removeCartItem(productId);
            setCart(data);
        } catch (err) {
            setError(err.message || "Failed to remove item");
        } finally {
            setActionProductId(null);
        }
    };

    const handlePayment = async () => {
        setCheckoutLoading(true);
        setError("");
        setPaymentMessage("");

        try {
            await loadRazorpayCheckout();

            const order = await createOrder();
            const paymentOrder = await createRazorpayOrder(order.id);

            const razorpay = new window.Razorpay({
                key: paymentOrder.key_id,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                name: "Dealiva",
                description: `Order #${order.id}`,
                order_id: paymentOrder.razorpay_order_id,
                handler: async (response) => {
                    try {
                        const verified = await verifyRazorpayPayment({
                            orderId: order.id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        setPaymentMessage(`Payment successful. Order status: ${verified.status}`);
                        setCart({
                            shop_id: null,
                            shop: null,
                            items: [],
                            total_amount: "0.00",
                        });
                    } catch (err) {
                        setError(err.message || "Payment verification failed");
                    } finally {
                        setCheckoutLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setCheckoutLoading(false);
                        setError(`Payment was not completed for order #${order.id}.`);
                    },
                },
                theme: {
                    color: "#22c55e",
                },
            });

            razorpay.open();
        } catch (err) {
            setCheckoutLoading(false);
            setError(err.message || "Failed to start payment");
        }
    };

    const items = cart?.items || [];
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
                <Link to="/home" className="flex items-center gap-2">
                    <img
                        src="/logo.jpg"
                        alt="Dealiva"
                        className="h-8 w-8 object-contain"
                    />
                    <span className="text-xl font-bold text-green-600">
                        Dealiva
                    </span>
                </Link>

                <nav className="flex items-center gap-6 text-sm text-gray-600">
                    <Link to="/home" className="hover:text-green-600">
                        Shops
                    </Link>
                    <span className="font-semibold text-green-600">Cart</span>
                    <Link to="/profile" className="hover:text-green-600">
                        Profile
                    </Link>
                </nav>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Checkout
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Review your items before placing an order.
                        </p>
                    </div>

                    <Link
                        to="/orders"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-500 px-5 text-sm font-semibold text-green-600 transition hover:bg-green-50"
                    >
                        Track Orders
                    </Link>
                </div>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {paymentMessage && (
                    <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                        <span>{paymentMessage}</span>
                        <Link to="/orders" className="font-semibold hover:text-green-800">
                            View Orders
                        </Link>
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                                        Picking up from
                                    </p>
                                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                                        {cart?.shop?.name || "No shop selected"}
                                    </h2>
                                    {cart?.shop && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            {cart.shop.address}, {cart.shop.city}
                                        </p>
                                    )}
                                </div>

                                <Link
                                    to="/home"
                                    className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-green-500 hover:text-green-600"
                                >
                                    Switch Shop
                                </Link>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-4">
                                <h2 className="text-lg font-bold text-gray-900">
                                    Items in Cart ({itemCount})
                                </h2>
                            </div>

                            {loading && (
                                <p className="p-5 text-sm text-gray-500">
                                    Loading cart...
                                </p>
                            )}

                            {!loading && items.length === 0 && (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-gray-500">
                                        Your cart is empty.
                                    </p>
                                    <Link
                                        to="/home"
                                        className="mt-4 inline-flex rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-white hover:bg-green-600"
                                    >
                                        Browse Shops
                                    </Link>
                                </div>
                            )}

                            {!loading && items.length > 0 && (
                                <div className="divide-y">
                                    {items.map((item) => {
                                        const busy = actionProductId === item.product_id;

                                        return (
                                            <div
                                                key={item.product_id}
                                                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                                            >
                                                <img
                                                    src={item.image_url || shopPlaceholder}
                                                    alt={item.name}
                                                    className="h-20 w-20 rounded-lg object-cover"
                                                />

                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {item.name}
                                                    </h3>
                                                    {item.description && (
                                                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <p className="mt-2 text-lg font-bold text-gray-900">
                                                        {formatCurrency(item.price)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center rounded-lg border border-gray-200">
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                                            className="px-3 py-2 text-gray-700 disabled:opacity-50"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="min-w-8 text-center text-sm font-semibold">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                                            className="px-3 py-2 text-gray-700 disabled:opacity-50"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => handleRemove(item.product_id)}
                                                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="h-fit rounded-lg border border-green-100 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900">
                            Order Summary
                        </h2>

                        <div className="mt-6 space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Items total</span>
                                <span>{formatCurrency(cart?.total_amount || 0)}</span>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-5">
                            <p className="text-xs font-semibold uppercase text-gray-500">
                                Amount to pay
                            </p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">
                                {formatCurrency(cart?.total_amount || 0)}
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={items.length === 0 || checkoutLoading}
                            onClick={handlePayment}
                            className="mt-6 w-full rounded-lg bg-green-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {checkoutLoading ? "Starting Payment..." : "Pay with Razorpay"}
                        </button>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default CartPage;
