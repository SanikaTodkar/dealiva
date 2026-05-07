import { Link } from "react-router-dom";
import shopPlaceholder from "../assets/shop-placeholder.jpg";

const HERO_IMAGE = "/landing-hero.jpg";
const REGISTER_SHOP_IMAGE = "/register-shop.jpg";

const trustItems = [
    { label: "Secure Payments", value: "Online payment support" },
    { label: "Approved Shops", value: "Shop approval workflow" },
    { label: "Order Tracking", value: "Status updates after order" },
    { label: "Shop Dashboard", value: "Owner product management" },
];

const steps = [
    {
        title: "Browse Shops",
        copy: "Customers can view approved shops and available products after login.",
    },
    {
        title: "Place Order",
        copy: "No minimum order, free local delivery, fresh guaranteed.",
    },
    {
        title: "Track Status",
        copy: "Order status is shown from the order workflow.",
    },
];

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.jpg" alt="Dealiva" className="h-8 w-8 object-contain" />
                        <span className="text-lg font-bold text-green-600">Dealiva</span>
                    </Link>

                    <nav className="flex items-center gap-2 text-sm font-medium">
                        <Link to="/register?role=shop_owner" className="hidden text-slate-700 hover:text-green-600 sm:inline">
                            Sell on Dealiva
                        </Link>
                        <Link to="/login" className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 hover:border-green-300 hover:text-green-600">
                            Login
                        </Link>
                        <Link to="/register" className="rounded-full bg-green-600 px-4 py-2 text-white shadow-sm hover:bg-green-700">
                            Get Started
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                <section
                    className="relative isolate overflow-hidden bg-emerald-950"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 91, 42, 0.82), rgba(0, 91, 42, 0.82)), url(${HERO_IMAGE})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                    }}
                >
                    <div className="mx-auto flex min-h-[560px] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center text-white sm:px-6 lg:min-h-[620px]">
                        <div className="mb-4 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-100">
                            Local grocery ordering system
                        </div>
                        <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
                            Dealiva Grocery Ordering
                        </h1>
                        <p className="mt-4 max-w-2xl text-base font-semibold text-green-50 sm:text-lg">
                            Browse approved local shops, add available products to cart, place orders, and track order status from one simple system.
                        </p>

                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <Link to="/login" className="flex min-h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-green-700 hover:bg-green-50">
                                Login
                            </Link>
                            <Link to="/register" className="flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-8 text-sm font-bold text-white hover:bg-green-700">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="border-b border-slate-100 bg-white">
                    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:py-12">
                        {trustItems.map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 font-bold text-green-600">
                                    {item.label.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">{item.label}</div>
                                    <div className="text-xs text-slate-500">{item.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                    <div className="grid overflow-hidden rounded-2xl bg-sky-400 shadow-xl md:grid-cols-2">
                        <div className="flex flex-col justify-center p-8 text-white sm:p-12">
                            <h2 className="text-3xl font-black leading-tight">Own a shop?</h2>
                            <p className="mt-4 max-w-md text-sm font-medium text-sky-50">
                                Create a shop-owner account, register your shop, verify it with OTP, and manage products after approval.
                            </p>
                            <Link to="/register?role=shop_owner" className="mt-6 flex min-h-11 w-fit items-center rounded-lg bg-white px-6 text-sm font-bold text-sky-600 hover:bg-sky-50">
                                Register Your Shop
                            </Link>
                        </div>
                        <div className="min-h-72 p-8">
                            <img
                                src={REGISTER_SHOP_IMAGE}
                                alt="Grocery shop display"
                                className="h-full min-h-56 w-full rounded-xl object-cover shadow-lg"
                                onError={(event) => {
                                    event.currentTarget.src = shopPlaceholder;
                                }}
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-slate-50 py-16">
                    <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
                        <h2 className="text-3xl font-black text-slate-900">Basic Working Flow</h2>
                        <div className="mt-12 grid gap-8 md:grid-cols-3">
                            {steps.map((step, index) => (
                                <div key={step.title}>
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-xl font-black text-green-600">
                                        {index + 1}
                                    </div>
                                    <h3 className="mt-5 font-black text-slate-900">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-500">{step.copy}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-100 bg-slate-50">
                <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-slate-500 sm:px-6 md:grid-cols-4">
                    <div>
                        <div className="mb-3 flex items-center gap-2 font-bold text-green-600">
                            <img src="/logo.jpg" alt="Dealiva" className="h-7 w-7 object-contain" />
                            Dealiva
                        </div>
                        <p>A grocery ordering frontend connected to the project backend APIs.</p>
                    </div>
                    <div>
                        <h3 className="mb-3 font-bold text-slate-800">Customer</h3>
                        <p>Browse shops</p>
                        <p>Manage cart</p>
                        <p>Track orders</p>
                    </div>
                    <div>
                        <h3 className="mb-3 font-bold text-slate-800">Shop Owner</h3>
                        <p>Register shop</p>
                        <p>Verify OTP</p>
                        <p>Manage products</p>
                    </div>
                    <div>
                        <h3 className="mb-3 font-bold text-slate-800">System</h3>
                        <p>Role-based access</p>
                        <p>Protected routes</p>
                        <p>Backend data only</p>
                    </div>
                </div>
                <div className="border-t border-slate-200 px-4 py-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:justify-between">
                        <span>© 2026 Dealiva</span>
                        <span>Academic project frontend</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
