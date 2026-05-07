import { Link } from "react-router-dom";
import shopPlaceholder from "../assets/shop-placeholder.jpg";

const formatRating = (rating) => {
    const value = Number(rating);

    if (Number.isNaN(value)) {
        return "0.0";
    }

    return value.toFixed(1);
};

const ShopCard = ({ shop }) => {
    return (
        <Link
            to={`/shops/${shop.id}`}
            className="block overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            <img
                src={shopPlaceholder}
                alt={shop.shop_name}
                className="h-40 w-full object-cover"
            />

            <div className="p-4">
                <h3 className="text-base font-semibold text-gray-900">
                    {shop.shop_name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    {shop.city}
                </p>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                        Rating {formatRating(shop.rating)}
                    </span>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        View Shop
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ShopCard;
