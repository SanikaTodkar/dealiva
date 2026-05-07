import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ShopListPage from "../pages/ShopListPage";
import ShopDetailsPage from "../pages/ShopDetailsPage";
import CartPage from "../pages/CartPage";
import OrdersPage from "../pages/OrdersPage";
import CustomerProfilePage from "../pages/CustomerProfilePage";
import ShopOwnerDashboardPage from "../pages/ShopOwnerDashboardPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";

const DashboardRedirect = () => {
    const { role, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (role === "customer") return <Navigate to="/home" replace />;
    if (role === "shop_owner") return <Navigate to="/dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;

    return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public landing */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<DashboardRedirect />} />

            {/* Customer */}
            <Route
                path="/home"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <ShopListPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/shops/:shopId"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <ShopDetailsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/cart"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <CartPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/orders"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <OrdersPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute allowedRoles={["customer"]}>
                        <CustomerProfilePage />
                    </ProtectedRoute>
                }
            />

            {/* Shop Owner */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["shop_owner"]}>
                        <ShopOwnerDashboardPage />
                    </ProtectedRoute>
                }
            />

            {/* Admin */}
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                }
            />

            {/* Catch-all (optional but recommended) */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
