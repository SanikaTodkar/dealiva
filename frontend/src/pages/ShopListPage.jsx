import { useEffect, useState } from "react";
import { getShops } from "../api/shops";
import { MAHARASHTRA_CITIES } from "../utils/cities";
import ShopCard from "../components/ShopCard";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

const LIMIT = 6;

const ShopListPage = () => {
    const [shops, setShops] = useState([]);
    const [city, setCity] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadShops = async () => {
            setLoading(true);
            setError("");

            try {
                const data = await getShops({
                    city,
                    limit: LIMIT,
                    offset: (page - 1) * LIMIT,
                });

                if (isMounted) setShops(data);
            } catch (err) {
                if (isMounted) setError(err.message || "Failed to load shops");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadShops();

        return () => {
            isMounted = false;
        };
    }, [city, page]);

    return (
        <AuthenticatedLayout role="customer">
            <div className="px-8 py-4 bg-white border-b flex justify-between items-center">

                <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-gray-700">
                        SHOPS {city && `IN ${city.toUpperCase()}`}
                    </h2>

                    <span className="text-sm text-gray-500">
                        Showing {shops.length} results
                    </span>
                </div>

                {/* City Filter */}
                <select
                    value={city}
                    onChange={(e) => {
                        setCity(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 border rounded-lg text-sm"
                >
                    <option value="">All Cities</option>
                    {MAHARASHTRA_CITIES.map((c) => (
                        <option key={c} value={c}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <main className="mx-auto w-full max-w-6xl px-6 py-8">
                <div>
                    {loading && (
                        <div className="rounded-lg bg-white p-6 text-sm text-gray-500 shadow-sm">
                            Loading shops...
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {!loading && !error && shops.length === 0 && (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                            No approved shops found.
                        </div>
                    )}

                    {!loading && !error && shops.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {shops.map((shop) => (
                            <ShopCard key={shop.id} shop={shop} />
                        ))}
                    </div>
                    )}

                    {!loading && !error && (
                    <div className="mt-10 flex justify-center gap-4">

                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-4 py-2 border rounded disabled:opacity-50"
                        >
                            Previous
                        </button>

                        <span className="px-4 py-2 text-sm">
                            Page {page}
                        </span>

                        <button
                            disabled={shops.length < LIMIT}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-4 py-2 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    )}
                </div>
            </main>
        </AuthenticatedLayout>
    );
};

export default ShopListPage;
