import React, { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiEye, FiHeart, FiShoppingBag, FiShuffle, FiStar } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "@/lib/routing";
import { getFullImageUrl } from "../../utils/cloudinary";
import {
  getPublicStockBadgeText,
  isPublicStockVisible,
} from "../../utils/publicProduct";
import { selectPublicSettings } from "../../store/publicSettingsSlice";
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
import {
  getDefaultSelectedVariants,
  getProductPricingForSelectedVariants,
  getSelectedVariantSignature,
  hasVariantOptionPricing,
  normalizeProductVariantDefinitions,
  normalizeSelectedVariantsPayload,
} from "../../utils/productVariants";
import { getProductLink } from "../../utils/productUrl";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const FallbackImage = ({ className, alt }) => (
  <div
    className={`${className} flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100`}
  >
    <svg
      className="h-8 w-8 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
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
    previous <= 0
  ) {
    return "";
  }

  const percent = Math.round(((previous - current) / previous) * 100);
  return percent > 0 ? `-${percent}%` : "";
};

const getCardMetaLine = (product, metaLine) => {
  if (metaLine !== undefined) return metaLine;
  return product?.dimensions ? `Dim: ${product.dimensions}` : "";
};

const getCategoryLabel = (product, badgeText = "") => {
  if (typeof product?.category === "object" && product?.category?.name) {
    return String(product.category.name).trim();
  }

  if (
    typeof product?.category === "string" &&
    String(product.category).trim()
  ) {
    return String(product.category).trim();
  }

  if (String(product?.productType || "").trim()) {
    return String(product.productType).trim();
  }

  if (String(badgeText || "").trim()) {
    return String(badgeText).trim();
  }

  return "General";
};

const getCompareButtonClassName = (isCompared) =>
  `inline-flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition sm:h-9 sm:w-9 ${
    isCompared
      ? "border-black bg-black text-white"
      : "border-gray-200 bg-white text-gray-700 hover:border-black hover:text-black"
  }`;

const getCartButtonClassName = (isInCart) =>
  `inline-flex h-10 w-10 items-center justify-center rounded-[14px] border transition sm:h-[42px] sm:w-[42px] ${
    isInCart
      ? "border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700"
      : "border-gray-200 bg-white text-black hover:border-black hover:bg-gray-50"
  }`;

const StorefrontProductCard = ({
  product,
  title,
  badgeText = "",
  badgeClassName = "",
  topRightSlot = null,
  metaLine,
  buttonLabel = "View details",
  className = "",
  onViewDetails,
  showCompareButton = true,
  showWishlistButton = true,
  showCartButton = true,
  onCartActionComplete,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isCartItemPresent, toggleCartItem } = useCart();
  const { cartButtonColor, cartButtonHoverColor, cartButtonActiveColor } = useThemeColors();
  const settings = useSelector(selectPublicSettings);
  const compareItems = useSelector((state) => state.compare.items || []);
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const wishlistPendingIds = useSelector(selectWishlistPendingIds);
  const productId = String(product?._id || product?.id || "").trim();
  const variantDefinitions = useMemo(
    () => normalizeProductVariantDefinitions(product),
    [product],
  );
  const [selectedVariants, setSelectedVariants] = useState(() =>
    getDefaultSelectedVariants(product),
  );
  const resolvedSelectedVariants = useMemo(
    () => normalizeSelectedVariantsPayload(selectedVariants),
    [selectedVariants],
  );
  const selectedVariantSignature = useMemo(
    () => getSelectedVariantSignature(resolvedSelectedVariants),
    [resolvedSelectedVariants],
  );
  const pricing = useMemo(
    () =>
      getProductPricingForSelectedVariants(product, resolvedSelectedVariants),
    [product, resolvedSelectedVariants],
  );
  const displayMetaLine = getCardMetaLine(product, metaLine);
  const discountLabel = buildDiscountLabel(pricing);
  const categoryLabel = getCategoryLabel(product, badgeText);
  const sectionBadgeLabel =
    String(badgeText || "").trim() &&
    String(badgeText || "")
      .trim()
      .toLowerCase() !== categoryLabel.toLowerCase()
      ? String(badgeText).trim()
      : "";
  const stockBadgeText = useMemo(
    () => getPublicStockBadgeText(product, null, settings),
    [product, settings],
  );
  const showStockBadge =
    Boolean(stockBadgeText) && isPublicStockVisible(product, settings);
  const showCardCartButton =
    showCartButton && !hasVariantOptionPricing(product);
  const isCompared = compareItems.some(
    (item) => String(item?._id || "") === productId,
  );
  const isWishlisted = wishlistItems.some(
    (item) => String(item?._id || "") === productId,
  );
  const wishlistLoading = wishlistPendingIds.includes(productId);
  const isInCart = isCartItemPresent(
    productId,
    "",
    "",
    "",
    selectedVariantSignature,
  );

  useEffect(() => {
    setSelectedVariants((currentSelections) => {
      const currentByName = new Map(
        normalizeSelectedVariantsPayload(currentSelections).map((variant) => [
          String(variant?.name || "").toLowerCase(),
          variant,
        ]),
      );

      return variantDefinitions
        .map((definition) => {
          const existing = currentByName.get(definition.name.toLowerCase());
          const matchingOption = (definition.options || []).find((option) => {
            if (!existing) return false;

            if (
              definition.preset === "color" &&
              String(option.colorHex || "").toLowerCase() ===
                String(existing.colorHex || "").toLowerCase()
            ) {
              return true;
            }

            return (
              String(option.value || "").toLowerCase() ===
              String(existing.value || "").toLowerCase()
            );
          });

          if (!matchingOption) return null;

          return {
            name: definition.name,
            preset: definition.preset,
            label: matchingOption.label || matchingOption.value,
            value: matchingOption.value || matchingOption.label,
            colorHex:
              definition.preset === "color"
                ? String(
                    matchingOption.colorHex || matchingOption.value || "",
                  ).toLowerCase()
                : "",
            priceMode: matchingOption.priceMode || "default",
            price: matchingOption.price,
            comparePrice: matchingOption.comparePrice,
          };
        })
        .filter(Boolean);
    });
  }, [productId, variantDefinitions]);

  const handleViewDetails = (e) => {
    if (e && e.target) {
      // If clicked on an interactive control (button, SVG icon inside button, etc.), don't navigate
      if (e.target.closest("button") || e.target.closest("a")) {
        return;
      }
    }
    if (typeof onViewDetails === "function") {
      onViewDetails(product);
      return;
    }
    const targetLink = getProductLink(product || { _id: productId });
    if (targetLink && targetLink !== "/") {
      navigate(targetLink);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleViewDetails();
    }
  };

  const handleToggleCompare = (event) => {
    event.stopPropagation();
    const snapshot = createProductSnapshot(product);
    if (!snapshot) return;
    if (!isCompared && compareItems.length >= MAX_COMPARE_ITEMS) {
      toast.error(COMPARE_LIMIT_MESSAGE);
      return;
    }
    dispatch(toggleCompareItem(snapshot));
  };

  const handleToggleWishlist = async (event) => {
    event.stopPropagation();
    if (wishlistLoading) return;
    try {
      await dispatch(toggleWishlistItem(product)).unwrap();
      toast.success(
        isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      );
    } catch (error) {
      toast.error(error || "Failed to update wishlist");
    }
  };

  const handleAddToCart = async (event) => {
    event.stopPropagation();

    const marketplaceType = String(product?.marketplaceType || "simple")
      .trim()
      .toLowerCase();
    if (marketplaceType === "grouped") {
      toast("Choose grouped items on the product details page first.");
      navigate(getProductLink(product || { _id: productId }));
      return;
    }

    const result = await toggleCartItem(product, 1, "", "", {
      selectedVariants: resolvedSelectedVariants,
    });

    if (typeof onCartActionComplete === "function") {
      await onCartActionComplete(result, product);
    }
  };

  const ratingValue = Number(product?.averageRating || product?.rating || 4.9);
  const totalReviews = Number(product?.reviewCount || product?.numReviews || 0);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleViewDetails}
      onKeyDown={handleKeyDown}
      className={`group relative flex h-full w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${className}`}
    >
      {/* Product Image Box - Zero padding edge-to-edge */}
      <div className="relative aspect-[4/3.6] w-full overflow-hidden bg-slate-100 p-0 flex items-center justify-center">
        {/* Badges on Top-Left */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
          {discountLabel ? (
            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              {discountLabel}
            </span>
          ) : sectionBadgeLabel ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-xs ${
                badgeClassName || "bg-slate-900/90 text-white backdrop-blur-xs"
              }`}
            >
              {sectionBadgeLabel}
            </span>
          ) : null}
        </div>

        {/* Top-Right Floating Actions */}
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col items-end gap-1.5">
          {showWishlistButton ? (
            <button
              type="button"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-500 shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50 ${
                isWishlisted ? "border-rose-200 bg-rose-50 text-rose-600" : ""
              }`}
            >
              <FiHeart
                className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
              />
            </button>
          ) : null}

          {showCompareButton ? (
            <button
              type="button"
              aria-label={isCompared ? "Remove from compare" : "Add to compare"}
              title={isCompared ? "Remove from compare" : "Add to compare"}
              onClick={handleToggleCompare}
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-500 shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-95 sm:opacity-0 group-hover:opacity-100 ${
                isCompared ? "border-blue-200 bg-blue-50 text-blue-600 sm:opacity-100" : ""
              }`}
            >
              <FiShuffle className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {topRightSlot}
        </div>

        {/* Product Image Link */}
        <Link
          to={getProductLink(product || { _id: productId })}
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full items-center justify-center p-0"
        >
          <ProductImage
            src={product?.images?.[0] || product?.image}
            alt={product?.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-106"
          />
        </Link>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5 text-left">
        <div>
          {/* Category & Rating */}
          <div className="mb-1 flex items-center justify-between gap-1.5 text-xs">
            <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {categoryLabel}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <FiStar className="h-3 w-3 fill-amber-400 text-amber-500" />
              <span>{ratingValue.toFixed(1)}</span>
              {totalReviews > 0 ? (
                <span className="text-[10px] font-normal text-slate-400">({totalReviews})</span>
              ) : null}
            </div>
          </div>

          {/* Product Title */}
          <Link
            to={getProductLink(product || { _id: productId })}
            onClick={(e) => e.stopPropagation()}
            title={String(product?.title || "").trim()}
            className="line-clamp-2 min-h-[2.4rem] block text-xs font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 sm:text-sm"
          >
            {title || product?.title}
          </Link>

          {/* Meta line or stock if present */}
          {displayMetaLine || showStockBadge ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
              {displayMetaLine ? (
                <span className="text-slate-400">{displayMetaLine}</span>
              ) : null}
              {showStockBadge ? (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {stockBadgeText}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="mt-3 border-t border-slate-100 pt-2.5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-slate-900 sm:text-base">
                {pricing.isTba
                  ? "TBA"
                  : `৳${Number(pricing.currentPrice || 0).toLocaleString("en-US", {
                      minimumFractionDigits: Math.abs(Number(pricing.currentPrice || 0) % 1) < 0.001 ? 0 : 2,
                      maximumFractionDigits: Math.abs(Number(pricing.currentPrice || 0) % 1) < 0.001 ? 0 : 2,
                    })}`}
              </span>
              {pricing.hasDiscount ? (
                <span className="text-xs font-semibold text-slate-400 line-through">
                  ৳{Number(pricing.previousPrice || 0).toLocaleString("en-US", {
                    minimumFractionDigits: Math.abs(Number(pricing.previousPrice || 0) % 1) < 0.001 ? 0 : 2,
                    maximumFractionDigits: Math.abs(Number(pricing.previousPrice || 0) % 1) < 0.001 ? 0 : 2,
                  })}
                </span>
              ) : null}
            </div>
          </div>

          {/* Action Button */}
          {showCardCartButton ? (
            <button
              type="button"
              onClick={handleAddToCart}
              onMouseEnter={(e) => {
                if (!isInCart && cartButtonHoverColor) {
                  e.currentTarget.style.backgroundColor = cartButtonHoverColor;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isInCart
                  ? (cartButtonActiveColor || "#059669")
                  : (cartButtonColor || "#0f172a");
              }}
              style={{
                backgroundColor: isInCart
                  ? (cartButtonActiveColor || "#059669")
                  : (cartButtonColor || "#0f172a"),
                color: "#ffffff",
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-2xs transition-all duration-200 active:scale-98"
            >
              <FiShoppingBag className="h-3.5 w-3.5" />
              <span>{isInCart ? "In Cart" : "Add to Cart"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 active:scale-98"
            >
              <FiEye className="h-3.5 w-3.5" />
              <span>{buttonLabel}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default StorefrontProductCard;
