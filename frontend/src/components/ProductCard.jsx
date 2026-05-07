import shopPlaceholder from "../assets/shop-placeholder.jpg";

const formatCurrency = (value) => {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return "₹0";
    }

    return `₹${amount.toFixed(0)}`;
};

const ProductCard = ({ product, onGrabDeal, isAdding = false }) => {
    const hasDiscount = Number(product.discount_percent) > 0;

    return (
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="relative h-44 bg-gray-100">
                <img
                    src={product.image_url || shopPlaceholder}
                    alt={product.name}
                    className="h-full w-full object-cover"
                />

                {hasDiscount && (
                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                        {product.discount_percent}% OFF
                    </span>
                )}
            </div>

            <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                    {product.name}
                </h3>

                {product.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {product.description}
                    </p>
                )}

                <p className="mt-2 text-xs text-gray-500">
                    Stock: {product.stock}
                </p>

                <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                        {hasDiscount && (
                            <p className="text-xs text-gray-400 line-through">
                                {formatCurrency(product.price)}
                            </p>
                        )}
                        <p className="text-xl font-bold text-green-600">
                            {formatCurrency(product.final_price)}
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={isAdding}
                        onClick={() => onGrabDeal?.(product)}
                        className="rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-600"
                    >
                        {isAdding ? "Adding..." : "Grab Deal"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
