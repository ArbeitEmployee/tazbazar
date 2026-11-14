import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "@/lib/routing";
import {
  FiEye,
  FiHeart,
  FiShoppingBag,
  FiShuffle,
  FiStar,
} from "react-icons/fi";
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
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";
import {
  getDefaultSelectedVariants,
  getProductPricingForSelectedVariants,
  getSelectedVariantSignature,
  hasVariantOptionPricing,
  normalizeProductVariantDefinitions,
  normalizeSelectedVariantsPayload,
} from "../../utils/productVariants";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return optimizeCloudinaryUrl(imagePath, 800);
  }

  if (imagePath.startsWith("/")) {
    return baseUrl ? `${baseUrl}${imagePath}` : imagePath;
  }

  return baseUrl
    ? `${baseUrl}/uploads/products/${imagePath}`
    : `/uploads/products/${imagePath}`;
};

const FallbackImage = ({ className, alt }) => (
  <div
    className={`${className} flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200`}
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
  const [imgSrc, setImgSrc] = useState(getFullImageUrl(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(getFullImageUrl(src));
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    if (src && src.startsWith("/uploads/products/")) {
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
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
      crossOrigin={
        imgSrc?.startsWith("http://") || imgSrc?.startsWith("https://")
          ? "anonymous"
          : undefined
      }
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

const formatPrice = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "TBA";
  const isWhole = Math.abs(amount % 1) < 0.001;
  return `Tk${amount.toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  })}`;
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

const getSectionBadgeLabel = (categoryLabel, badgeText) => {
  const normalizedBadge = String(badgeText || "").trim();
  if (!normalizedBadge) return "";
  if (normalizedBadge.toLowerCase() === categoryLabel.toLowerCase()) return "";
  return normalizedBadge;
};

const useProductCardState = (product) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isCartItemPresent, toggleCartItem } = useCart();
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
  const canQuickAddToCart = useMemo(
    () => !hasVariantOptionPricing(product),
    [product],
  );

  const isCompared = compareItems.some(
    (item) => String(item?._id || item?.id || "") === productId,
  );
  const isWishlisted = wishlistItems.some(
    (item) => String(item?._id || item?.id || "") === productId,
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

  const toggleCompare = (event) => {
    event.stopPropagation();
    const snapshot = createProductSnapshot(product);
    if (!snapshot) return;
    if (!isCompared && compareItems.length >= MAX_COMPARE_ITEMS) {
      toast.error(COMPARE_LIMIT_MESSAGE);
      return;
    }
    dispatch(toggleCompareItem(snapshot));
  };

  const toggleWishlist = async (event) => {
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

  const toggleProductCart = async (event) => {
    event.stopPropagation();

    const marketplaceType = String(product?.marketplaceType || "simple")
      .trim()
      .toLowerCase();
    if (marketplaceType === "grouped") {
      toast("Choose grouped items on the product details page first.");
      navigate(`/product/${productId || product?._id || product?.id}`);
      return;
    }

    await toggleCartItem(product, 1, "", "", {
      selectedVariants: resolvedSelectedVariants,
    });
  };

  return {
    canQuickAddToCart,
    pricing,
    isCompared,
    isInCart,
    isWishlisted,
    wishlistLoading,
    toggleProductCart,
    toggleCompare,
    toggleWishlist,
  };
};

const IconButton = ({
  label,
  onClick,
  children,
  className = "",
  disabled = false,
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    className={className}
  >
    {children}
  </button>
);

const getWishlistIconButtonClassName = (isWishlisted, extraClassName = "") =>
  `${extraClassName} ${
    isWishlisted
      ? "border-white bg-white text-red-600 shadow-sm"
      : "border-white bg-white text-black shadow-sm hover:text-red-500"
  }`;

const getCompareIconButtonClassName = (
  isCompared,
  tone = "light",
  extraClassName = "",
) => {
  const baseClassName = `${extraClassName} inline-flex items-center justify-center rounded-full border transition`;

  if (tone === "dark") {
    return `${baseClassName} ${
      isCompared
        ? "border-white bg-white text-[#1B1C18] shadow-sm"
        : "border-white/14 bg-white/6 text-white/45 shadow-sm hover:border-white/28 hover:bg-white/10 hover:text-white"
    }`;
  }

  if (tone === "overlay") {
    return `${baseClassName} ${
      isCompared
        ? "border-black bg-black text-white shadow-sm"
        : "border-white bg-white/95 text-[#535A63] shadow-sm hover:border-black hover:text-[#1B1C18]"
    }`;
  }

  return `${baseClassName} ${
    isCompared
      ? "border-black bg-black text-white shadow-sm"
      : "border-[#E7E0D4] bg-white text-[#5A564C] shadow-sm hover:border-black hover:text-[#1B1C18]"
  }`;
};

const getCartIconButtonClassName = (
  isInCart,
  tone = "light",
  extraClassName = "",
) => {
  const baseClassName = `${extraClassName} inline-flex items-center justify-center rounded-full border transition`;

  if (tone === "dark") {
    return `${baseClassName} ${
      isInCart
        ? "border-emerald-400 bg-emerald-400 text-[#112015] shadow-sm"
        : "border-white/14 bg-white/6 text-white/55 shadow-sm hover:border-white/28 hover:bg-white/10 hover:text-white"
    }`;
  }

  if (tone === "overlay") {
    return `${baseClassName} ${
      isInCart
        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
        : "border-white bg-white text-black shadow-sm hover:border-black hover:text-black"
    }`;
  }

  return `${baseClassName} ${
    isInCart
      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
      : "border-[#E7E0D4] bg-white text-[#5A564C] shadow-sm hover:border-[#1B1C18] hover:text-[#1B1C18]"
  }`;
};

const PopularCard = ({
  product,
  categoryLabel,
  sectionBadgeLabel,
  discountLabel,
  pricing,
  showCartButton,
  isCompared,
  isInCart,
  isWishlisted,
  wishlistLoading,
  toggleProductCart,
  onViewDetails,
  toggleCompare,
  toggleWishlist,
}) => {
  const productId = product?._id || product?.id;
  return (
    <article
      onClick={onViewDetails}
      className="home-showcase-font group relative flex h-full min-h-[14rem] cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10 sm:p-3.5"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50/80 border border-slate-100 p-2">
        <IconButton
          label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className={`${getWishlistIconButtonClassName(
            isWishlisted,
            "absolute right-2.5 top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-2xs backdrop-blur-xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600",
          )} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <FiHeart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
        </IconButton>
        <Link
          to={`/product/${productId}`}
          onClick={(e) => e.stopPropagation()}
          className="block h-full w-full"
        >
          <ProductImage
            src={product?.images?.[0] || product?.image}
            alt={product?.title}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between pt-3">
        <div>
          <div className="mb-1.5 flex min-h-[1.4rem] flex-wrap items-center gap-1.5">
            {sectionBadgeLabel ? (
              <span className="home-showcase-label rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                {sectionBadgeLabel}
              </span>
            ) : null}
            {discountLabel ? (
              <span className="home-showcase-label rounded-md bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600">
                {discountLabel}
              </span>
            ) : null}
          </div>
          <Link
            to={`/product/${productId}`}
            onClick={(e) => e.stopPropagation()}
            className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 hover:text-blue-600 block"
          >
            {product?.title}
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div className="space-y-0.5">
            <span className="home-showcase-label text-sm sm:text-base font-black text-slate-900 leading-none">
              {pricing.isTba ? "TBA" : formatPrice(pricing.currentPrice)}
            </span>
            {pricing.hasDiscount ? (
              <span className="block text-[11px] font-semibold text-slate-400 line-through">
                {formatPrice(pricing.previousPrice)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {showCartButton ? (
              <IconButton
                label={isInCart ? "Remove from cart" : "Add to cart"}
                onClick={toggleProductCart}
                className={getCartIconButtonClassName(
                  isInCart,
                  "light",
                  "h-8 w-8 sm:h-8.5 sm:w-8.5",
                )}
              >
                <FiShoppingBag className="h-4 w-4" />
              </IconButton>
            ) : null}
            <IconButton
              label={isCompared ? "Remove from compare" : "Add to compare"}
              onClick={toggleCompare}
              className={getCompareIconButtonClassName(
                isCompared,
                "light",
                "h-8 w-8 sm:h-8.5 sm:w-8.5",
              )}
            >
              <FiShuffle className="h-3.5 w-3.5" />
            </IconButton>
            <Link
              to={`/product/${productId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
              title="View Product Details"
            >
              <FiEye className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const HotDealCard = ({
  product,
  categoryLabel,
  sectionBadgeLabel,
  discountLabel,
  pricing,
  showCartButton,
  isCompared,
  isInCart,
  isWishlisted,
  wishlistLoading,
  toggleProductCart,
  onViewDetails,
  toggleCompare,
  toggleWishlist,
}) => {
  const productId = product?._id || product?.id;
  return (
    <article
      onClick={onViewDetails}
      className="home-showcase-font group flex h-full min-h-[14rem] cursor-pointer flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/10 sm:p-3.5"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-2">
        {discountLabel ? (
          <span className="home-showcase-label absolute left-2.5 top-2.5 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-extrabold text-white shadow-xs">
            {discountLabel}
          </span>
        ) : null}
        <IconButton
          label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className={`${getWishlistIconButtonClassName(
            isWishlisted,
            "absolute right-2.5 top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-2xs backdrop-blur-xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600",
          )} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <FiHeart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
        </IconButton>
        <Link
          to={`/product/${productId}`}
          onClick={(e) => e.stopPropagation()}
          className="block h-full w-full"
        >
          <ProductImage
            src={product?.images?.[0] || product?.image}
            alt={product?.title}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col text-left justify-between pt-3">
        <div>
          <div className="mb-1.5 flex min-h-[1.4rem] flex-wrap items-center gap-1.5">
            {sectionBadgeLabel ? (
              <span className="home-showcase-label rounded-md bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600">
                {sectionBadgeLabel}
              </span>
            ) : null}
          </div>
          <Link
            to={`/product/${productId}`}
            onClick={(e) => e.stopPropagation()}
            className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-rose-600 hover:text-rose-600 block"
          >
            {product?.title}
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div className="space-y-0.5">
            <span className="home-showcase-label text-sm sm:text-base font-black text-rose-600 leading-none">
              {pricing.isTba ? "TBA" : formatPrice(pricing.currentPrice)}
            </span>
            {pricing.hasDiscount ? (
              <span className="block text-[11px] font-semibold text-slate-400 line-through">
                {formatPrice(pricing.previousPrice)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {showCartButton ? (
              <IconButton
                label={isInCart ? "Remove from cart" : "Add to cart"}
                onClick={toggleProductCart}
                className={getCartIconButtonClassName(
                  isInCart,
                  "light",
                  "h-8 w-8 sm:h-8.5 sm:w-8.5",
                )}
              >
                <FiShoppingBag className="h-4 w-4" />
              </IconButton>
            ) : null}
            <IconButton
              label={isCompared ? "Remove from compare" : "Add to compare"}
              onClick={toggleCompare}
              className={getCompareIconButtonClassName(
                isCompared,
                "light",
                "h-8 w-8 sm:h-8.5 sm:w-8.5",
              )}
            >
              <FiShuffle className="h-3.5 w-3.5" />
            </IconButton>
            <Link
              to={`/product/${productId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-600"
              title="View Product Details"
            >
              <FiEye className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const FeaturedCard = ({
  product,
  categoryLabel,
  pricing,
  showCartButton,
  isCompared,
  isInCart,
  isWishlisted,
  wishlistLoading,
  toggleProductCart,
  onViewDetails,
  toggleCompare,
  toggleWishlist,
}) => {
  const productId = product?._id || product?.id;
  return (
    <article
      onClick={onViewDetails}
      className="home-showcase-font group flex h-full min-h-[14rem] cursor-pointer flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 sm:p-3.5"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-2">
        <IconButton
          label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className={`${getWishlistIconButtonClassName(
            isWishlisted,
            "absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-2xs backdrop-blur-xs transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600",
          )} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <FiHeart className={`h-4 w-4 ${isWishlisted ? "fill-indigo-500 text-indigo-500" : ""}`} />
        </IconButton>
        <Link
          to={`/product/${productId}`}
          onClick={(e) => e.stopPropagation()}
          className="block h-full w-full"
        >
          <ProductImage
            src={product?.images?.[0] || product?.image}
            alt={product?.title}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col pt-3 text-left justify-between">
        <div>
          <span className="home-showcase-label text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            {categoryLabel || "Featured"}
          </span>
          <Link
            to={`/product/${productId}`}
            onClick={(e) => e.stopPropagation()}
            className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 hover:text-indigo-600 block"
          >
            {product?.title}
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span className="home-showcase-label text-sm sm:text-base font-black text-slate-900 leading-none">
            {pricing.isTba ? "TBA" : formatPrice(pricing.currentPrice)}
          </span>

          <div className="flex items-center gap-1.5">
            {showCartButton ? (
              <IconButton
                label={isInCart ? "Remove from cart" : "Add to cart"}
                onClick={toggleProductCart}
                className={getCartIconButtonClassName(
                  isInCart,
                  "light",
                  "h-8 w-8 sm:h-8.5 sm:w-8.5",
                )}
              >
                <FiShoppingBag className="h-4 w-4" />
              </IconButton>
            ) : null}
            <IconButton
              label={isCompared ? "Remove from compare" : "Add to compare"}
              onClick={toggleCompare}
              className={getCompareIconButtonClassName(
                isCompared,
                "light",
                "h-8 w-8 sm:h-8.5 sm:w-8.5",
              )}
            >
              <FiShuffle className="h-3.5 w-3.5" />
            </IconButton>
            <Link
              to={`/product/${productId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600"
              title="View Product Details"
            >
              <FiEye className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const BestSellingCard = ({
  product,
  categoryLabel,
  pricing,
  showCartButton,
  isCompared,
  isInCart,
  isWishlisted,
  wishlistLoading,
  toggleProductCart,
  onViewDetails,
  toggleCompare,
  toggleWishlist,
}) => {
  const productId = product?._id || product?.id;
  const ratingValue = Number(product?.averageRating || product?.rating || 4.9);
  const totalReviews = Number(product?.reviewCount || product?.numReviews || 0);

  return (
    <article
      onClick={onViewDetails}
      className="home-showcase-font group relative flex h-full min-h-[14rem] cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 sm:p-4"
    >
      {/* Image Wrap */}
      <div className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50/90 border border-slate-100 p-2 sm:p-3">
        {/* Top Badges */}
        <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[9px] font-extrabold text-white shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />
            Best Seller
          </span>
          {pricing.hasDiscount ? (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
              SAVE {Math.round(((pricing.previousPrice - pricing.currentPrice) / pricing.previousPrice) * 100)}%
            </span>
          ) : null}
        </div>

        {/* Top-Right Wishlist Button */}
        <IconButton
          label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-2xs backdrop-blur-xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
        >
          <FiHeart
            className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
          />
        </IconButton>

        {/* Product Image */}
        <Link
          to={`/product/${productId}`}
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full items-center justify-center"
        >
          <ProductImage
            src={product?.images?.[0] || product?.image}
            alt={product?.title}
            className="max-h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      {/* Info Body */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Rating & Category Row */}
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {categoryLabel || product?.category?.name || "Popular"}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              <FiStar className="h-3 w-3 fill-amber-400 text-amber-500" />
              <span>{ratingValue.toFixed(1)}</span>
              {totalReviews > 0 ? (
                <span className="text-slate-400 font-normal">({totalReviews})</span>
              ) : null}
            </div>
          </div>

          {/* Product Title Link */}
          <Link
            to={`/product/${productId}`}
            onClick={(e) => e.stopPropagation()}
            className="line-clamp-2 text-sm sm:text-[15px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 hover:text-blue-600 block"
          >
            {product?.title}
          </Link>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div className="space-y-0.5">
            <span className="block text-base sm:text-lg font-black text-slate-900 leading-none">
              {pricing.isTba ? "TBA" : formatPrice(pricing.currentPrice)}
            </span>
            {pricing.hasDiscount ? (
              <span className="block text-xs font-semibold text-slate-400 line-through">
                {formatPrice(pricing.previousPrice)}
              </span>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {showCartButton ? (
              <button
                type="button"
                onClick={toggleProductCart}
                aria-label={isInCart ? "In Cart" : "Add to cart"}
                className={`flex h-8 sm:h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-bold transition-all duration-200 shadow-2xs active:scale-95 ${
                  isInCart
                    ? "bg-blue-600 text-white shadow-blue-500/25"
                    : "bg-slate-900 text-white hover:bg-blue-600"
                }`}
              >
                <FiShoppingBag className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{isInCart ? "In Cart" : "Add"}</span>
              </button>
            ) : null}
            <IconButton
              label={isCompared ? "Remove from compare" : "Add to compare"}
              onClick={toggleCompare}
              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${
                isCompared
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50"
              }`}
            >
              <FiShuffle className="h-3.5 w-3.5" />
            </IconButton>
            <Link
              to={`/product/${productId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
              title="View Product Details"
            >
              <FiEye className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const LatestCard = ({
  product,
  pricing,
  showCartButton,
  isCompared,
  isInCart,
  isWishlisted,
  wishlistLoading,
  toggleProductCart,
  onViewDetails,
  toggleCompare,
  toggleWishlist,
}) => {
  const productId = product?._id || product?.id;
  return (
    <article
      onClick={onViewDetails}
      className="home-showcase-font group flex h-full min-h-[14rem] cursor-pointer flex-col rounded-2xl border border-slate-200/90 bg-white p-3 text-center shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 sm:p-3.5"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-2">
        <div className="home-showcase-label absolute left-2.5 top-2.5 z-10 rounded-full bg-amber-500 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-xs sm:text-[9px]">
          New
        </div>
        <IconButton
          label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className={`${getWishlistIconButtonClassName(
            isWishlisted,
            "absolute right-2.5 top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-2xs backdrop-blur-xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600",
          )} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <FiHeart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
        </IconButton>
        <Link
          to={`/product/${productId}`}
          onClick={(e) => e.stopPropagation()}
          className="block h-full w-full"
        >
          <ProductImage
            src={product?.images?.[0] || product?.image}
            alt={product?.title}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="px-1 text-left pt-3 flex flex-1 flex-col justify-between">
        <div>
          <span className="home-showcase-label mb-1 block text-[9px] font-bold uppercase tracking-wider text-amber-600">
            Fresh Arrival
          </span>
          <Link
            to={`/product/${productId}`}
            onClick={(e) => e.stopPropagation()}
            className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-amber-600 hover:text-amber-600 block"
          >
            {product?.title}
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <p className="home-showcase-label text-sm sm:text-base font-black text-slate-900">
            {pricing.isTba ? "TBA" : formatPrice(pricing.currentPrice)}
          </p>

          <div className="flex items-center gap-1.5">
            {showCartButton ? (
              <IconButton
                label={isInCart ? "Remove from cart" : "Add to cart"}
                onClick={toggleProductCart}
                className={getCartIconButtonClassName(
                  isInCart,
                  "light",
                  "h-8 w-8 sm:h-8.5 sm:w-8.5",
                )}
              >
                <FiShoppingBag className="h-4 w-4" />
              </IconButton>
            ) : null}
            <IconButton
              label={isCompared ? "Remove from compare" : "Add to compare"}
              onClick={toggleCompare}
              className={getCompareIconButtonClassName(
                isCompared,
                "light",
                "h-8 w-8 sm:h-8.5 sm:w-8.5",
              )}
            >
              <FiShuffle className="h-3.5 w-3.5" />
            </IconButton>
            <Link
              to={`/product/${productId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-600"
              title="View Product Details"
            >
              <FiEye className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const LandingSectionProductCard = ({
  product,
  variant,
  badgeText = "",
  onViewDetails,
}) => {
  const {
    canQuickAddToCart,
    pricing,
    isCompared,
    isInCart,
    isWishlisted,
    wishlistLoading,
    toggleProductCart,
    toggleCompare,
    toggleWishlist,
  } = useProductCardState(product);
  const showCartButton = canQuickAddToCart;
  const discountLabel = buildDiscountLabel(pricing);
  const categoryLabel = getCategoryLabel(product, badgeText);
  const sectionBadgeLabel = getSectionBadgeLabel(categoryLabel, badgeText);
  const handleViewDetails = () => {
    if (typeof onViewDetails === "function") {
      onViewDetails(product);
    }
  };

  const sharedProps = {
    product,
    categoryLabel,
    sectionBadgeLabel,
    discountLabel,
    pricing,
    showCartButton,
    isCompared,
    isInCart,
    isWishlisted,
    wishlistLoading,
    toggleProductCart,
    onViewDetails: handleViewDetails,
    toggleCompare,
    toggleWishlist,
  };

  switch (variant) {
    case "hot-deals":
      return <HotDealCard {...sharedProps} />;
    case "featured":
      return <FeaturedCard {...sharedProps} />;
    case "best-selling":
      return <BestSellingCard {...sharedProps} />;
    case "latest":
      return <LatestCard {...sharedProps} />;
    case "popular":
    default:
      return <PopularCard {...sharedProps} />;
  }
};

export default LandingSectionProductCard;
