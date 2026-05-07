import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../api/orders";

const formatCurrency = (value) => {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return "₹0";
    }

    return `₹${amount.toFixed(0)}`;
};

const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const CustomerProfilePage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadOrders = async () => {
            setLoading(true);
            setError("");

            try {
                const data = await getMyOrders();
                if (isMounted) setOrders(data);
            } catch (err) {
                if (isMounted) setError(err.message || "Failed to load profile");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadOrders();

        return () => {
            isMounted = false;
        };
    }, []);

    const stats = useMemo(() => {
        const paidOrders = orders.filter((order) =>
            ["Paid", "Completed"].includes(order.status)
        );
        const totalPaid = paidOrders.reduce(
            (total, order) => total + Number(order.total_amount || 0),
            0
        );
        const latestOrder = orders[0] || null;

        return {
            orderCount: orders.length,
            totalPaid,
            latestStatus: latestOrder?.status || "No orders",
        };
    }, [orders]);

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
                    <Link to="/orders" className="hover:text-green-600">
                        Orders
                    </Link>
                    <span className="font-semibold text-green-600">Profile</span>
                </nav>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Customer Profile
                    </h1>
                    <p className="mt-2 text-gray-600">
                        View your order activity and account actions.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
                    <aside className="space-y-6">
                        <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                            <div className="h-24 bg-gradient-to-r from-green-100 to-sky-100" />
                            <div className="-mt-10 px-6 pb-6 text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-green-500 text-2xl font-bold text-white shadow-sm">
                                    C
                                </div>
                                <h2 className="mt-4 text-xl font-bold text-gray-900">
                                    Customer Account
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Profile details are not available from the current backend.
                                </p>

                                <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5">
                                    <div>
                                        <p className="text-xl font-bold text-green-600">
                                            {stats.orderCount}
                                        </p>
                                        <p className="text-xs uppercase text-gray-500">
                                            Orders
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-green-600">
                                            {formatCurrency(stats.totalPaid)}
                                        </p>
                                        <p className="text-xs uppercase text-gray-500">
                                            Paid
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-lg border border-green-100 bg-green-50 p-4">
                            <Link
                                to="/orders"
                                className="flex items-center justify-between font-semibold text-green-700"
                            >
                                <span>My Orders</span>
                                <span>›</span>
                            </Link>
                        </section>
                    </aside>

                    <section className="space-y-6">
                        <div className="grid gap-5 md:grid-cols-3">
                            <div className="rounded-lg bg-green-50 p-5">
                                <p className="text-sm font-semibold text-green-600">
                                    Total Orders
                                </p>
                                <p className="mt-3 text-3xl font-bold text-gray-900">
                                    {stats.orderCount}
                                </p>
                            </div>

                            <div className="rounded-lg bg-sky-50 p-5">
                                <p className="text-sm font-semibold text-sky-600">
                                    Total Paid
                                </p>
                                <p className="mt-3 text-3xl font-bold text-gray-900">
                                    {formatCurrency(stats.totalPaid)}
                                </p>
                            </div>

                            <div className="rounded-lg bg-orange-50 p-5">
                                <p className="text-sm font-semibold text-orange-600">
                                    Latest Status
                                </p>
                                <p className="mt-3 text-3xl font-bold text-gray-900">
                                    {stats.latestStatus}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Order History
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Recent orders from your account.
                                    </p>
                                </div>

                                <Link
                                    to="/orders"
                                    className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-green-500 hover:text-green-600"
                                >
                                    Track Orders
                                </Link>
                            </div>

                            {loading && (
                                <p className="py-6 text-sm text-gray-500">
                                    Loading orders...
                                </p>
                            )}

                            {!loading && orders.length === 0 && (
                                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
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

                            {!loading && orders.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[680px] text-left text-sm">
                                        <thead>
                                            <tr className="border-b text-gray-500">
                                                <th className="py-3 font-semibold">Order ID</th>
                                                <th className="py-3 font-semibold">Date</th>
                                                <th className="py-3 font-semibold">Status</th>
                                                <th className="py-3 font-semibold">Total</th>
                                                <th className="py-3 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="py-4 font-semibold text-green-600">
                                                        ORD-{order.id}
                                                    </td>
                                                    <td className="py-4 text-gray-600">
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 font-semibold text-gray-900">
                                                        {formatCurrency(order.total_amount)}
                                                    </td>
                                                    <td className="py-4">
                                                        <Link
                                                            to="/orders"
                                                            className="font-semibold text-green-600 hover:text-green-700"
                                                        >
                                                            Track
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default CustomerProfilePage;
