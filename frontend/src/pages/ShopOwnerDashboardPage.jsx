import { useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import {
    getMyShop,
    getShopDashboard,
    getShopMonthlySales,
    getShopTopSellingProducts,
    registerShop,
    sendShopOtp,
    updateShop,
    verifyShopOtp,
} from "../api/shops";
import { getOwnerProducts, createProduct, updateProduct, deleteProduct } from "../api/products";
import { getShopOrders, updateShopOrderStatus } from "../api/orders";
import { MAHARASHTRA_CITIES } from "../utils/cities";

const PRODUCT_LIMIT = 10;
const NEXT_ORDER_STATUS = {
    Placed: "Paid",
    Paid: "Ready for Pickup",
    "Ready for Pickup": "Completed",
    Completed: null,
};

const emptyShopForm = {
    name: "",
    address: "",
    city: "",
};

const emptyProductForm = {
    name: "",
    description: "",
    image_url: "",
    price: "",
    stock: "",
    expiry_date: "",
};

const formatCurrency = (value) => {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return "₹0";
    }

    return `₹${amount.toFixed(0)}`;
};

const formatDate = (value) => {
    if (!value) return "Not set";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const normalizeProductPayload = (form) => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    image_url: form.image_url.trim() || null,
    price: form.price,
    stock: Number(form.stock),
    expiry_date: form.expiry_date || null,
});

const getAllowedStatusOptions = (status) => {
    const nextStatus = NEXT_ORDER_STATUS[status];
    return nextStatus ? [status, nextStatus] : [status];
};

const ShopOwnerDashboardPage = () => {
    const [shop, setShop] = useState(null);
    const [shopChecked, setShopChecked] = useState(false);
    const [shopLoading, setShopLoading] = useState(false);
    const [shopError, setShopError] = useState("");
    const [shopForm, setShopForm] = useState(emptyShopForm);
    const [shopSaving, setShopSaving] = useState(false);
    const [shopMessage, setShopMessage] = useState("");

    const [otpCode, setOtpCode] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState("");
    const [otpError, setOtpError] = useState("");

    const [dashboard, setDashboard] = useState(null);
    const [monthlySales, setMonthlySales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState("");

    const [products, setProducts] = useState([]);
    const [productPage, setProductPage] = useState(1);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState("");
    const [productForm, setProductForm] = useState(emptyProductForm);
    const [editingProductId, setEditingProductId] = useState(null);
    const [productSaving, setProductSaving] = useState(false);
    const [productMessage, setProductMessage] = useState("");

    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const productOffset = (productPage - 1) * PRODUCT_LIMIT;
    const isApproved = shop?.status === "approved";

    const loadShop = async () => {
        setShopLoading(true);
        setShopError("");
        setShopMessage("");

        try {
            const data = await getMyShop();
            setShop(data);
            setShopForm({
                name: data.name || "",
                address: data.address || "",
                city: data.city || "",
            });
        } catch (err) {
            if (err.message === "Shop not found") {
                setShop(null);
                setShopForm(emptyShopForm);
            } else {
                setShopError(err.message || "Failed to load shop");
            }
        } finally {
            setShopChecked(true);
            setShopLoading(false);
        }
    };

    const loadApprovedShopData = async () => {
        if (!isApproved) return;

        setDashboardLoading(true);
        setDashboardError("");

        const [dashboardResult, monthlyResult, topResult] = await Promise.allSettled([
            getShopDashboard(),
            getShopMonthlySales(),
            getShopTopSellingProducts({ limit: 5 }),
        ]);

        if (dashboardResult.status === "fulfilled") {
            setDashboard(dashboardResult.value);
        } else {
            setDashboardError(dashboardResult.reason?.message || "Failed to load dashboard metrics");
        }

        if (monthlyResult.status === "fulfilled") {
            setMonthlySales(monthlyResult.value.monthly_sales || []);
        }

        if (topResult.status === "fulfilled") {
            setTopProducts(topResult.value.top_selling_products || []);
        }

        setDashboardLoading(false);
    };

    const loadProducts = async () => {
        if (!isApproved) return;

        setProductsLoading(true);
        setProductsError("");

        try {
            const data = await getOwnerProducts({
                limit: PRODUCT_LIMIT,
                offset: productOffset,
            });
            setProducts(data);
        } catch (err) {
            setProductsError(err.message || "Failed to load products");
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const start = async () => {
            if (isMounted) await loadShop();
        };

        start();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (!isApproved) return;

            setDashboardLoading(true);
            setDashboardError("");
            setOrdersLoading(true);
            setOrdersError("");

            const [dashboardResult, monthlyResult, topResult, ordersResult] = await Promise.allSettled([
                getShopDashboard(),
                getShopMonthlySales(),
                getShopTopSellingProducts({ limit: 5 }),
                getShopOrders(),
            ]);

            if (!isMounted) return;

            if (dashboardResult.status === "fulfilled") {
                setDashboard(dashboardResult.value);
            } else {
                setDashboardError(dashboardResult.reason?.message || "Failed to load dashboard metrics");
            }

            if (monthlyResult.status === "fulfilled") {
                setMonthlySales(monthlyResult.value.monthly_sales || []);
            }

            if (topResult.status === "fulfilled") {
                setTopProducts(topResult.value.top_selling_products || []);
            }

            if (ordersResult.status === "fulfilled") {
                setOrders(ordersResult.value);
            } else {
                setOrdersError(ordersResult.reason?.message || "Failed to load orders");
            }

            setDashboardLoading(false);
            setOrdersLoading(false);
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [isApproved]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (!isApproved) return;

            setProductsLoading(true);
            setProductsError("");

            try {
                const data = await getOwnerProducts({
                    limit: PRODUCT_LIMIT,
                    offset: productOffset,
                });
                if (isMounted) setProducts(data);
            } catch (err) {
                if (isMounted) setProductsError(err.message || "Failed to load products");
            } finally {
                if (isMounted) setProductsLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [isApproved, productOffset]);

    const stats = useMemo(() => {
        return [
            { label: "Products", value: dashboard?.total_products ?? 0 },
            { label: "Orders", value: dashboard?.total_orders ?? 0 },
            { label: "Revenue", value: formatCurrency(dashboard?.total_revenue ?? 0) },
        ];
    }, [dashboard]);

    const handleShopFieldChange = (event) => {
        const { name, value } = event.target;
        setShopForm((current) => ({ ...current, [name]: value }));
    };

    const handleProductFieldChange = (event) => {
        const { name, value } = event.target;
        setProductForm((current) => ({ ...current, [name]: value }));
    };

    const validateShopForm = () => {
        if (!shopForm.name.trim() || !shopForm.address.trim() || !shopForm.city) {
            return "Please fill shop name, address, and city.";
        }

        return "";
    };

    const validateProductForm = () => {
        if (!productForm.name.trim() || !productForm.price || productForm.stock === "") {
            return "Please fill product name, price, and stock.";
        }

        if (Number(productForm.price) <= 0) {
            return "Price must be greater than 0.";
        }

        if (Number(productForm.stock) < 0) {
            return "Stock cannot be negative.";
        }

        return "";
    };

    const handleShopSubmit = async (event) => {
        event.preventDefault();

        const validationError = validateShopForm();
        if (validationError) {
            setShopError(validationError);
            return;
        }

        setShopSaving(true);
        setShopError("");
        setShopMessage("");

        try {
            const payload = {
                name: shopForm.name.trim(),
                address: shopForm.address.trim(),
                city: shopForm.city,
            };
            const data = shop ? await updateShop(payload) : await registerShop(payload);
            setShop(data);
            setShopMessage(shop ? "Shop details updated." : "Shop registered successfully.");
        } catch (err) {
            setShopError(err.message || "Failed to save shop");
        } finally {
            setShopSaving(false);
        }
    };

    const handleSendOtp = async () => {
        setOtpLoading(true);
        setOtpError("");
        setOtpMessage("");

        try {
            const data = await sendShopOtp();
            setOtpMessage(data.message || "OTP generated successfully.");
        } catch (err) {
            setOtpError(err.message || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();

        if (otpCode.trim().length !== 6) {
            setOtpError("Enter the 6 digit OTP.");
            return;
        }

        setOtpLoading(true);
        setOtpError("");
        setOtpMessage("");

        try {
            const data = await verifyShopOtp(otpCode.trim());
            setOtpMessage(data.message || "OTP verified successfully.");
            setOtpCode("");
            await loadShop();
        } catch (err) {
            setOtpError(err.message || "Failed to verify OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleProductSubmit = async (event) => {
        event.preventDefault();

        const validationError = validateProductForm();
        if (validationError) {
            setProductsError(validationError);
            return;
        }

        setProductSaving(true);
        setProductsError("");
        setProductMessage("");

        try {
            const payload = normalizeProductPayload(productForm);
            if (editingProductId) {
                await updateProduct(editingProductId, payload);
                setProductMessage("Product updated.");
            } else {
                await createProduct(payload);
                setProductMessage("Product created.");
            }

            setProductForm(emptyProductForm);
            setEditingProductId(null);
            setProductPage(1);
            await loadProducts();
            await loadApprovedShopData();
        } catch (err) {
            setProductsError(err.message || "Failed to save product");
        } finally {
            setProductSaving(false);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProductId(product.id);
        setProductForm({
            name: product.name || "",
            description: product.description || "",
            image_url: product.image_url || "",
            price: String(product.price || ""),
            stock: String(product.stock ?? ""),
            expiry_date: product.expiry_date || "",
        });
        setProductMessage("");
        setProductsError("");
    };

    const handleCancelProductEdit = () => {
        setEditingProductId(null);
        setProductForm(emptyProductForm);
        setProductsError("");
        setProductMessage("");
    };

    const handleDeleteProduct = async (productId) => {
        setProductSaving(true);
        setProductsError("");
        setProductMessage("");

        try {
            await deleteProduct(productId);
            setProductMessage("Product deleted.");
            await loadProducts();
            await loadApprovedShopData();
        } catch (err) {
            setProductsError(err.message || "Failed to delete product");
        } finally {
            setProductSaving(false);
        }
    };

    const handleOrderStatusChange = async (orderId, status) => {
        setUpdatingOrderId(orderId);
        setOrdersError("");

        try {
            const updated = await updateShopOrderStatus({ orderId, status });
            setOrders((current) =>
                current.map((order) => (order.order_id === orderId ? updated : order))
            );
            await loadApprovedShopData();
        } catch (err) {
            setOrdersError(err.message || "Failed to update order status");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    return (
        <AuthenticatedLayout role="shop_owner">
            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-sm text-gray-500">Shop Owner</p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        Manage your shop, products, and customer orders using backend data.
                    </p>
                </div>

                {shopLoading && (
                    <div className="rounded-lg bg-white p-6 text-sm text-gray-500 shadow-sm">
                        Loading shop details...
                    </div>
                )}

                {!shopLoading && shopChecked && (
                    <div className="space-y-8">
                        <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {shop ? "Shop Details" : "Register Shop"}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {shop
                                            ? `Current status: ${shop.status}`
                                            : "Create a shop before adding products or viewing orders."}
                                    </p>
                                </div>

                                {shop && (
                                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                        {shop.is_otp_verified ? "OTP verified" : "OTP not verified"}
                                    </span>
                                )}
                            </div>

                            {shopError && (
                                <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {shopError}
                                </div>
                            )}

                            {shopMessage && (
                                <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    {shopMessage}
                                </div>
                            )}

                            <form onSubmit={handleShopSubmit} className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Shop Name</label>
                                    <input
                                        name="name"
                                        value={shopForm.name}
                                        onChange={handleShopFieldChange}
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Address</label>
                                    <input
                                        name="address"
                                        value={shopForm.address}
                                        onChange={handleShopFieldChange}
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">City</label>
                                    <select
                                        name="city"
                                        value={shopForm.city}
                                        onChange={handleShopFieldChange}
                                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500"
                                    >
                                        <option value="">Select City</option>
                                        {MAHARASHTRA_CITIES.map((city) => (
                                            <option key={city} value={city}>
                                                {city.charAt(0).toUpperCase() + city.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-3">
                                    <button
                                        type="submit"
                                        disabled={shopSaving}
                                        className="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                                    >
                                        {shopSaving ? "Saving..." : shop ? "Update Shop" : "Register Shop"}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {shop && !shop.is_otp_verified && (
                            <section className="rounded-lg border border-yellow-100 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900">Verify Shop OTP</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Generate an OTP and enter the 6 digit code to continue the shop approval process.
                                </p>

                                {otpError && <p className="mt-4 text-sm text-red-500">{otpError}</p>}
                                {otpMessage && <p className="mt-4 text-sm text-green-600">{otpMessage}</p>}

                                <div className="mt-5 flex flex-col gap-4 sm:flex-row">
                                    <button
                                        type="button"
                                        disabled={otpLoading}
                                        onClick={handleSendOtp}
                                        className="rounded-lg border border-green-500 px-5 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 disabled:opacity-50"
                                    >
                                        {otpLoading ? "Processing..." : "Send OTP"}
                                    </button>

                                    <form onSubmit={handleVerifyOtp} className="flex flex-1 gap-3">
                                        <input
                                            value={otpCode}
                                            onChange={(event) => setOtpCode(event.target.value)}
                                            maxLength={6}
                                            className="min-h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-green-500"
                                            placeholder="Enter OTP"
                                        />
                                        <button
                                            type="submit"
                                            disabled={otpLoading}
                                            className="rounded-lg bg-green-500 px-5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                                        >
                                            Verify
                                        </button>
                                    </form>
                                </div>
                            </section>
                        )}

                        {shop && shop.is_otp_verified && !isApproved && (
                            <section className="rounded-lg border border-blue-100 bg-blue-50 p-6">
                                <h2 className="text-xl font-bold text-gray-900">Shop Status</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Your shop status is <span className="font-semibold">{shop.status}</span>. Product and order management will be available after approval.
                                </p>
                            </section>
                        )}

                        {isApproved && (
                            <>
                                <section className="grid gap-5 md:grid-cols-3">
                                    {stats.map((stat) => (
                                        <div key={stat.label} className="rounded-lg bg-white p-5 shadow-sm">
                                            <p className="text-sm font-semibold text-green-600">{stat.label}</p>
                                            <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                                        </div>
                                    ))}
                                </section>

                                {dashboardLoading && (
                                    <p className="text-sm text-gray-500">Loading dashboard metrics...</p>
                                )}

                                {dashboardError && (
                                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                                        {dashboardError}
                                    </div>
                                )}

                                <section className="grid gap-6 lg:grid-cols-2">
                                    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                        <h2 className="text-lg font-bold text-gray-900">Monthly Sales</h2>
                                        {monthlySales.length === 0 ? (
                                            <p className="mt-4 text-sm text-gray-500">No sales data available.</p>
                                        ) : (
                                            <div className="mt-4 space-y-3">
                                                {monthlySales.map((item) => (
                                                    <div key={item.month} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{item.month}</span>
                                                        <span className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                        <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
                                        {topProducts.length === 0 ? (
                                            <p className="mt-4 text-sm text-gray-500">No product sales data available.</p>
                                        ) : (
                                            <div className="mt-4 space-y-3">
                                                {topProducts.map((product) => (
                                                    <div key={product.product_id} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{product.product_name}</span>
                                                        <span className="font-semibold text-gray-900">{product.quantity_sold} sold</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="grid gap-8 lg:grid-cols-[380px_1fr]">
                                    <form onSubmit={handleProductSubmit} className="h-fit rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {editingProductId ? "Edit Product" : "Add Product"}
                                        </h2>

                                        {productsError && (
                                            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                                {productsError}
                                            </p>
                                        )}

                                        {productMessage && (
                                            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                                                {productMessage}
                                            </p>
                                        )}

                                        <div className="mt-5 space-y-4">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Name</label>
                                                <input name="name" value={productForm.name} onChange={handleProductFieldChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Description</label>
                                                <textarea name="description" value={productForm.description} onChange={handleProductFieldChange} rows={3} className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Image URL</label>
                                                <input name="image_url" value={productForm.image_url} onChange={handleProductFieldChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500" />
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className="text-sm font-semibold text-gray-700">Price</label>
                                                    <input name="price" type="number" min="1" step="0.01" value={productForm.price} onChange={handleProductFieldChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-semibold text-gray-700">Stock</label>
                                                    <input name="stock" type="number" min="0" value={productForm.stock} onChange={handleProductFieldChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Expiry Date</label>
                                                <input name="expiry_date" type="date" value={productForm.expiry_date} onChange={handleProductFieldChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500" />
                                            </div>
                                        </div>

                                        <div className="mt-5 flex gap-3">
                                            <button type="submit" disabled={productSaving} className="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50">
                                                {productSaving ? "Saving..." : editingProductId ? "Update Product" : "Add Product"}
                                            </button>
                                            {editingProductId && (
                                                <button type="button" onClick={handleCancelProductEdit} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:border-green-500 hover:text-green-600">
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </form>

                                    <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
                                        <div className="border-b px-5 py-4">
                                            <h2 className="text-lg font-bold text-gray-900">Products</h2>
                                        </div>

                                        {productsLoading && <p className="p-5 text-sm text-gray-500">Loading products...</p>}

                                        {!productsLoading && products.length === 0 && (
                                            <p className="p-5 text-sm text-gray-500">No products found.</p>
                                        )}

                                        {!productsLoading && products.length > 0 && (
                                            <div className="divide-y">
                                                {products.map((product) => (
                                                    <div key={product.id} className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Price {formatCurrency(product.price)} | Final {formatCurrency(product.final_price)} | Stock {product.stock}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Discount {product.discount_percent}% | Expiry {formatDate(product.expiry_date)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => handleEditProduct(product)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-green-500 hover:text-green-600">
                                                                Edit
                                                            </button>
                                                            <button type="button" disabled={productSaving} onClick={() => handleDeleteProduct(product.id)} className="rounded-lg px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-center gap-4 border-t p-5">
                                            <button disabled={productPage === 1 || productsLoading} onClick={() => setProductPage((page) => page - 1)} className="rounded border px-4 py-2 text-sm disabled:opacity-50">
                                                Previous
                                            </button>
                                            <span className="px-4 py-2 text-sm">Page {productPage}</span>
                                            <button disabled={products.length < PRODUCT_LIMIT || productsLoading} onClick={() => setProductPage((page) => page + 1)} className="rounded border px-4 py-2 text-sm disabled:opacity-50">
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
                                    <div className="border-b px-5 py-4">
                                        <h2 className="text-lg font-bold text-gray-900">Shop Orders</h2>
                                    </div>

                                    {ordersError && (
                                        <p className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">{ordersError}</p>
                                    )}

                                    {ordersLoading && <p className="p-5 text-sm text-gray-500">Loading orders...</p>}

                                    {!ordersLoading && orders.length === 0 && (
                                        <p className="p-5 text-sm text-gray-500">No shop orders found.</p>
                                    )}

                                    {!ordersLoading && orders.length > 0 && (
                                        <div className="divide-y">
                                            {orders.map((order) => (
                                                <div key={order.order_id} className="p-5">
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">Order #{order.order_id}</h3>
                                                            <p className="mt-1 text-sm text-gray-500">Customer #{order.customer_id}</p>
                                                            <p className="mt-1 text-sm font-semibold text-green-600">{formatCurrency(order.total_amount)}</p>
                                                        </div>
                                                        <select
                                                            value={order.status}
                                                            disabled={
                                                                updatingOrderId === order.order_id ||
                                                                !NEXT_ORDER_STATUS[order.status]
                                                            }
                                                            onChange={(event) => handleOrderStatusChange(order.order_id, event.target.value)}
                                                            className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500 disabled:opacity-50"
                                                        >
                                                            {getAllowedStatusOptions(order.status).map((status) => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="mt-4 overflow-x-auto">
                                                        <table className="w-full min-w-[560px] text-left text-sm">
                                                            <thead>
                                                                <tr className="border-b text-gray-500">
                                                                    <th className="py-2 font-semibold">Product</th>
                                                                    <th className="py-2 font-semibold">Qty</th>
                                                                    <th className="py-2 font-semibold">Unit</th>
                                                                    <th className="py-2 font-semibold">Line Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {order.items.map((item) => (
                                                                    <tr key={item.product_id}>
                                                                        <td className="py-2">Product #{item.product_id}</td>
                                                                        <td className="py-2">{item.quantity}</td>
                                                                        <td className="py-2">{formatCurrency(item.unit_price)}</td>
                                                                        <td className="py-2 font-semibold">{formatCurrency(item.line_total)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </div>
                )}
            </main>
        </AuthenticatedLayout>
    );
};

export default ShopOwnerDashboardPage;
