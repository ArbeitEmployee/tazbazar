import React from "react";
import { Link } from "@/lib/routing";
import { useSelector } from "react-redux";
import { FiClock, FiEye, FiArrowRight } from "react-icons/fi";
import { getProductPricingDisplay } from "../utils/productPricing";

const formatPrice = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "TBA";
  const isWhole = Math.abs(amount % 1) < 0.001;
  return `৳${amount.toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  })}`;
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getFullImageUrl = (imagePath) => {
  const value = Array.isArray(imagePath) ? imagePath[0] : imagePath;
  if (!value) return null;

  if (
    String(value).startsWith("http://") ||
    String(value).startsWith("https://") ||
    String(value).startsWith("data:")
  ) {
    return value;
  }

  if (String(value).startsWith("/")) {
    return baseUrl ? `${baseUrl}${value}` : value;
  }

  return baseUrl
    ? `${baseUrl}/uploads/products/${value}`
    : `/uploads/products/${value}`;
};

const RecentlyViewedShelf = ({
  title = "Recently Viewed",
  subtitle = "Jump back into the items you checked out recently.",
  excludeProductId = "",
  limit = 6,
  className = "",
}) => {
  const items = useSelector((state) => state.recentlyViewed.items || []);
  const filteredItems = items
    .filter(
      (item) => String(item?._id || "") !== String(excludeProductId || ""),
    )
    .slice(0, limit);

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <section className={`w-full overflow-hidden ${className}`}>
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-2xs">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 border border-blue-100">
              <FiClock className="h-3.5 w-3.5" />
              Shopper Memory
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              {subtitle}
            </p>
          </div>
          <Link
            to="/shop"
            className="group inline-flex flex-none items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition-all duration-200 hover:border-blue-600 hover:bg-blue-50/40 hover:text-blue-600 hover:shadow-xs"
          >
            <span>Continue Shopping</span>
            <FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
          {filteredItems.map((item) => {
            const image = getFullImageUrl(item?.images?.[0] || item?.image);
            const pricing = getProductPricingDisplay(item);
            return (
              <Link
                key={item._id}
                to={`/product/${item._id}`}
                className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10"
              >
                {/* Image Container */}
                <div className="relative mb-2.5 aspect-square w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100/80 p-2">
                  {image ? (
                    <img
                      src={image}
                      alt={item.title}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-108"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Body Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="mb-0.5 truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {item?.category?.name || "Product"}
                    </p>
                    <h3 className="line-clamp-1 text-xs sm:text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs sm:text-sm font-black text-blue-600">
                      {pricing.isTba ? "TBA" : formatPrice(pricing.currentPrice)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-1.5 text-[11px] sm:text-xs font-bold text-white transition-colors duration-200 group-hover:bg-blue-600">
                    <FiEye className="h-3.5 w-3.5" />
                    View Details
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedShelf;
