import { useState } from "react";
import { loginUser } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { login } = useAuth();
    const navigate = useNavigate();

    // ✅ Basic validation
    const validateForm = () => {
        if (!email || !password) {
            setError("Please fill all fields");
            return false;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }

        return true;
    };

    const handleLogin = async () => {
        setError("");

        if (!validateForm()) return;

        setLoading(true);

        try {
            const data = await loginUser({ email, password });

            login(data.access_token, data.role);

            if (data.role === "customer") navigate("/home");
            else if (data.role === "shop_owner") navigate("/dashboard");
            else if (data.role === "admin") navigate("/admin/dashboard");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center px-8 py-4">
                <div className="flex items-center gap-2 font-semibold text-green-600 cursor-pointer">
                    ← Back to Shop
                </div>
                <div className="text-xl font-bold text-green-600">Dealiva</div>
                <div className="flex gap-6 text-sm text-gray-600">
                    <span>How it works</span>
                    <span>Support</span>
                </div>
            </div>

            {/* Center Content */}
            <div className="flex flex-1 flex-col items-center justify-center px-4">

                <div className="text-center mb-6">
                    <div className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full inline-block mb-2">
                        SECURE ACCESS
                    </div>
                    <h1 className="text-3xl font-bold">Welcome back to Dealiva</h1>
                    <p className="text-gray-500 text-sm">
                        Fresh savings and local favorites await you.
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white shadow-lg rounded-xl w-full max-w-md p-6">

                    {/* Loading State */}
                    {loading ? (
                        <div className="text-center py-6">
                            <div className="w-10 h-10 border-4 border-green-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm font-medium">Verifying secure connection...</p>
                            <div className="w-full bg-gray-200 h-1 mt-4 rounded">
                                <div className="bg-green-500 h-1 w-1/3 animate-pulse rounded"></div>
                            </div>
                        </div>
                    ) : error ? (
                        /* Error State */
                        <div className="text-center py-4">
                            <p className="text-sm font-medium text-red-500 mb-2">
                                Authentication Failed
                            </p>
                            <div className="border border-red-300 bg-red-50 text-red-600 text-xs p-3 rounded">
                                {error}
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="mt-4 border px-4 py-1 text-sm rounded"
                            >
                                Retry Login
                            </button>
                        </div>
                    ) : (
                        /* Default Form */
                        <>
                            {/* Email */}
                            <div className="mb-3">
                                <label className="text-sm text-gray-600">
                                    Email or Mobile Number
                                </label>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <label>Password</label>
                                    <span className="text-green-600 cursor-pointer">
                                        Forgot password?
                                    </span>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>

                            {/* Options */}
                            <div className="flex justify-between items-center text-sm mb-4">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" />
                                    Remember for 30 days
                                </label>
                                <span className="text-gray-500">Login with OTP</span>
                            </div>

                            {/* Login Button */}
                            <button
                                onClick={handleLogin}
                                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
                            >
                                Login →
                            </button>

                            {/* Divider */}
                            <div className="text-center text-xs text-gray-400 my-4">
                                OR CONTINUE WITH
                            </div>

                            {/* Social */}
                            <div className="flex gap-3">
                                <button className="flex-1 border rounded-lg py-2 text-sm">
                                    Google
                                </button>
                                <button className="flex-1 border rounded-lg py-2 text-sm">
                                    Apple
                                </button>
                            </div>

                            {/* Register */}
                            <div className="text-center text-sm mt-4">
                                Don't have an account?{" "}
                                <span
                                    onClick={() => navigate("/register")}
                                    className="text-green-600 cursor-pointer"
                                >
                                    Join Dealiva Today
                                </span>
                            </div>

                            {/* Security */}
                            <div className="mt-4 border rounded-lg p-3 text-xs text-gray-600">
                                <strong className="text-green-600">
                                    Military-Grade Security
                                </strong>
                                <p>
                                    Your credentials and payment data are secured with enterprise
                                    256-bit encryption.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* System States Showcase */}
            <div className="w-full max-w-4xl mt-12">
            </div>

            {/* Footer */}
            <div className="bg-white mt-10 border-t">
                <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-600">

                    {/* Left */}
                    <div>
                        <div className="text-green-600 font-bold text-lg mb-2">Dealiva</div>
                        <p>
                            Helping local shops & customers save smarter every day.
                            Our platform connects you with fresh groceries at unbeatable
                            prices while reducing food waste.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Platform</h3>
                        <ul className="space-y-1">
                            <li>About Us</li>
                            <li>Partner Shops</li>
                            <li>City Catalog</li>
                            <li>Careers</li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Legal & Security</h3>
                        <ul className="space-y-1">
                            <li>Terms of Service</li>
                            <li>Privacy Policy</li>
                            <li>Security Audit</li>
                            <li>Trust Line</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Strip */}
                <div className="border-t text-xs text-gray-500 px-6 py-4 flex flex-col md:flex-row justify-between items-center">
                    <span>© 2026 Dealiva. Verified secure by platform protocols</span>
                    <div className="flex gap-4 mt-2 md:mt-0">
                        <span>PCI-DSS Compliant</span>
                        <span>256-bit SSL Encryption</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
