import { useState } from "react";
import { registerUser, loginUser } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MAHARASHTRA_CITIES } from "../utils/cities";

const RegisterPage = () => {
    const [searchParams] = useSearchParams();
    const initialRole = searchParams.get("role") === "shop_owner" ? "shop_owner" : "customer";
    const [role, setRole] = useState(initialRole);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const[acceptedTerms, setAcceptedTerms] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async () => {
        setError("");

        // Frontend Validation
        if (!name || !email || !password || !mobile || !address || !city) {
            setError("Please fill all required fields");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError("Enter a valid email address");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at leat 6 characters");
            return;
        }

        if (!/^\d{10}$/.test(mobile)) {
            setError("Mobile number must be 10 digits");
            return;
        }

        if (!acceptedTerms) {
            setError("You must accept Terms & Privacy Policy");
            return;
        }

        setLoading(true);

        try {
            // 1. Register
            await registerUser({
                name,
                email,
                password,
                mobile,
                address,
                city,
                role,
            });

            // 2. auto login
            const data = await loginUser({ email, password,});

            // 3. save auth
            login(data.access_token, data.role);

            // 4. reset form
            setName("");
            setEmail("");
            setPassword("");
            setMobile("");
            setAddress("");
            setCity("");
            setRole("customer");
            setAcceptedTerms(false);

            // 5. redirect
            if (data.role === "customer") navigate("/home");
            else if (data.role === "shop_owner") navigate("/dashboard");
            else if (data.role === "admin") navigate("/admin/dashboard");

        } catch (err) {
            if (err.message === "SESSION_EXPIRED") {
                setError("Session expired. Please login again..");
            } else {
                setError(err.message || "Registeration failed. Try again!")
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center px-8 py-4">
                <div className="text-xl font-bold text-green-600">Dealiva</div>

                <div className="flex gap-6 text-sm text-gray-600">
                    <span>How it works</span>
                    <span>Near Me</span>
                    <span>Deals</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">Already have an account?</span>
                    <button
                        onClick={() => navigate("/login")}
                        className="border border-green-600 text-green-600 px-4 py-1 rounded-full"
                    >
                        Sign In
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="flex flex-1 justify-center items-center px-4">

                <div className="bg-white shadow-lg rounded-2xl w-full max-w-2xl p-8">

                    {/* Top Section */}
                    <div className="text-center mb-6">
                        <div className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full inline-block mb-2">
                            Join the Grocery Revolution
                        </div>
                        <h1 className="text-3xl font-bold">Create Account</h1>
                        <p className="text-gray-500 text-sm">
                            Save smarter on everyday groceries with local shops.
                        </p>
                    </div>

                    {/* Role Toggle */}
                    <div className="flex bg-gray-100 rounded-lg mb-6">
                        {["customer", "shop_owner"].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                                    role === r
                                        ? "bg-green-600 text-white"
                                        : "text-gray-500"
                                }`}
                            >
                                {r === "customer" ? "Customer" : "Shop Owner"}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <div className="space-y-4">

                        {/* Full Name */}
                        <div>
                            <label className="text-sm text-gray-600">Full Name</label>
                            <input
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                type="text"
                                placeholder="John Doe"
                                className="w-full mt-1 px-3 py-2 border rounded-lg"
                            />
                        </div>

                        {/* Email + Mobile */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-600">Email Address</label>
                                <input
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="john@example.com"
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-600">Mobile Number</label>
                                <input
                                    name="mobile"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    type="text"
                                    placeholder="9876543211"
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="text-sm text-gray-600">Delivery Address</label>
                            <input
                                name="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                type="text"
                                placeholder="Flat No, Building, Area"
                                className="w-full mt-1 px-3 py-2 border rounded-lg"
                            />
                        </div>

                        {/* City + Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-600">City</label>

                                <select
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
                                >
                                    <option value="">Select City</option>

                                    {MAHARASHTRA_CITIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c.charAt(0).toUpperCase() + c.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-gray-600">Password</label>
                                <input
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    placeholder="******"
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <input type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)} />
                            <span>
                                I agree to Dealiva's{" "}
                                <span className="text-green-600">Terms of Service</span> and{" "}
                                <span className="text-green-600">Privacy Policy</span>.
                            </span>
                        </div>

                        {/* Button */}
                        <button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {loading ? "Creating Account..." : "Create My Account →"}
                        </button>

                        {/* Security */}
                        <div className="text-center text-xs text-gray-500">
                            Your data is protected with bank-grade security
                        </div>

                        {/* Login Link */}
                        <div className="text-center text-sm mt-2">
                            Already have an account?{" "}
                            <span
                                onClick={() => navigate("/login")}
                                className="text-green-600 cursor-pointer"
                            >
                                Log in here
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Indicators */}
            <div className="text-center text-xs text-gray-500 pb-6">
                Secure Payments • Verified Shops • Local Pune Focus
            </div>

            {/* Footer */}
            <div className="bg-white border-t mt-4 px-8 py-6">
                <div className="grid grid-cols-3 gap-6 text-sm text-gray-600">
                    <div>
                        <div className="font-bold text-green-600 mb-2">Dealiva</div>
                        <p>
                            Helping local shops & customers save smarter every day.
                        </p>
                    </div>

                    <div>
                        <div className="font-semibold mb-2">Platform</div>
                        <p>About Us</p>
                        <p>How it Works</p>
                        <p>Verified Shops</p>
                    </div>

                    <div>
                        <div className="font-semibold mb-2">Support</div>
                        <p>Help Center</p>
                        <p>Trust Line</p>
                        <p>Privacy Policy</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
