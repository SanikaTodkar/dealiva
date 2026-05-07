import { useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import {
    approveAdminShop,
    blockAdminCustomer,
    blockAdminShop,
    getAdminCustomers,
    getAdminDashboard,
    getAdminShops,
    unblockAdminCustomer,
} from "../api/admin";

const SHOP_LIMIT = 10;

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
    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const statusClass = (status) => {
    if (status === "approved") return "bg-green-50 text-green-700";
    if (status === "blocked") return "bg-red-50 text-red-700";
    return "bg-yellow-50 text-yellow-700";
};

const AdminDashboardPage = () => {
    const [dashboard, setDashboard] = useState(null);
    const [shops, setShops] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [shopPage, setShopPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [shopsLoading, setShopsLoading] = useState(false);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [error, setError] = useState("");
    const [shopsError, setShopsError] = useState("");
    const [customersError, setCustomersError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [shopActionId, setShopActionId] = useState(null);
    const [customerActionId, setCustomerActionId] = useState(null);

    const shopOffset = (shopPage - 1) * SHOP_LIMIT;

    const stats = useMemo(() => {
        return [
            { label: "Shops", value: dashboard?.total_shops ?? 0 },
            { label: "Customers", value: dashboard?.total_customers ?? 0 },
            { label: "Orders", value: dashboard?.total_orders ?? 0 },
            { label: "Revenue", value: formatCurrency(dashboard?.total_revenue ?? 0) },
        ];
    }, [dashboard]);

    const loadDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getAdminDashboard();
            setDashboard(data);
        } catch (err) {
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    const loadShops = async () => {
        setShopsLoading(true);
        setShopsError("");

        try {
            const data = await getAdminShops({
                limit: SHOP_LIMIT,
                offset: shopOffset,
            });
            setShops(data);
        } catch (err) {
            setShopsError(err.message || "Failed to load shops");
        } finally {
            setShopsLoading(false);
        }
    };

    const loadCustomers = async () => {
        setCustomersLoading(true);
        setCustomersError("");

        try {
            const data = await getAdminCustomers();
            setCustomers(data);
        } catch (err) {
            setCustomersError(err.message || "Failed to load customers");
        } finally {
            setCustomersLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            setLoading(true);
            setCustomersLoading(true);
            setError("");
            setCustomersError("");

            const [dashboardResult, customersResult] = await Promise.allSettled([
                getAdminDashboard(),
                getAdminCustomers(),
            ]);

            if (!isMounted) return;

            if (dashboardResult.status === "fulfilled") {
                setDashboard(dashboardResult.value);
            } else {
                setError(dashboardResult.reason?.message || "Failed to load dashboard");
            }

            if (customersResult.status === "fulfilled") {
                setCustomers(customersResult.value);
            } else {
                setCustomersError(customersResult.reason?.message || "Failed to load customers");
            }

            setLoading(false);
            setCustomersLoading(false);
        };

        loadInitialData();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadShopPage = async () => {
            setShopsLoading(true);
            setShopsError("");

            try {
                const data = await getAdminShops({
                    limit: SHOP_LIMIT,
                    offset: shopOffset,
                });
                if (isMounted) setShops(data);
            } catch (err) {
                if (isMounted) setShopsError(err.message || "Failed to load shops");
            } finally {
                if (isMounted) setShopsLoading(false);
            }
        };

        loadShopPage();

        return () => {
            isMounted = false;
        };
    }, [shopOffset]);

    const handleApproveShop = async (shopId) => {
        setShopActionId(shopId);
        setShopsError("");
        setActionMessage("");

        try {
            const updated = await approveAdminShop(shopId);
            setShops((current) => current.map((shop) => (shop.id === shopId ? updated : shop)));
            setActionMessage("Shop approved.");
            await loadDashboard();
        } catch (err) {
            setShopsError(err.message || "Failed to approve shop");
        } finally {
            setShopActionId(null);
        }
    };

    const handleBlockShop = async (shopId) => {
        setShopActionId(shopId);
        setShopsError("");
        setActionMessage("");

        try {
            const updated = await blockAdminShop(shopId);
            setShops((current) => current.map((shop) => (shop.id === shopId ? updated : shop)));
            setActionMessage("Shop blocked.");
            await loadDashboard();
        } catch (err) {
            setShopsError(err.message || "Failed to block shop");
        } finally {
            setShopActionId(null);
        }
    };

    const handleCustomerStatus = async (customer) => {
        setCustomerActionId(customer.id);
        setCustomersError("");
        setActionMessage("");

        try {
            const updated = customer.is_blocked
                ? await unblockAdminCustomer(customer.id)
                : await blockAdminCustomer(customer.id);

            setCustomers((current) =>
                current.map((item) => (item.id === customer.id ? updated : item))
            );
            setActionMessage(customer.is_blocked ? "Customer unblocked." : "Customer blocked.");
        } catch (err) {
            setCustomersError(err.message || "Failed to update customer");
        } finally {
            setCustomerActionId(null);
        }
    };

    return (
        <AuthenticatedLayout role="admin" rightContent="Admin">
            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-sm text-gray-500">Admin</p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        Review shop approvals and customer account status using backend data.
                    </p>
                </div>

                {actionMessage && (
                    <div className="mb-5 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {actionMessage}
                    </div>
                )}

                {error && (
                    <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <section className="grid gap-5 md:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold text-green-600">{stat.label}</p>
                            <p className="mt-3 text-3xl font-bold text-gray-900">
                                {loading ? "..." : stat.value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="mt-8 rounded-lg border border-gray-100 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Shops</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Approve only OTP-verified shops. Block shops when needed.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={loadShops}
                            className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-green-500 hover:text-green-600"
                        >
                            Refresh
                        </button>
                    </div>

                    {shopsError && (
                        <p className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">{shopsError}</p>
                    )}

                    {shopsLoading && <p className="p-5 text-sm text-gray-500">Loading shops...</p>}

                    {!shopsLoading && shops.length === 0 && (
                        <p className="p-5 text-sm text-gray-500">No shops found.</p>
                    )}

                    {!shopsLoading && shops.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-gray-500">
                                        <th className="px-5 py-3 font-semibold">Shop</th>
                                        <th className="px-5 py-3 font-semibold">Owner</th>
                                        <th className="px-5 py-3 font-semibold">City</th>
                                        <th className="px-5 py-3 font-semibold">OTP</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Created</th>
                                        <th className="px-5 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {shops.map((shop) => (
                                        <tr key={shop.id}>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900">{shop.name}</p>
                                                <p className="mt-1 text-xs text-gray-500">{shop.address}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">Owner #{shop.owner_id}</td>
                                            <td className="px-5 py-4 text-gray-600">{shop.city}</td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shop.is_otp_verified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                                                    {shop.is_otp_verified ? "Verified" : "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(shop.status)}`}>
                                                    {shop.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">{formatDate(shop.created_at)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={shopActionId === shop.id || !shop.is_otp_verified || shop.status === "approved"}
                                                        onClick={() => handleApproveShop(shop.id)}
                                                        className="rounded-lg border border-green-500 px-3 py-2 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={shopActionId === shop.id || shop.status === "blocked"}
                                                        onClick={() => handleBlockShop(shop.id)}
                                                        className="rounded-lg px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Block
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-center gap-4 border-t p-5">
                        <button
                            type="button"
                            disabled={shopPage === 1 || shopsLoading}
                            onClick={() => setShopPage((page) => page - 1)}
                            className="rounded border px-4 py-2 text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm">Page {shopPage}</span>
                        <button
                            type="button"
                            disabled={shops.length < SHOP_LIMIT || shopsLoading}
                            onClick={() => setShopPage((page) => page + 1)}
                            className="rounded border px-4 py-2 text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </section>

                <section className="mt-8 rounded-lg border border-gray-100 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Customers</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Block or unblock customer accounts.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={loadCustomers}
                            className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-green-500 hover:text-green-600"
                        >
                            Refresh
                        </button>
                    </div>

                    {customersError && (
                        <p className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">{customersError}</p>
                    )}

                    {customersLoading && <p className="p-5 text-sm text-gray-500">Loading customers...</p>}

                    {!customersLoading && customers.length === 0 && (
                        <p className="p-5 text-sm text-gray-500">No customers found.</p>
                    )}

                    {!customersLoading && customers.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] text-left text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-gray-500">
                                        <th className="px-5 py-3 font-semibold">Customer</th>
                                        <th className="px-5 py-3 font-semibold">Contact</th>
                                        <th className="px-5 py-3 font-semibold">City</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Created</th>
                                        <th className="px-5 py-3 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {customers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900">{customer.name}</p>
                                                <p className="mt-1 text-xs text-gray-500">Customer #{customer.id}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-gray-600">{customer.email}</p>
                                                <p className="mt-1 text-xs text-gray-500">{customer.mobile}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">{customer.city}</td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${customer.is_blocked ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                                                    {customer.is_blocked ? "Blocked" : "Active"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">{formatDate(customer.created_at)}</td>
                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    disabled={customerActionId === customer.id}
                                                    onClick={() => handleCustomerStatus(customer)}
                                                    className={`rounded-lg px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        customer.is_blocked
                                                            ? "border border-green-500 text-green-600 hover:bg-green-50"
                                                            : "text-red-500 hover:bg-red-50"
                                                    }`}
                                                >
                                                    {customer.is_blocked ? "Unblock" : "Block"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </AuthenticatedLayout>
    );
};

export default AdminDashboardPage;
