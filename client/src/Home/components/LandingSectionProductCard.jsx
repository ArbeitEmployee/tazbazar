"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "@/lib/routing";
import {
  FiHeart,
  FiRepeat,
  FiShoppingBag,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  selectWishlistPendingIds,
  toggleWishlistItem,
} from "../../store/wishlistSlice";
import {
  COMPARE_LIMIT_MESSAGE,
  MAX_COMPARE_ITEMS,
  toggleCompareItem,
} from "../../store/compareSlice";
import { createProductSnapshot } from "../../utils/productSnapshot";
import { useCart } from "../../context/CartContext";
import { useThemeColors } from "../../hooks/useThemeColors";
import { getFullImageUrl } from "../../utils/cloudinary";
import {
  getDefaultSelectedVariants,
  getProductPricingForSelectedVariants,
  getSelectedVariantSignature,
  hasVariantOptionPricing,
  normalizeProductVariantDefinitions,
} from "../../utils/productVariants";
import { getProductLink } from "../../utils/productUrl";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const FallbackImage = ({ className, alt }) => (
  <div
    className={`${className} flex items-center justify-center bg-slate-100 text-slate-300`}
  >
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
    <span className="sr-only">{alt || "No image available"}</span>
  </div>
);

const ProductImage = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(getFullImageUrl(src, 800));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(getFullImageUrl(src, 800));
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    if (typeof src === "string" && src.startsWith("/uploads/products/")) {
      const altUrl = `${baseUrl}${src}`;
      if (altUrl !== imgSrc) {
        setImgSrc(altUrl);
        setHasError(false);
      }
    }
  };

  if (hasError || !imgSrc) {
    return <FallbackImage className={className} alt={alt} />;
  }

  return (
    <img
      src={imgSrc}
      alt={alt || "Product"}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
};

const buildDiscountLabel = (pricing) => {
  if (!pricing?.hasDiscount) return "";
  const previous = Number(pricing.previousPrice || 0);
  const current = Number(pricing.currentPrice || 0);
  if (
    !Number.isFinite(previous) ||
    !Number.isFinite(current) ||
    previous <= current ||
    previous <= 0
  ) {
    return "";
  }
  const pct = Math.round(((previous - current) / previous) * 100);
  return pct > 0 ? `${pct}%` : "";
};

const formatPrice = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return `৳${num.toLocaleString("en-BD")}`;
};

const useProductCardState = (product) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isCartItemPresent, toggleCartItem } = useCart();
  const { cartButtonColor, cartButtonHoverColor, cartButtonActiveColor } = useThemeColors();
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const wishlistPendingIds = useSelector(selectWishlistPendingIds);
  const compareItems = useSelector((state) => state.compare?.items || []);

  const variantDefinitions = useMemo(
    () => normalizeProductVariantDefinitions(product?.variants),
    [product?.variants],
  );

  const [selectedVariants, setSelectedVariants] = useState(() =>
    getDefaultSelectedVariants(variantDefinitions),
  );

  useEffect(() => {
    setSelectedVariants(getDefaultSelectedVariants(variantDefinitions));
  }, [variantDefinitions]);

  const pricing = useMemo(
    () => getProductPricingForSelectedVariants(product, selectedVariants),
    [product, selectedVariants],
  );

  const canQuickAddToCart = !hasVariantOptionPricing(variantDefinitions);
  const selectedVariantSignature = useMemo(
    () => getSelectedVariantSignature(selectedVariants),
    [selectedVariants],
  );

  const productId = String(product?._id || product?.id || "");
  const isWishlisted = useMemo(
    () =>
      wishlistItems.some(
        (item) => String(item?._id || item?.id || item?.productId) === productId,
      ),
    [wishlistItems, productId],
  );

  const wishlistLoading = wishlistPendingIds.includes(productId);
  const isCompared = useMemo(
    () =>
      compareItems.some(
        (item) => String(item?._id || item?.id || item?.productId) === productId,
      ),
    [compareItems, productId],
  );

  const isInCart = useMemo(() => {
    if (typeof isCartItemPresent === "function") {
      return isCartItemPresent(
        productId,
        "",
        "",
        "",
        selectedVariantSignature,
      );
    }
    return false;
  }, [isCartItemPresent, productId, selectedVariantSignature]);

  const toggleWishlist = (e) => {
    e.stopPropagation();
    if (!productId) return;
    dispatch(toggleWishlistItem(createProductSnapshot(product)))
      .unwrap()
      .then((res) => {
        if (res?.action === "added") {
          toast.success("Added to wishlist");
        } else {
          toast.success("Removed from wishlist");
        }
      })
      .catch((err) => {
        toast.error(err || "Failed to update wishlist");
      });
  };

  const toggleCompare = (e) => {
    e.stopPropagation();
    if (!productId) return;
    if (!isCompared && compareItems.length >= MAX_COMPARE_ITEMS) {
      toast.error(COMPARE_LIMIT_MESSAGE);
      return;
    }
    dispatch(toggleCompareItem(createProductSnapshot(product)));
    if (!isCompared) {
      toast.success("Added to compare");
    } else {
      toast.success("Removed from compare");
    }
  };

  const toggleProductCart = async (e) => {
    e.stopPropagation();
    if (!productId) return;

    if (!canQuickAddToCart) {
      navigate(getProductLink(product || { _id: productId }));
      return;
    }

    try {
      if (typeof toggleCartItem === "function") {
        await toggleCartItem(product, 1, "", "", {
          selectedVariants,
        });
      }
    } catch {
      toast.error("Failed to update cart");
    }
  };

  return {
    canQuickAddToCart,
    cartButtonActiveColor,
    cartButtonColor,
    cartButtonHoverColor,
    isInCart,
    isCompared,
    isWishlisted,
    pricing,
    toggleCompare,
    toggleProductCart,
    toggleWishlist,
    wishlistLoading,
  };
};

const LandingSectionProductCard = ({
  product,
  badgeText,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const {
    canQuickAddToCart,
    cartButtonActiveColor,
    cartButtonColor,
    cartButtonHoverColor,
    isInCart,
    isCompared,
    isWishlisted,
    pricing,
    toggleCompare,
    toggleProductCart,
    toggleWishlist,
    wishlistLoading,
  } = useProductCardState(product);

  const productId = product?._id || product?.id;
  const discountLabel = buildDiscountLabel(pricing);
  const ratingValue = Number(product?.averageRating || product?.rating || 5.0);
  const totalReviews = Number(product?.reviewCount || product?.numReviews || 1);

  // Normalize all available product image URLs for hover interaction
  const imageList = useMemo(() => {
    const list = [];
    if (Array.isArray(product?.images) && product.images.length > 0) {
      product.images.forEach((img) => {
        const u = typeof img === "string" ? img : img?.url;
        if (u) list.push(u);
      });
    }
    if (list.length === 0 && product?.image) {
      list.push(product.image);
    }
    return list.length > 0 ? list : ["https://picsum.photos/seed/product/800/800"];
  }, [product?.images, product?.image]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleCardClick = (e) => {
    // If clicked on a button or an interactive element, do not trigger card navigation
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    if (typeof onViewDetails === "function") {
      onViewDetails(product);
    } else if (productId) {
      navigate(getProductLink(product || { _id: productId }));
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
    >
      {/* Product Image Area - Tall Portrait Ratio (3:4.2) */}
      <div
        className="relative aspect-[4/3.6] w-full overflow-hidden bg-[#f4f4f5] flex items-center justify-center select-none"
        onMouseLeave={() => setActiveImageIndex(0)}
      >
        {/* Discount Badge on Top-Left (Mint Green soft pill) */}
        {discountLabel ? (
          <div className="absolute left-3 top-3 z-20 pointer-events-none">
            <span className="inline-flex items-center rounded-md bg-white/95 px-2 py-0.5 text-xs font-bold text-[#10b981] shadow-xs backdrop-blur-xs">
              {discountLabel}
            </span>
          </div>
        ) : null}

        {/* Right Floating Hover Actions (Wishlist & Compare) */}
        <div className="absolute right-3 top-3 z-30 flex flex-col items-center gap-2 opacity-0 translate-x-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0">
          {/* 1. Wishlist */}
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            title="Add to Wishlist"
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md backdrop-blur-xs transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 ${
              isWishlisted ? "text-rose-500" : "hover:text-black"
            }`}
          >
            <FiHeart
              className={`h-4.5 w-4.5 ${isWishlisted ? "fill-rose-500 text-rose-500" : "stroke-[1.8]"}`}
            />
          </button>

          {/* 2. Compare */}
          <button
            type="button"
            aria-label={isCompared ? "Remove from compare" : "Add to compare"}
            onClick={toggleCompare}
            title="Compare Product"
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md backdrop-blur-xs transition-all duration-200 hover:scale-110 active:scale-95 ${
              isCompared ? "text-blue-600" : "hover:text-black"
            }`}
          >
            <FiRepeat className="h-4.5 w-4.5 stroke-[1.8]" />
          </button>
        </div>

        {/* Product Image Link */}
        <Link
          to={getProductLink(product || { _id: productId })}
          onClick={(e) => {
            e.stopPropagation();
            if (typeof onViewDetails === "function") {
              e.preventDefault();
              onViewDetails(product);
            }
          }}
          className="flex h-full w-full items-center justify-center p-0"
        >
          <ProductImage
            src={imageList[activeImageIndex] || imageList[0]}
            alt={product?.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />
        </Link>

        {/* Minimal Bottom Progress Segment Indicator */}
        {imageList.length > 1 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex h-1 w-full gap-1 px-3">
            {imageList.map((_, idx) => (
              <div
                key={idx}
                className={`h-full flex-1 rounded-full transition-all duration-200 ${
                  activeImageIndex === idx
                    ? "bg-black/60 shadow-xs"
                    : "bg-black/15 group-hover:bg-black/25"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Content Details (Redesigned matching card structure with subtle divider & hover glow) */}
      <div className="flex flex-1 flex-col justify-between p-3.5 bg-white transition-colors duration-200 group-hover:bg-slate-50/50">
        <div>
          {/* Rating Line with Soft Golden Star Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-600 font-semibold">
              <FaStar className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{ratingValue.toFixed(1)}</span>
            </div>
            <span className="text-[12px] font-medium text-slate-500">
              ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
            </span>
          </div>

          {/* Product Title */}
          <Link
            to={getProductLink(product || { _id: productId })}
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onViewDetails === "function") {
                e.preventDefault();
                onViewDetails(product);
              }
            }}
            className="mt-1.5 block text-[14px] sm:text-[15px] font-semibold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-blue-600 line-clamp-2"
            title={product?.title}
          >
            {product?.title}
          </Link>
        </div>

        {/* Price Section with Quick Cart Action */}
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          <div className="flex flex-col">
            {pricing.hasDiscount ? (
              <span className="text-[12px] font-medium text-slate-400 line-through">
                {formatPrice(pricing.previousPrice)}
              </span>
            ) : null}
            <span className="text-[17px] font-extrabold tracking-tight text-slate-900">
              {pricing.isTba ? "TBA" : formatPrice(pricing.currentPrice)}
            </span>
          </div>

          {/* Quick-buy Pill Button */}
          <button
            type="button"
            onClick={toggleProductCart}
            onMouseEnter={(e) => {
              if (!isInCart && cartButtonHoverColor) {
                e.currentTarget.style.backgroundColor = cartButtonHoverColor;
                e.currentTarget.style.color = "#ffffff";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isInCart
                ? (cartButtonActiveColor || "#059669")
                : (cartButtonColor || "#0f172a");
              e.currentTarget.style.color = "#ffffff";
            }}
            style={{
              backgroundColor: isInCart
                ? (cartButtonActiveColor || "#059669")
                : (cartButtonColor || "#0f172a"),
              color: "#ffffff",
            }}
            title={isInCart ? "Remove from Cart" : "Quick Add"}
            className="flex h-8.5 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white shadow-2xs transition-all duration-200 active:scale-95"
          >
            <FiShoppingBag className="h-3.5 w-3.5" />
            <span>{isInCart ? "Added" : "Add"}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default LandingSectionProductCard;
