import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
    isActive
        ? "font-semibold text-green-600"
        : "text-gray-600 hover:text-green-600";

const roleNav = {
    customer: [
        { to: "/home", label: "Shops" },
        { to: "/cart", label: "Cart" },
        { to: "/orders", label: "Orders" },
        { to: "/profile", label: "Profile" },
    ],
    shop_owner: [
        { to: "/dashboard", label: "Dashboard" },
    ],
    admin: [
        { to: "/admin/dashboard", label: "Admin" },
    ],
};

const AuthenticatedLayout = ({ role = "customer", children, rightContent }) => {
    const links = roleNav[role] || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
                    <Link to={role === "customer" ? "/home" : "/dashboard"} className="flex items-center gap-2">
                        <img src="/logo.jpg" alt="Dealiva" className="h-8 w-8 object-contain" />
                        <span className="text-xl font-bold text-green-600">Dealiva</span>
                    </Link>

                    <nav className="flex items-center gap-6 text-sm">
                        {links.map((link) => (
                            <NavLink key={link.to} to={link.to} className={navLinkClass}>
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="hidden text-sm text-gray-600 sm:block">
                        {rightContent || "Welcome"}
                    </div>
                </div>
            </header>

            {children}
        </div>
    );
};

export default AuthenticatedLayout;
