"use client";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/routing";
import { useDispatch, useSelector } from "react-redux";
import { FiClock, FiEye, FiArrowRight, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getProductPricingDisplay } from "../utils/productPricing";
import { clearRecentlyViewed } from "../store/recentlyViewedSlice";
import { getFullImageUrl } from "../utils/cloudinary";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const formatPrice = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "TBA";
  const isWhole = Math.abs(amount % 1) < 0.001;
  return `৳${amount.toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  })}`;
};

const ProductCardImage = ({ src, alt }) => {
  const [imgSrc, setImgSrc] = useState(() => getFullImageUrl(src));
  const [hasError, setHasError] = useState(false);

  if (hasError || !imgSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt || "Product"}
      onError={() => setHasError(true)}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-106"
    />
  );
};

const RecentlyViewedShelf = ({
  title = "Recently Viewed",
  excludeProductId = "",
  limit = 6,
  className = "",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const items = useSelector((state) => state.recentlyViewed?.items || []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredItems = items
    .filter(
      (item) => String(item?._id || "") !== String(excludeProductId || ""),
    )
    .slice(0, limit);

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(clearRecentlyViewed());
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("recentlyViewedProducts");
        window.localStorage.removeItem("userPreferences");
      } catch (_err) {
        // ignore
      }
    }
    toast.success("Recently viewed history cleared!");
  };

  if (!mounted) return null;

  if (filteredItems.length === 0) {
    return (
      <section className={`w-full ${className}`}>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <FiClock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Recently Viewed Products
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Products you view while shopping will appear here.
          </p>
          <Link
            to="/shop"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            <span>Explore Products</span>
            <FiArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full ${className}`}>
      {/* Header with ONLY Title */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/90 pb-4 sm:pb-5">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-black text-white shadow-xs">
            <FiClock className="h-5 w-5" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear history button */}
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-2xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            title="Clear recently viewed history"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>

          {/* Continue shopping button */}
          <Link
            to="/shop"
            className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
          >
            <span>Continue Shopping</span>
            <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
        {filteredItems.map((item) => {
          const pricing = getProductPricingDisplay(item);
          const categoryName = item?.category?.name || item?.category || "Product";
          const discountPercent =
            pricing.hasDiscount && pricing.previousPrice > 0
              ? Math.round(
                  ((pricing.previousPrice - pricing.currentPrice) /
                    pricing.previousPrice) *
                    100,
                )
              : 0;

          return (
            <article
              key={item._id}
              onClick={() => navigate(`/product/${item._id}`)}
              className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
            >
              {/* Product Image Box - Zero padding edge-to-edge */}
              <div className="relative aspect-square w-full overflow-hidden bg-slate-100 p-0 flex items-center justify-center">
                {/* Badges on Top-Left */}
                <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
                  {discountPercent > 0 ? (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      -{discountPercent}%
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                      Viewed
                    </span>
                  )}
                </div>

                {/* Product Image */}
                <Link
                  to={`/product/${item._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-full w-full items-center justify-center p-0"
                >
                  <ProductCardImage
                    src={item?.images?.[0] || item?.image}
                    alt={item.title}
                  />
                </Link>
              </div>

              {/* Product Content Details */}
              <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5 text-left">
                <div>
                  <p className="mb-1 truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {categoryName}
                  </p>
                  <Link
                    to={`/product/${item._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 block min-h-[2.4rem]"
                  >
                    {item.title}
                  </Link>
                </div>

                {/* Price & Action */}
                <div className="mt-3 border-t border-slate-100 pt-2.5">
                  <div className="mb-2 flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      {pricing.isTba ? "TBA" : formatPrice(pricing.currentPrice)}
                    </span>
                    {pricing.hasDiscount ? (
                      <span className="text-xs font-semibold text-slate-400 line-through">
                        {formatPrice(pricing.previousPrice)}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${item._id}`);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white py-2 px-3 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <FiEye className="h-3.5 w-3.5" />
                    <span>View Product</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default RecentlyViewedShelf;
