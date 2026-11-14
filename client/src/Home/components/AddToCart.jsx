/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "@/lib/routing";
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiShoppingBag,
  FiShield,
  FiTag,
  FiTruck,
  FiCheckCircle,
  FiLock,
  FiRotateCcw,
  FiX,
  FiArrowRight,
  FiPercent,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import ConfirmModal from "../../components/ConfirmModal";
import usePublicSettings from "../../hooks/usePublicSettings";
import {
  getOrderItemColorSwatch,
  getOrderItemVariantLines,
} from "../../utils/orderPresentation";
import { getSelectedVariantSignature } from "../../utils/productVariants";
import {
  resolveLiveCartLineTotal,
  resolveLiveCartLineUnitPrice,
} from "../../utils/cartLinePricing";
import { clearBuyNowItem } from "../../utils/buyNowStorage";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const COUPON_STORAGE_KEY = "appliedCoupon";

const resolveImageValue = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;
  if (Array.isArray(value)) return resolveImageValue(value[0]);

  if (typeof value === "object") {
    return (
      value.data ||
      value.url ||
      value.secure_url ||
      value.src ||
      value.path ||
      ""
    );
  }

  return "";
};

const getFullImageUrl = (imagePath) => {
  const resolvedPath = resolveImageValue(imagePath);
  if (!resolvedPath) return null;

  if (
    resolvedPath.startsWith("http://") ||
    resolvedPath.startsWith("https://") ||
    resolvedPath.startsWith("data:")
  ) {
    return resolvedPath;
  }

  if (resolvedPath.startsWith("/")) {
    return baseUrl ? `${baseUrl}${resolvedPath}` : resolvedPath;
  }

  return baseUrl
    ? `${baseUrl}/uploads/products/${resolvedPath}`
    : `/uploads/products/${resolvedPath}`;
};

const FallbackImage = ({ className, alt }) => (
  <div className={`${className} bg-slate-100 flex items-center justify-center text-slate-400`}>
    <FiShoppingBag className="w-8 h-8 opacity-40" />
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
      crossOrigin={
        imgSrc?.startsWith("http://") || imgSrc?.startsWith("https://")
          ? "anonymous"
          : undefined
      }
    />
  );
};

const formatCurrency = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const AddToCart = () => {
  const navigate = useNavigate();
  const { settings } = usePublicSettings();
  const website = settings?.website || {};
  const storeName = website?.storeName || "TazBazar";

  const {
    cartItems,
    cartCount,
    isLoading,
    updateCartItem,
    removeCartItem,
    getCartSubtotal,
  } = useCart();

  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotal = getCartSubtotal();
  const totalUnits = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0,
  );
  const discount = Math.min(
    Number(appliedCoupon?.discount || 0),
    Number(subtotal || 0),
  );
  const total = Math.max(subtotal - discount, 0);

  // Free shipping progress calculation (e.g. Free shipping at 1500 Tk)
  const FREE_SHIPPING_THRESHOLD = 1500;
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100),
  );
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal,
  );

  const clearAppliedCoupon = useCallback((showToast = false) => {
    setAppliedCoupon(null);
    setCouponCode("");
    localStorage.removeItem(COUPON_STORAGE_KEY);

    if (showToast) {
      toast.success("Coupon removed");
    }
  }, []);

  useEffect(() => {
    const savedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
    if (!savedCoupon) return;

    try {
      const parsedCoupon = JSON.parse(savedCoupon);
      if (parsedCoupon?.code) {
        setAppliedCoupon(parsedCoupon);
      }
    } catch (error) {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (cartItems.length === 0 && appliedCoupon) {
      clearAppliedCoupon(false);
    }
  }, [appliedCoupon, cartItems.length, clearAppliedCoupon]);

  const handleUpdateCartItem = async (
    productId,
    newQuantity,
    color = "",
    dimensions = "",
    variationId = "",
    selectedVariantSignature = "",
  ) => {
    const lineKey = `${productId}-${variationId || ""}-${color || ""}-${dimensions || ""}-${selectedVariantSignature || ""}`;
    setUpdatingItemId(lineKey);
    try {
      await updateCartItem(
        productId,
        newQuantity,
        color,
        dimensions,
        variationId,
        selectedVariantSignature,
      );
    } catch (error) {
      console.error("Error updating cart item:", error);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveCartItem = (
    productId,
    color = "",
    dimensions = "",
    variationId = "",
    selectedVariantSignature = "",
    title = "",
  ) => {
    setRemoveConfirm({
      productId,
      color,
      dimensions,
      variationId,
      selectedVariantSignature,
      title,
    });
  };

  const confirmRemoveCartItem = async () => {
    if (!removeConfirm) return;

    setIsRemoving(true);
    try {
      await removeCartItem(
        removeConfirm.productId,
        removeConfirm.color,
        removeConfirm.dimensions,
        removeConfirm.variationId,
        removeConfirm.selectedVariantSignature,
      );
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing cart item:", error);
    } finally {
      setIsRemoving(false);
      setRemoveConfirm(null);
    }
  };

  const applyCoupon = useCallback(
    async (inputCode = couponCode, silent = false) => {
      const normalizedCode = String(inputCode || "").trim().toUpperCase();

      if (!normalizedCode) {
        if (!silent) toast.error("Please enter a coupon code");
        return false;
      }

      if (subtotal <= 0) {
        if (!silent) toast.error("Cart subtotal must be greater than zero");
        return false;
      }

      setIsApplyingCoupon(true);
      try {
        const couponItems = cartItems
          .map((item) => {
            const product =
              typeof item.product === "object" ? item.product : null;
            const productId = item.productId || product?._id || item.product;
            if (!productId) return null;

            return {
              productId,
              product: productId,
              title: item.title || product?.title || "",
              price: resolveLiveCartLineUnitPrice(item),
              quantity: item.quantity || 1,
              category: product?.category?._id || product?.category || null,
              brand: product?.brand?._id || product?.brand || null,
            };
          })
          .filter(Boolean);

        const response = await axios.post(`${baseUrl}/coupons/validate`, {
          code: normalizedCode,
          cartTotal: subtotal,
          items: couponItems,
        });

        const couponData = {
          code: normalizedCode,
          discount: response.data.discount || 0,
          details: response.data.coupon || null,
        };

        setAppliedCoupon(couponData);
        setCouponCode("");
        localStorage.setItem(
          COUPON_STORAGE_KEY,
          JSON.stringify(couponData),
        );

        if (!silent) {
          toast.success(`Coupon "${normalizedCode}" applied!`);
        }
        return true;
      } catch (error) {
        const message =
          error?.response?.data?.message || "Invalid coupon code";
        if (!silent) {
          toast.error(message);
        }
        return false;
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [cartItems, couponCode, subtotal],
  );

  useEffect(() => {
    if (!appliedCoupon?.code || cartItems.length === 0) return;

    let isCancelled = false;
    const refreshCoupon = async () => {
      const isValid = await applyCoupon(appliedCoupon.code, true);
      if (!isValid && !isCancelled) {
        clearAppliedCoupon(false);
      }
    };

    refreshCoupon();

    return () => {
      isCancelled = true;
    };
  }, [appliedCoupon?.code, applyCoupon, clearAppliedCoupon, subtotal]);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    clearBuyNowItem();
    navigate("/checkout");
  };

  const getItemData = (item) => {
    const product = typeof item.product === "object" ? item.product : null;
    const fallbackImage = resolveImageValue(
      item.image || product?.images?.[0] || product?.image,
    );
    const unitPrice = resolveLiveCartLineUnitPrice(item);

    return {
      productId: item.productId || product?._id || item.product,
      title: item.title || product?.title || "Untitled Product",
      price: unitPrice,
      originalPrice: product?.originalPrice || null,
      image: fallbackImage,
      quantity: Number(item.quantity || 1),
      color: item.color || "",
      dimensions: item.dimensions || "",
      variationId: item.variationId || "",
      variationLabel: item.variationLabel || "",
      selectedVariantSignature:
        item.selectedVariantSignature ||
        getSelectedVariantSignature(item.selectedVariant),
      selectedVariant: item.selectedVariant || null,
      customVariantText: item.customVariantText || "",
      isAvailable: product ? Boolean(product.isAvailable !== false) : true,
    };
  };

  if (isLoading) {
    return (
      <section className="min-h-[70vh] bg-slate-50 flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-3 border-slate-200 border-t-indigo-600" />
          <h3 className="text-base font-bold text-slate-800">Loading Shopping Cart...</h3>
          <p className="text-xs text-slate-500">Retrieving your bag items</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f8fafc] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Stepper Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition group"
            >
              <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Continue Shopping</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Shopping Cart</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                {cartCount} items
              </span>
            </h1>
          </div>

          {/* Stepper Indicator */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">
                1
              </span>
              Cart
            </span>
            <div className="w-8 h-0.5 bg-slate-200" />
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] border border-slate-200">
                2
              </span>
              Checkout
            </span>
            <div className="w-8 h-0.5 bg-slate-200" />
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] border border-slate-200">
                3
              </span>
              Confirmation
            </span>
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="max-w-xl mx-auto my-12 rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xl shadow-slate-200/50">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-50 via-slate-50 to-amber-50 border border-slate-100 text-indigo-600 shadow-inner">
              <FiShoppingBag className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">
              Your Shopping Bag is Empty
            </h2>
            <p className="mx-auto mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
              Looks like you haven't added anything to your cart yet. Explore our latest fashion, gadgets, and trending deals!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/shop")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-black hover:scale-[1.02] active:scale-[0.98]"
              >
                <FiShoppingBag className="w-4 h-4" />
                <span>Start Shopping Now</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Cart Layout */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* Left 8 Cols: Product Lines */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Shipping Alert Banner */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <FiTruck className="w-4 h-4 text-indigo-600" />
                    {remainingForFreeShipping === 0 ? (
                      <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        Congratulations! You unlocked FREE Delivery!
                      </span>
                    ) : (
                      <span>
                        Add <span className="text-indigo-600 font-extrabold">{formatCurrency(remainingForFreeShipping)}</span> more to unlock <span className="text-emerald-600">FREE Delivery</span>
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400 font-semibold">{freeShippingProgress}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Card Container */}
              <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="px-5 sm:px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Product Details
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Total: <strong className="text-slate-900">{totalUnits} units</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => {
                    const itemData = getItemData(item);
                    const variantLines = getOrderItemVariantLines(itemData);
                    const colorSwatch = getOrderItemColorSwatch(itemData);
                    const key = `${itemData.productId}-${itemData.variationId || ""}-${itemData.color || ""}-${itemData.dimensions || ""}-${itemData.selectedVariantSignature || ""}`;
                    const lineTotal = resolveLiveCartLineTotal(item);

                    return (
                      <div
                        key={key}
                        className="p-5 sm:p-6 transition hover:bg-slate-50/40 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                      >
                        {/* Image */}
                        <Link
                          to={`/product/${itemData.productId}`}
                          className="shrink-0 relative group"
                        >
                          <ProductImage
                            src={itemData.image}
                            alt={itemData.title}
                            className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border border-slate-200 object-cover bg-slate-50 group-hover:scale-105 transition duration-300"
                          />
                        </Link>

                        {/* Middle Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <Link
                            to={`/product/${itemData.productId}`}
                            className="block"
                          >
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-indigo-600 transition leading-snug line-clamp-2">
                              {itemData.title}
                            </h3>
                          </Link>

                          {/* Variants chips */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                            {variantLines.map((line) => (
                              <span
                                key={`${key}-${line}`}
                                className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-semibold"
                              >
                                {line}
                              </span>
                            ))}

                            {colorSwatch && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                                  style={{ backgroundColor: colorSwatch }}
                                />
                                {itemData.color}
                              </span>
                            )}
                          </div>

                          {/* Unit price badge */}
                          <div className="text-xs font-semibold text-slate-400">
                            Unit Price: <span className="text-slate-800 font-bold">{formatCurrency(itemData.price)}</span>
                          </div>
                        </div>

                        {/* Quantity Counter & Subtotal */}
                        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          {/* Stepper button */}
                          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateCartItem(
                                  itemData.productId,
                                  Math.max(1, itemData.quantity - 1),
                                  itemData.color,
                                  itemData.dimensions,
                                  itemData.variationId,
                                  itemData.selectedVariantSignature,
                                )
                              }
                              disabled={updatingItemId === key || itemData.quantity <= 1}
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white transition"
                              title="Decrease"
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <span className="w-9 text-center text-xs font-bold text-slate-900">
                              {itemData.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateCartItem(
                                  itemData.productId,
                                  itemData.quantity + 1,
                                  itemData.color,
                                  itemData.dimensions,
                                  itemData.variationId,
                                  itemData.selectedVariantSignature,
                                )
                              }
                              disabled={updatingItemId === key}
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-100 transition"
                              title="Increase"
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Line total & remove */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-base sm:text-lg font-black text-slate-900">
                                {formatCurrency(lineTotal)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveCartItem(
                                  itemData.productId,
                                  itemData.color,
                                  itemData.dimensions,
                                  itemData.variationId,
                                  itemData.selectedVariantSignature,
                                  itemData.title,
                                )
                              }
                              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition border border-transparent hover:border-rose-100"
                              title="Remove item"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trust Badges under Items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <FiShield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">100% Genuine</h4>
                    <p className="text-[11px] text-slate-500">Verified authentic products</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <FiRotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Easy Return</h4>
                    <p className="text-[11px] text-slate-500">7 days hassle-free exchange</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <FiLock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Safe Checkout</h4>
                    <p className="text-[11px] text-slate-500">Cash on Delivery & Online</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Order Summary & Coupon Card */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              {/* Coupon Form Card */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FiTag className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Have a promo coupon?
                  </h3>
                </div>

                {appliedCoupon ? (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-xs font-extrabold text-emerald-900 uppercase">
                          {appliedCoupon.code}
                        </span>
                        <p className="text-[11px] text-emerald-700">
                          Discount of {formatCurrency(appliedCoupon.discount)} applied!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearAppliedCoupon(true)}
                      className="p-1 rounded-full text-emerald-700 hover:bg-emerald-100 transition"
                      title="Remove coupon"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="ENTER COUPON CODE"
                      className="flex-1 uppercase text-xs font-bold tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none transition bg-slate-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon(couponCode)}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition disabled:opacity-40"
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              {/* Order Summary Card */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                  Order Summary
                </h3>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal ({totalUnits} items)</span>
                    <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-semibold bg-emerald-50 px-3 py-2 rounded-xl">
                      <span className="flex items-center gap-1">
                        <FiPercent className="w-3.5 h-3.5" />
                        Coupon Savings
                      </span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Estimated Delivery</span>
                    <span className="font-semibold text-slate-500">Calculated at checkout</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900">Estimated Total</span>
                      <p className="text-[11px] text-slate-400">Inclusive of VAT</p>
                    </div>
                    <span className="text-2xl font-black text-indigo-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-black hover:to-indigo-950 px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-slate-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <FiLock className="w-3 h-3 text-slate-400" />
                  Encrypted & Secure 256-Bit SSL Checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!removeConfirm}
        title="Remove item"
        message={`Are you sure you want to remove "${removeConfirm?.title || "this item"}" from your cart?`}
        confirmLabel={isRemoving ? "Removing..." : "Remove"}
        cancelLabel="Cancel"
        onConfirm={confirmRemoveCartItem}
        onCancel={() => setRemoveConfirm(null)}
        isLoading={isRemoving}
        isDanger
      />
    </section>
  );
};

export default AddToCart;
