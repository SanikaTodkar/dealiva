import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../api/orders";

const ORDER_STEPS = ["Placed", "Paid", "Ready for Pickup", "Completed"];

const formatCurrency = (value) => {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return "₹0";
    }

    return `₹${amount.toFixed(0)}`;
};

const formatDateTime = (value) => {
    if (!value) return "Date not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date not available";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStepIndex = (status) => {
    const index = ORDER_STEPS.indexOf(status);
    return index >= 0 ? index : 0;
};

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadOrders = async () => {
            setLoading(true);
            setError("");

            try {
                const data = await getMyOrders();
                if (!isMounted) return;

                setOrders(data);
                setSelectedOrderId(data[0]?.id || null);
            } catch (err) {
                if (isMounted) setError(err.message || "Failed to load orders");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadOrders();

        return () => {
            isMounted = false;
        };
    }, []);

    const selectedOrder = useMemo(() => {
        return orders.find((order) => order.id === selectedOrderId) || null;
    }, [orders, selectedOrderId]);

    const completedStep = getStepIndex(selectedOrder?.status);
    const itemCount = selectedOrder?.items?.reduce(
        (total, item) => total + item.quantity,
        0
    ) || 0;

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
                    <Link to="/cart" className="hover:text-green-600">
                        Cart
                    </Link>
                    <Link to="/profile" className="hover:text-green-600">
                        Profile
                    </Link>
                    <span className="font-semibold text-green-600">Orders</span>
                </nav>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-sm text-gray-500">My Orders</p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">
                        Track Your Order
                    </h1>
                    <p className="mt-2 text-gray-600">
                        View your order status and item details.
                    </p>
                </div>

                {loading && (
                    <div className="rounded-lg bg-white p-6 text-sm text-gray-500 shadow-sm">
                        Loading orders...
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                        <p className="text-sm text-gray-500">
                            No orders found.
                        </p>
                        <Link
                            to="/home"
                            className="mt-4 inline-flex rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-white hover:bg-green-600"
                        >
                            Browse Shops
                        </Link>
                    </div>
                )}

                {!loading && !error && orders.length > 0 && (
                    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                        <aside className="h-fit rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                            <h2 className="mb-4 text-lg font-bold text-gray-900">
                                My Orders
                            </h2>

                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <button
                                        key={order.id}
                                        type="button"
                                        onClick={() => setSelectedOrderId(order.id)}
                                        className={`w-full rounded-lg border p-4 text-left transition ${
                                            selectedOrderId === order.id
                                                ? "border-green-500 bg-green-50"
                                                : "border-gray-100 bg-white hover:border-green-200"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-semibold text-gray-900">
                                                Order #{order.id}
                                            </p>
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                                {order.status}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-gray-500">
                                            {formatDateTime(order.created_at)}
                                        </p>
                                        <p className="mt-2 text-sm font-semibold text-green-600">
                                            {formatCurrency(order.total_amount)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {selectedOrder && (
                            <section className="space-y-6">
                                <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Order #{selectedOrder.id}
                                            </p>
                                            <h2 className="mt-1 text-2xl font-bold text-gray-900">
                                                {selectedOrder.status}
                                            </h2>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Placed on {formatDateTime(selectedOrder.created_at)}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                                            Total Paid: {formatCurrency(selectedOrder.total_amount)}
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <div className="relative grid grid-cols-4 gap-3">
                                            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-100" />
                                            <div
                                                className="absolute left-0 top-5 h-1 bg-green-500 transition-all"
                                                style={{
                                                    width: `${(completedStep / (ORDER_STEPS.length - 1)) * 100}%`,
                                                }}
                                            />

                                            {ORDER_STEPS.map((step, index) => {
                                                const active = index <= completedStep;

                                                return (
                                                    <div key={step} className="relative text-center">
                                                        <div
                                                            className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold ${
                                                                active
                                                                    ? "border-green-500 bg-green-500 text-white"
                                                                    : "border-gray-200 bg-white text-gray-500"
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-gray-900">
                                                            {step}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
                                    <div className="flex items-center justify-between border-b px-6 py-4">
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Order Contents
                                        </h2>
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                            {itemCount} items
                                        </span>
                                    </div>

                                    <div className="divide-y">
                                        {selectedOrder.items.map((item) => (
                                            <div
                                                key={item.product_id}
                                                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        Product #{item.product_id}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Unit price: {formatCurrency(item.unit_price)}
                                                    </p>
                                                </div>

                                                <p className="text-lg font-bold text-gray-900">
                                                    {formatCurrency(item.line_total)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t px-6 py-5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-gray-900">
                                                Total Paid
                                            </span>
                                            <span className="text-2xl font-bold text-green-600">
                                                {formatCurrency(selectedOrder.total_amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrdersPage;
