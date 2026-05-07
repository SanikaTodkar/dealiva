import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { addToCart } from "../api/cart";
import { submitShopRating } from "../api/ratings";
import { getShopById, getShopProducts, getShopRatings } from "../api/shops";
import shopPlaceholder from "../assets/shop-placeholder.jpg";

const formatRating = (rating) => {
    const value = Number(rating);

    if (Number.isNaN(value)) {
        return "0.0";
    }

    return value.toFixed(1);
};

const ShopDetailsPage = () => {
    const { shopId } = useParams();

    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [ratingSummary, setRatingSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [addingProductId, setAddingProductId] = useState(null);
    const [ratingValue, setRatingValue] = useState(5);
    const [feedback, setFeedback] = useState("");
    const [ratingLoading, setRatingLoading] = useState(false);
    const [error, setError] = useState("");
    const [cartError, setCartError] = useState("");
    const [cartMessage, setCartMessage] = useState("");
    const [ratingError, setRatingError] = useState("");
    const [ratingMessage, setRatingMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadShopDetails = async () => {
            setLoading(true);
            setError("");

            try {
                const [shopData, productData, ratingsData] = await Promise.all([
                    getShopById(shopId),
                    getShopProducts(shopId),
                    getShopRatings(shopId),
                ]);

                if (!isMounted) return;

                setShop(shopData);
                setProducts(productData);
                setRatingSummary(ratingsData);
            } catch (err) {
                if (!isMounted) return;
                setError(err.message || "Failed to load shop details");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadShopDetails();

        return () => {
            isMounted = false;
        };
    }, [shopId]);

    const handleGrabDeal = async (product) => {
        setAddingProductId(product.id);
        setCartError("");
        setCartMessage("");

        try {
            await addToCart({ productId: product.id, quantity: 1 });
            setCartMessage(`${product.name} added to cart.`);
        } catch (err) {
            setCartError(err.message || "Failed to add item to cart");
        } finally {
            setAddingProductId(null);
        }
    };

    const handleRatingSubmit = async (event) => {
        event.preventDefault();

        setRatingLoading(true);
        setRatingError("");
        setRatingMessage("");

        try {
            await submitShopRating({
                shopId: Number(shopId),
                rating: Number(ratingValue),
                feedback,
            });

            const updatedRatings = await getShopRatings(shopId);
            setRatingSummary(updatedRatings);
            setShop((currentShop) => {
                if (!currentShop) return currentShop;

                return {
                    ...currentShop,
                    rating: updatedRatings.average_rating,
                };
            });
            setFeedback("");
            setRatingMessage("Your rating has been saved.");
        } catch (err) {
            setRatingError(err.message || "Failed to save rating");
        } finally {
            setRatingLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
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

                <nav className="hidden gap-6 text-sm text-gray-600 md:flex">
                    <Link to="/home" className="hover:text-green-600">
                        Shops
                    </Link>
                    <span>All Deals</span>
                    <Link to="/cart" className="hover:text-green-600">
                        Cart
                    </Link>
                    <Link to="/orders" className="hover:text-green-600">
                        Orders
                    </Link>
                    <Link to="/profile" className="hover:text-green-600">
                        Profile
                    </Link>
                </nav>

                <div className="text-sm text-gray-600">
                    Welcome
                </div>
            </header>

            <main>
                <section className="relative">
                    <div className="h-56 bg-gray-900">
                        <img
                            src={shopPlaceholder}
                            alt=""
                            className="h-full w-full object-cover opacity-70"
                        />
                    </div>

                    <div className="mx-auto max-w-6xl px-6">
                        <div className="-mt-12 rounded-lg bg-white p-5 shadow-lg">
                            {loading && (
                                <p className="text-sm text-gray-500">
                                    Loading shop details...
                                </p>
                            )}

                            {error && (
                                <p className="text-sm text-red-500">
                                    {error}
                                </p>
                            )}

                            {!loading && !error && shop && (
                                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <Link
                                            to="/home"
                                            className="text-sm font-medium text-green-600 hover:text-green-700"
                                        >
                                            Back to shops
                                        </Link>

                                        <h1 className="mt-3 text-3xl font-bold text-gray-900">
                                            {shop.shop_name}
                                        </h1>

                                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                                            <span>
                                                Rating {formatRating(shop.rating)}
                                            </span>
                                            {ratingSummary && (
                                                <span>
                                                    {ratingSummary.total_ratings} ratings
                                                </span>
                                            )}
                                            <span>{shop.city}</span>
                                        </div>

                                        <p className="mt-3 max-w-3xl text-sm text-gray-600">
                                            {shop.address}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-green-50 px-5 py-4 text-sm text-green-800">
                                        <p className="font-semibold">Shop Info</p>
                                        <p className="mt-1">{shop.city}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 py-10">
                    <div className="mb-6 flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                All Deals
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {loading ? "Loading products..." : `${products.length} products`}
                            </p>
                        </div>
                    </div>

                    {!loading && !error && products.length === 0 && (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                            No products available for this shop.
                        </div>
                    )}

                    {cartError && (
                        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {cartError}
                        </div>
                    )}

                    {cartMessage && (
                        <div className="mb-5 flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                            <span>{cartMessage}</span>
                            <Link to="/cart" className="font-semibold hover:text-green-800">
                                View Cart
                            </Link>
                        </div>
                    )}

                    {!loading && !error && products.length > 0 && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isAdding={addingProductId === product.id}
                                    onGrabDeal={handleGrabDeal}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="mx-auto max-w-6xl px-6 pb-12">
                    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                        <form
                            onSubmit={handleRatingSubmit}
                            className="h-fit rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
                        >
                            <h2 className="text-xl font-bold text-gray-900">
                                Rate this shop
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Share your experience with this shop.
                            </p>

                            <label className="mt-5 block text-sm font-semibold text-gray-700">
                                Rating
                            </label>
                            <select
                                value={ratingValue}
                                onChange={(event) => setRatingValue(event.target.value)}
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                            >
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Average</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Bad</option>
                            </select>

                            <label className="mt-4 block text-sm font-semibold text-gray-700">
                                Feedback
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(event) => setFeedback(event.target.value)}
                                maxLength={1000}
                                rows={4}
                                className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                placeholder="Write optional feedback"
                            />

                            {ratingError && (
                                <p className="mt-3 text-sm text-red-500">
                                    {ratingError}
                                </p>
                            )}

                            {ratingMessage && (
                                <p className="mt-3 text-sm text-green-600">
                                    {ratingMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={ratingLoading}
                                className="mt-5 w-full rounded-lg bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {ratingLoading ? "Saving..." : "Submit Rating"}
                            </button>
                        </form>

                        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Customer Ratings
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {ratingSummary
                                            ? `${formatRating(ratingSummary.average_rating)} average from ${ratingSummary.total_ratings} ratings`
                                            : "No ratings yet"}
                                    </p>
                                </div>
                            </div>

                            {!ratingSummary || ratingSummary.ratings.length === 0 ? (
                                <p className="py-6 text-sm text-gray-500">
                                    No customer ratings available.
                                </p>
                            ) : (
                                <div className="divide-y">
                                    {ratingSummary.ratings.map((rating, index) => (
                                        <div key={`${rating.user_name}-${index}`} className="py-5">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="font-semibold text-gray-900">
                                                    {rating.user_name}
                                                </p>
                                                <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                                    Rating {rating.rating}
                                                </span>
                                            </div>

                                            {rating.feedback && (
                                                <p className="mt-2 text-sm text-gray-600">
                                                    {rating.feedback}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ShopDetailsPage;
