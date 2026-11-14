/* eslint-disable no-unused-vars */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "@/lib/routing";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiCreditCard,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiTag,
  FiTruck,
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../hooks/useAuth";
import usePublicSettings from "../../hooks/usePublicSettings";
import {
  buildDataLayerItem,
  getDataLayerCurrency,
  pushDataLayerEvent,
} from "../../utils/marketingDataLayer";
import { trackInitiateCheckout } from "../../utils/analyticsTracker";
import { fetchPublicSettings } from "../../utils/publicSettings";
import {
  clearLandingAttribution,
  getLandingAttribution,
} from "../../utils/landingAttribution";
import {
  getOrderItemColorSwatch,
  getOrderItemVariantLines,
} from "../../utils/orderPresentation";
import { getSelectedVariantSignature } from "../../utils/productVariants";
import {
  resolveLiveCartLineTotal,
  resolveLiveCartLineUnitPrice,
} from "../../utils/cartLinePricing";
import {
  BANGLADESH_DISTRICT_OPTIONS,
  BANGLADESH_NON_DHAKA_DISTRICT_OPTIONS,
  isDhakaDistrict,
  isOutsideDhakaShippingOption,
} from "../../utils/bangladeshLocations";
import { getBuyNowItem, clearBuyNowItem } from "../../utils/buyNowStorage";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const COUPON_STORAGE_KEY = "appliedCoupon";
const ABANDONED_CHECKOUT_SESSION_KEY = "checkoutAbandonedSessionKey";

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

const normalizePaymentMethodValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    return String(value.type || value.name || value.method || "").trim();
  }
  return "";
};

const isCashOnDeliveryMethod = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized === "cod" || normalized === "cash on delivery";
};

const isGatewayPaymentMethod = (method) =>
  ["sslcommerz", "bkash", "nagad"].includes(
    String(method?.channelType || "")
      .trim()
      .toLowerCase(),
  );

const normalizeBangladeshPhone = (value) => {
  const sanitized = String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");
  if (sanitized.startsWith("+88")) return `0${sanitized.slice(3)}`;
  if (sanitized.startsWith("880")) return `0${sanitized.slice(3)}`;
  if (!sanitized.startsWith("0")) return `0${sanitized}`;
  return sanitized;
};

const isValidBangladeshPhone = (value) => /^01[3-9]\d{8}$/.test(value);

const getOrCreateCheckoutSessionKey = () => {
  if (typeof window === "undefined") return "";

  const existing = String(
    window.localStorage.getItem(ABANDONED_CHECKOUT_SESSION_KEY) || "",
  ).trim();
  if (existing) return existing;

  const nextKey = `chk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(ABANDONED_CHECKOUT_SESSION_KEY, nextKey);
  return nextKey;
};

const ProductImage = ({ src, alt, className }) => {
  const [imageSrc, setImageSrc] = useState(getFullImageUrl(src));

  useEffect(() => {
    setImageSrc(getFullImageUrl(src));
  }, [src]);

  if (!imageSrc) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100 text-xs text-gray-400`}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setImageSrc("")}
    />
  );
};

const formatCurrency = (value) => `${Number(value || 0).toFixed(2)} TK`;
const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs";
const sectionCardClass =
  "rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm";

const splitRecipientName = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const CheckOut = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart, getCartSubtotal } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { loaded: settingsLoaded } = usePublicSettings();

  const [loading, setLoading] = useState(false);
  const [isEstimatingShipping, setIsEstimatingShipping] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [shippingZones, setShippingZones] = useState([]);
  const [locationOptions, setLocationOptions] = useState({
    cities: [],
    subCities: [],
  });
  const initiateCheckoutTrackedRef = useRef(false);
  const hasPlacedOrderRef = useRef(false);
  const hasCapturedAbandonedRef = useRef(false);
  const handledGatewayReturnRef = useRef(false);
  const checkoutSnapshotRef = useRef({
    cartItems: [],
    formData: {},
    subtotal: 0,
    total: 0,
  });
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: user?.phone || user?.originalPhone || "",
    alternativePhone: "",
    address: "",
    city: "Dhaka",
    subCity: "",
    district: "Dhaka",
    postalCode: "",
    country: "Bangladesh",
    notes: "",
    agreeTerms: true,
  });
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [buyNowItem, setBuyNowItemState] = useState(() => getBuyNowItem());
  const isBuyNow = Boolean(buyNowItem);

  const effectiveCheckoutItems = useMemo(() => {
    if (buyNowItem) {
      return [buyNowItem];
    }
    return cartItems;
  }, [buyNowItem, cartItems]);

  const subtotal = useMemo(() => {
    if (buyNowItem) {
      const unitPrice = resolveLiveCartLineUnitPrice(buyNowItem);
      const qty = Math.max(Number(buyNowItem.quantity || 1), 1);
      return Math.round((unitPrice * qty + Number.EPSILON) * 100) / 100;
    }
    return getCartSubtotal();
  }, [buyNowItem, getCartSubtotal]);

  const totalUnits = useMemo(
    () =>
      effectiveCheckoutItems.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0,
      ),
    [effectiveCheckoutItems],
  );
  const savedAddresses = useMemo(
    () => (Array.isArray(user?.addressBook) ? user.addressBook : []),
    [user?.addressBook],
  );
  const selectedPaymentMethod = useMemo(
    () =>
      paymentMethods.find(
        (method) =>
          String(method?._id || "") === String(selectedPaymentMethodId || ""),
      ) || null,
    [paymentMethods, selectedPaymentMethodId],
  );
  const paymentMethodValue = normalizePaymentMethodValue(selectedPaymentMethod);
  const paymentMethodChannel = String(
    selectedPaymentMethod?.channelType || "manual",
  ).toLowerCase();
  const selectedPaymentIsGateway = isGatewayPaymentMethod(
    selectedPaymentMethod,
  );
  const hasSelectedDistrict = Boolean(String(formData.district || "").trim());
  const requiresTransactionProof = !selectedPaymentMethod
    ? false
    : selectedPaymentMethod?.requiresTransactionProof === undefined
      ? true
      : Boolean(selectedPaymentMethod?.requiresTransactionProof);
  const selectedPaymentAccount = String(
    selectedPaymentMethod?.accountNo || "",
  ).trim();
  const shippingMeta = shippingEstimate?.shippingMeta || null;

  const discount = Math.min(
    Number(appliedCoupon?.discount || 0),
    Number(subtotal || 0),
  );
  const isFreeShippingCoupon = Boolean(appliedCoupon?.freeShipping);
  const effectiveShippingFee = isFreeShippingCoupon ? 0 : shippingFee;
  const total = Math.max(subtotal + effectiveShippingFee - discount, 0);
  const shippingFeeStatusLabel = isFreeShippingCoupon
    ? "FREE"
    : shippingEstimate
      ? formatCurrency(shippingFee)
      : isEstimatingShipping
        ? "Calculating..."
        : formatCurrency(shippingFee);
  const shippingSourceLabel = isFreeShippingCoupon
    ? shippingMeta?.sourceLabel || "Free Delivery"
    : shippingMeta?.sourceLabel ||
      (isEstimatingShipping
        ? "Calculating shipping..."
        : "Standard Delivery");
  const paymentActionLabel = selectedPaymentIsGateway
    ? "Proceed to Payment"
    : "Place Order";

  const getItemData = (item) => {
    const product = typeof item.product === "object" ? item.product : null;
    const selectedVariants = Array.isArray(item.selectedVariants)
      ? item.selectedVariants
      : [];
    const unitPrice = resolveLiveCartLineUnitPrice(item);
    return {
      productId: item.productId || product?._id || item.product,
      title: item.title || product?.title || "Product",
      price: unitPrice,
      image: resolveImageValue(
        item.image || product?.images?.[0] || product?.image || "",
      ),
      quantity: Number(item.quantity || 1),
      color: item.color || "",
      dimensions: item.dimensions || "",
      variationId: String(item.variationId || "").trim(),
      variationLabel: String(item.variationLabel || "").trim(),
      selectedVariants,
      selectedVariantSignature:
        String(item.selectedVariantSignature || "").trim() ||
        getSelectedVariantSignature(selectedVariants),
    };
  };

  const getDataLayerItems = useCallback(
    () =>
      effectiveCheckoutItems
        .map((item) => {
          const itemData = getItemData(item);
          if (!itemData.productId) return null;
          return buildDataLayerItem({
            productId: itemData.productId,
            title: itemData.title,
            price: itemData.price,
            quantity: itemData.quantity,
            variationLabel: itemData.variationLabel,
          });
        })
        .filter(Boolean),
    [effectiveCheckoutItems],
  );

  const buildAbandonedPayload = useCallback(() => {
    const snapshot = checkoutSnapshotRef.current || {};
    const snapshotCartItems = Array.isArray(snapshot.cartItems)
      ? snapshot.cartItems
      : [];
    const snapshotFormData = snapshot.formData || {};
    const snapshotSubtotal = Number(snapshot.subtotal || 0);
    const snapshotTotal = Number(snapshot.total || 0);
    const attribution = getLandingAttribution();
    const safePhone = normalizeBangladeshPhone(snapshotFormData.phone);
    const resolvedName = `${String(snapshotFormData.fullName || snapshotFormData.firstName || "").trim()} ${String(snapshotFormData.lastName || "").trim()}`.trim();

    return {
      sessionKey: getOrCreateCheckoutSessionKey(),
      source: attribution?.source || "checkout",
      landingPageSlug: attribution?.slug || "",
      customer: {
        name: resolvedName,
        email: String(snapshotFormData.email || "").trim(),
        phone: String(safePhone || "").trim(),
        alternativePhone: String(
          snapshotFormData.alternativePhone || "",
        ).trim(),
        address: String(snapshotFormData.address || "").trim(),
        city: String(snapshotFormData.city || "Dhaka").trim(),
        subCity: String(snapshotFormData.subCity || "").trim(),
        district: String(snapshotFormData.district || "Dhaka").trim(),
        notes: String(snapshotFormData.notes || "").trim(),
      },
      items: snapshotCartItems.map((item) => {
        const itemData = getItemData(item);
        return {
          productId: itemData.productId,
          quantity: itemData.quantity,
          price: Number(itemData.price || 0),
          title: itemData.title,
          image: itemData.image,
          variationId: itemData.variationId || "",
          variationLabel: itemData.variationLabel || "",
          selectedVariants: itemData.selectedVariants || [],
        };
      }),
      subtotal: snapshotSubtotal,
      total: snapshotTotal,
    };
  }, []);

  const captureAbandonedCheckout = useCallback(
    async ({ useBeacon = false } = {}) => {
      if (hasPlacedOrderRef.current) return;
      if (
        !Array.isArray(checkoutSnapshotRef.current?.cartItems) ||
        !checkoutSnapshotRef.current.cartItems.length
      )
        return;

      const payload = buildAbandonedPayload();
      const rawPhone = String(payload?.customer?.phone || "").trim();

      // Strictly only capture if a valid 11-digit Bangladesh phone number is provided
      if (!rawPhone || !isValidBangladeshPhone(rawPhone)) {
        return;
      }

      if (
        !payload.sessionKey ||
        !Array.isArray(payload.items) ||
        !payload.items.length
      )
        return;

      try {
        if (
          useBeacon &&
          typeof navigator !== "undefined" &&
          typeof navigator.sendBeacon === "function"
        ) {
          const blob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
          });
          navigator.sendBeacon(`${baseUrl}/abandoned-orders/capture`, blob);
          return;
        }

        await axios.post(`${baseUrl}/abandoned-orders/capture`, payload, {
          meta: {
            skipGlobalButtonLoading: true,
            skipGlobalLoadingToast: true,
          },
        });
      } catch (_error) {
        // Silent background capture
      }
    },
    [buildAbandonedPayload],
  );

  const getShippingItemsPayload = useCallback(
    () =>
      effectiveCheckoutItems
        .map((item) => {
          const product =
            typeof item.product === "object" ? item.product : null;
          const productId = item.productId || product?._id || item.product;
          if (!productId) return null;

          return {
            productId,
            quantity: Number(item.quantity || 1),
            price: resolveLiveCartLineUnitPrice(item),
          };
        })
        .filter(Boolean),
    [effectiveCheckoutItems],
  );

  const clearAppliedCoupon = useCallback((showToast = false) => {
    setAppliedCoupon(null);
    setCouponCode("");
    localStorage.removeItem(COUPON_STORAGE_KEY);

    if (showToast) {
      toast.success("Coupon removed");
    }
  }, []);

  const applyCoupon = useCallback(
    async (inputCode = couponCode, silent = false) => {
      const normalizedCode = String(inputCode || "")
        .trim()
        .toUpperCase();

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
        const couponItems = effectiveCheckoutItems
          .map((item) => {
            const product =
              typeof item.product === "object" ? item.product : null;
            const productId = item.productId || product?._id || item.product;
            if (!productId) return null;

            return {
              productId,
              quantity: Number(item.quantity || 1),
              price: resolveLiveCartLineUnitPrice(item),
            };
          })
          .filter(Boolean);

        const response = await axios.post(`${baseUrl}/coupons/apply`, {
          code: normalizedCode,
          subtotal,
          items: couponItems,
        });

        const discountValue = Number(response.data?.discount || 0);
        const couponData = {
          code: response.data?.code || normalizedCode,
          offerType: String(
            response.data?.offerType || "discount",
          ).toLowerCase(),
          freeShipping: Boolean(response.data?.freeShipping),
          discount: discountValue,
          finalAmount: Number(
            response.data?.finalAmount || subtotal - discountValue,
          ),
        };

        setAppliedCoupon(couponData);
        setCouponCode("");
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(couponData));

        if (!silent) {
          toast.success("Coupon applied successfully");
        }

        return true;
      } catch (error) {
        if (!silent) {
          toast.error(
            error.response?.data?.message || "Failed to apply coupon",
          );
        }
        return false;
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [effectiveCheckoutItems, couponCode, subtotal],
  );

  const estimateShipping = useCallback(
    async (addressData = formData, silent = true) => {
      if (effectiveCheckoutItems.length === 0) {
        setShippingFee(0);
        setShippingEstimate(null);
        return { success: true, shippingFee: 0, shippingMeta: {} };
      }

      setIsEstimatingShipping(true);
      try {
        const response = await axios.post(`${baseUrl}/shipping/estimate`, {
          items: getShippingItemsPayload(),
          city: String(addressData?.city || "").trim(),
          district: String(addressData?.district || "").trim(),
          country: String(addressData?.country || "Bangladesh").trim(),
        });

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Shipping estimate failed");
        }

        const fee = Number(response.data.shippingFee || 0);
        setShippingFee(fee);
        setShippingEstimate(response.data);

        return {
          success: true,
          shippingFee: fee,
          shippingMeta: {
            ...(response.data.shippingMeta || {}),
            breakdown:
              response.data.shippingMeta?.breakdown ||
              response.data.breakdown ||
              [],
            estimatedMinDays:
              response.data.shippingMeta?.estimatedMinDays ||
              response.data.estimatedMinDays ||
              0,
            estimatedMaxDays:
              response.data.shippingMeta?.estimatedMaxDays ||
              response.data.estimatedMaxDays ||
              0,
            destination: response.data.destination || {},
          },
        };
      } catch (error) {
        setShippingFee(0);
        setShippingEstimate(null);
        if (!silent) {
          toast.error(
            error.response?.data?.message || "Failed to estimate shipping fee",
          );
        }
        return { success: false, shippingFee: 0, shippingMeta: {} };
      } finally {
        setIsEstimatingShipping(false);
      }
    },
    [effectiveCheckoutItems.length, formData, getShippingItemsPayload],
  );

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    if (handledGatewayReturnRef.current) return;

    const searchParams = new URLSearchParams(location.search || "");
    const paymentResult = String(searchParams.get("payment") || "")
      .trim()
      .toLowerCase();
    const returnedOrderId = String(searchParams.get("orderId") || "").trim();

    if (!returnedOrderId || !["failed", "cancel"].includes(paymentResult)) {
      return;
    }

    handledGatewayReturnRef.current = true;

    try {
      const guestOrders = JSON.parse(
        localStorage.getItem("guestOrders") || "[]",
      );
      const filteredOrders = guestOrders.filter(
        (guestOrder) => String(guestOrder?._id || "") !== returnedOrderId,
      );
      localStorage.setItem("guestOrders", JSON.stringify(filteredOrders));

      const lastOrder = localStorage.getItem("lastOrder");
      if (lastOrder) {
        const parsedLastOrder = JSON.parse(lastOrder);
        if (String(parsedLastOrder?._id || "") === returnedOrderId) {
          localStorage.removeItem("lastOrder");
        }
      }
    } catch (error) {
      console.error("Failed to clear failed gateway order cache:", error);
    }

    toast.error(
      paymentResult === "cancel"
        ? "Payment was cancelled. Please try again."
        : "Payment failed. Please try again from checkout.",
    );
  }, [location.search]);

  useEffect(() => {
    if (!requiresTransactionProof && transactionId) {
      setTransactionId("");
    }
  }, [requiresTransactionProof, transactionId]);

  useEffect(() => {
    let mounted = true;
    const loadLocationOptions = async () => {
      try {
        const settings = await fetchPublicSettings();
        if (!mounted) return;

        const cityOptions = Array.isArray(settings?.locations?.cityOptions)
          ? settings.locations.cityOptions
          : [];
        const subCityOptions = Array.isArray(
          settings?.locations?.subCityOptions,
        )
          ? settings.locations.subCityOptions
          : [];

        setLocationOptions({
          cities: cityOptions,
          subCities: subCityOptions,
        });
      } catch (_error) {
        if (!mounted) return;
        setLocationOptions({
          cities: [],
          subCities: [],
        });
      }
    };

    loadLocationOptions();

    const loadShippingZones = async () => {
      try {
        const res = await axios.get(`${baseUrl}/shipping/zones`);
        if (!mounted) return;
        if (res.data?.success && Array.isArray(res.data?.zones)) {
          setShippingZones(res.data.zones);
        }
      } catch (_err) {
        // ignore
      }
    };
    loadShippingZones();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!effectiveCheckoutItems.length) {
      hasCapturedAbandonedRef.current = false;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ABANDONED_CHECKOUT_SESSION_KEY);
      }
      return;
    }

    getOrCreateCheckoutSessionKey();
  }, [effectiveCheckoutItems.length]);

  useEffect(() => {
    checkoutSnapshotRef.current = {
      cartItems: effectiveCheckoutItems,
      formData,
      subtotal,
      total,
    };
  }, [effectiveCheckoutItems, formData, subtotal, total]);

  const applySavedAddress = useCallback((address) => {
    if (!address) return;
    const nameParts = splitRecipientName(address.recipientName);

    setSelectedAddressId(String(address._id || ""));
    setFormData((current) => ({
      ...current,
      fullName: String(address.recipientName || current.fullName || "").trim(),
      firstName: nameParts.firstName || current.firstName,
      lastName: nameParts.lastName,
      phone: String(address.phone || current.phone || ""),
      alternativePhone: String(address.alternativePhone || ""),
      address: String(address.address || ""),
      city: String(address.city || current.city || "Dhaka"),
      subCity: String(address.subCity || ""),
      district: String(address.district || current.district || "Dhaka"),
      postalCode: String(address.postalCode || ""),
      country: String(address.country || "Bangladesh"),
      notes: String(address.deliveryNotes || current.notes || ""),
    }));
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !savedAddresses.length) return;
    if (selectedAddressId) return;
    if (
      formData.address ||
      formData.city ||
      formData.district ||
      formData.postalCode
    )
      return;

    const defaultAddress =
      savedAddresses.find((address) => address?.isDefault) || savedAddresses[0];

    if (defaultAddress) {
      applySavedAddress(defaultAddress);
    }
  }, [
    applySavedAddress,
    formData.address,
    formData.city,
    formData.district,
    formData.postalCode,
    isLoggedIn,
    savedAddresses,
    selectedAddressId,
  ]);

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
    if (!appliedCoupon?.code || subtotal <= 0) return;

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

  useEffect(() => {
    if (effectiveCheckoutItems.length === 0 && appliedCoupon) {
      clearAppliedCoupon(false);
    }
  }, [appliedCoupon, clearAppliedCoupon, effectiveCheckoutItems.length]);

  useEffect(() => {
    if (effectiveCheckoutItems.length === 0) {
      setShippingFee(0);
      setShippingEstimate(null);
      return;
    }

    if (!String(formData.district || "").trim()) {
      setShippingFee(0);
      setShippingEstimate(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      estimateShipping(formData, true);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [effectiveCheckoutItems, estimateShipping, formData]);

  useEffect(() => {
    if (!settingsLoaded) {
      initiateCheckoutTrackedRef.current = false;
      return undefined;
    }

    if (effectiveCheckoutItems.length === 0) {
      initiateCheckoutTrackedRef.current = false;
      return undefined;
    }

    if (initiateCheckoutTrackedRef.current) return;

    const items = getDataLayerItems();
    if (!items.length || typeof window === "undefined") return undefined;

    const frame = window.requestAnimationFrame(() => {
      trackInitiateCheckout({
        ecommerce: {
          currency: getDataLayerCurrency(),
          value: Number(total || 0),
          coupon: appliedCoupon?.code || undefined,
          items,
        },
      });

      initiateCheckoutTrackedRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    appliedCoupon?.code,
    effectiveCheckoutItems.length,
    getDataLayerItems,
    settingsLoaded,
    total,
  ]);

  useEffect(() => {
    const beforeUnloadHandler = () => {
      captureAbandonedCheckout({ useBeacon: true });
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  }, [captureAbandonedCheckout]);

  useEffect(
    () => () => {
      captureAbandonedCheckout();
    },
    [captureAbandonedCheckout],
  );

  // Auto-sync incomplete order to database as soon as phone number is entered
  useEffect(() => {
    const rawPhone = normalizeBangladeshPhone(formData.phone);
    if (!isValidBangladeshPhone(rawPhone) || effectiveCheckoutItems.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      captureAbandonedCheckout();
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    captureAbandonedCheckout,
    effectiveCheckoutItems.length,
    formData.address,
    formData.alternativePhone,
    formData.email,
    formData.firstName,
    formData.fullName,
    formData.phone,
  ]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${baseUrl}/auth/payment-methods`);
      const rawMethods = Array.isArray(response.data) ? response.data : [];
      const methods = rawMethods.filter((method) =>
        ["manual", "cod", "sslcommerz", "bkash", "nagad"].includes(
          String(method?.channelType || "manual")
            .trim()
            .toLowerCase(),
        ),
      );

      // Sort payment methods so Cash On Delivery (COD) is always first
      methods.sort((a, b) => {
        const aCod =
          String(a?.channelType || "").trim().toLowerCase() === "cod" ||
          isCashOnDeliveryMethod(a?.name) ||
          isCashOnDeliveryMethod(a?.code);
        const bCod =
          String(b?.channelType || "").trim().toLowerCase() === "cod" ||
          isCashOnDeliveryMethod(b?.name) ||
          isCashOnDeliveryMethod(b?.code);
        if (aCod && !bCod) return -1;
        if (!aCod && bCod) return 1;
        return 0;
      });

      setPaymentMethods(methods);

      const codMethod = methods.find(
        (m) =>
          String(m?.channelType || "").trim().toLowerCase() === "cod" ||
          isCashOnDeliveryMethod(m?.name) ||
          isCashOnDeliveryMethod(m?.channelType) ||
          isCashOnDeliveryMethod(m?.code),
      );

      setSelectedPaymentMethodId((currentId) => {
        // Cash on delivery is ALWAYS the default payment method
        if (codMethod) {
          return String(codMethod._id);
        }
        const hasCurrentMethod = methods.some(
          (method) => String(method?._id || "") === String(currentId || ""),
        );

        if (hasCurrentMethod) {
          return String(currentId || "");
        }

        return String(methods[0]?._id || "");
      });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setPaymentMethods([]);
      setSelectedPaymentMethodId("");
      toast.error("Failed to load payment methods");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const districtOptions = useMemo(() => {
    if (!shippingZones || shippingZones.length === 0) {
      return BANGLADESH_DISTRICT_OPTIONS.map((district) => ({
        value: district,
        label: district,
      }));
    }

    return shippingZones.map((zone) => ({
      value: zone.name,
      label: zone.name,
    }));
  }, [shippingZones]);

  useEffect(() => {
    if (districtOptions.length > 0) {
      const exists = districtOptions.some((opt) => opt.value === formData.district);
      if (!exists) {
        setFormData((prev) => ({
          ...prev,
          district: districtOptions[0].value,
          city: districtOptions[0].value,
        }));
      }
    }
  }, [districtOptions, formData.district]);

  const handleSubmitOrder = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    const resolvedMethod = selectedPaymentMethod || paymentMethods[0] || null;
    const resolvedPaymentMethodValue =
      paymentMethodValue || normalizePaymentMethodValue(resolvedMethod);
    const resolvedRequiresProof =
      resolvedMethod?.requiresTransactionProof === undefined
        ? true
        : Boolean(resolvedMethod?.requiresTransactionProof);
    const resolvedChannelType = String(
      resolvedMethod?.channelType || "manual",
    ).toLowerCase();
    const resolvedAccountNo = String(
      resolvedMethod?.accountNo || resolvedMethod?.accountNumber || "",
    ).trim();
    const normalizedPhone = normalizeBangladeshPhone(formData.phone);

    if (effectiveCheckoutItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const trimmedFullName = String(
      formData.fullName || formData.firstName || "",
    ).trim();
    const nameParts = splitRecipientName(trimmedFullName);
    const resolvedFirstName =
      nameParts.firstName || trimmedFullName || String(formData.lastName || "").trim();
    const resolvedLastName =
      nameParts.lastName || String(formData.lastName || "").trim() || (resolvedFirstName ? "." : "");
    const resolvedEmail =
      String(formData.email || "").trim() ||
      `${normalizedPhone || "guest"}@customer.local`;
    const resolvedPostalCode =
      String(formData.postalCode || "N/A").trim() || "N/A";
    const resolvedCity =
      String(formData.city || formData.district || "Dhaka").trim();
    const resolvedDistrict = String(formData.district || "Dhaka").trim();

    if (!resolvedFirstName) {
      toast.error("Please enter your full name");
      const el = document.querySelector('input[name="fullName"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }

    if (!String(formData.phone || "").trim()) {
      toast.error("Please enter your phone number");
      const el = document.querySelector('input[name="phone"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }

    if (!isValidBangladeshPhone(normalizedPhone)) {
      toast.error("Please enter a valid 11-digit phone number (e.g. 01XXXXXXXXX)");
      const el = document.querySelector('input[name="phone"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }

    if (!String(formData.address || "").trim()) {
      toast.error("Please enter your full delivery address");
      const el = document.getElementById("checkout-delivery-address") || document.querySelector('textarea[name="address"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }

    if (!resolvedPaymentMethodValue) {
      toast.error("Please select a payment method");
      return;
    }

    if (resolvedRequiresProof && !transactionId.trim()) {
      toast.error("Transaction ID is required for this payment method");
      return;
    }

    if (!formData.agreeTerms) {
      toast.error("Please accept terms and conditions");
      return;
    }

    try {
      setLoading(true);

      if (appliedCoupon?.code) {
        const isCouponValid = await applyCoupon(appliedCoupon.code, true);
        if (!isCouponValid) {
          clearAppliedCoupon(false);
          toast.error("Applied coupon is no longer valid");
          return;
        }
      }

      const shippingResult = await estimateShipping(formData, false);

      if (!shippingResult.success) {
        return;
      }

      const estimatedShippingFee = Number(shippingResult.shippingFee || 0);
      const finalShippingFee = isFreeShippingCoupon ? 0 : estimatedShippingFee;
      const finalTotal = Math.max(subtotal + finalShippingFee - discount, 0);
      const attribution = getLandingAttribution();

      const payload = {
        sessionKey: getOrCreateCheckoutSessionKey(),
        shippingAddress: {
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          email: resolvedEmail,
          phone: normalizedPhone,
          alternativePhone: String(formData.alternativePhone || "").trim(),
          address: String(formData.address || "").trim(),
          city: resolvedCity,
          subCity: String(formData.subCity || "").trim(),
          district: resolvedDistrict,
          postalCode: resolvedPostalCode,
          country: "Bangladesh",
          notes: formData.notes || "",
        },
        items: effectiveCheckoutItems.map((item) => {
          const itemData = getItemData(item);
          return {
            product: itemData.productId,
            productId: itemData.productId,
            quantity: itemData.quantity,
            price: itemData.price,
            variationId: itemData.variationId || "",
            variationLabel: itemData.variationLabel || "",
            selectedVariants: itemData.selectedVariants || [],
            color: itemData.color,
            dimensions: itemData.dimensions,
            title: itemData.title,
          };
        }),
        subtotal,
        shippingFee: finalShippingFee,
        shippingMeta: shippingResult.shippingMeta,
        discount,
        total: finalTotal,
        couponCode: appliedCoupon?.code || "",
        source: attribution?.source || "shop",
        landingPageSlug: attribution?.slug || "",
        paymentMethodId: resolvedMethod?._id || "",
        paymentMethod: resolvedPaymentMethodValue,
        paymentDetails: {
          method: resolvedPaymentMethodValue,
          accountNo: resolvedAccountNo,
          transactionId: resolvedRequiresProof ? transactionId.trim() : "",
          sentTo: resolvedAccountNo,
          meta: {
            channelType: resolvedChannelType,
          },
        },
      };

      const endpoint = isLoggedIn ? "/orders" : "/orders/guest-checkout";
      const token = localStorage.getItem("token");

      const response = await axios.post(`${baseUrl}${endpoint}`, payload, {
        headers:
          isLoggedIn && token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Order failed");
      }

      const order = response.data.order;
      const paymentRedirectUrl = String(
        response.data?.paymentRedirectUrl || "",
      ).trim();
      hasPlacedOrderRef.current = true;

      if (!isLoggedIn && order) {
        const previous = JSON.parse(
          localStorage.getItem("guestOrders") || "[]",
        );
        localStorage.setItem(
          "guestOrders",
          JSON.stringify([order, ...previous]),
        );
        localStorage.setItem("lastOrder", JSON.stringify(order));
      }

      if (paymentRedirectUrl) {
        toast.success("Redirecting to payment gateway...");
        window.location.href = paymentRedirectUrl;
        return;
      }

      if (isBuyNow) {
        clearBuyNowItem();
        setBuyNowItemState(null);
      } else {
        await clearCart();
      }
      localStorage.removeItem(COUPON_STORAGE_KEY);
      localStorage.removeItem(ABANDONED_CHECKOUT_SESSION_KEY);
      setAppliedCoupon(null);
      clearLandingAttribution();

      toast.success("Order placed successfully");
      navigate("/thank-you", { state: { orderId: order?._id, order } });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (effectiveCheckoutItems.length === 0) {
    return (
      <section className="min-h-screen bg-[#f5f5f5] py-10">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
            <FiCreditCard className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-black">
            No products available for checkout
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
            Add products to your cart first, then return here to complete the
            order.
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="mt-6 inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Go to Shop
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f5f5f5] py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => {
            if (isBuyNow) {
              clearBuyNowItem();
              setBuyNowItemState(null);
              navigate(-1);
            } else {
              navigate("/cart");
            }
          }}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
        >
          <FiChevronLeft />
          {isBuyNow ? "Back" : "Back to cart"}
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
          <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-6">
            <div className={sectionCardClass}>
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                  <FiMapPin className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Customer & Delivery Details
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-black">
                    Personal & Delivery Information
                  </h2>
                </div>
              </div>

              {isLoggedIn && savedAddresses.length > 0 ? (
                <div className="mb-5 rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-black">
                        Saved address book
                      </p>
                      <p className="text-xs text-gray-500">
                        Pick a saved address to fill this checkout instantly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem(
                          "dashboardActiveTab",
                          "my-addresses",
                        );
                        navigate("/dashboard");
                      }}
                      className="inline-flex rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-black transition hover:border-black"
                    >
                      Manage Addresses
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {savedAddresses.map((address) => {
                      const isSelected =
                        String(selectedAddressId || "") ===
                        String(address?._id || "");

                      return (
                        <button
                          key={address._id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          className={`rounded-[22px] border p-4 text-left transition ${
                            isSelected
                              ? "border-black bg-white shadow-sm"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                              {address.label || "Address"}
                            </span>
                            {address.isDefault ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm font-semibold text-black">
                            {address.recipientName}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            {address.phone}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-gray-500">
                            {[
                              address.address,
                              address.subCity,
                              address.city,
                              address.district,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-800">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName || formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={inputClassName}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-800">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FiPhone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="01XXXXXXXXX"
                      className={`${inputClassName} pl-11`}
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-bold text-slate-800">
                    Delivery Area / District <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {districtOptions.map((opt) => {
                      const isSelected = (formData.district || "").toLowerCase() === (opt.value || "").toLowerCase();
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              district: opt.value,
                              city: opt.value,
                            }));
                          }}
                          className={`relative flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-600"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-all ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected ? (
                                <span className="h-2 w-2 rounded-full bg-white" />
                              ) : null}
                            </span>
                            <span className="font-bold">{opt.label}</span>
                          </div>
                          {isSelected && (
                            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-800">
                    Full Delivery Address (House / Road / Area) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="checkout-delivery-address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="House number, road number, area, etc. (e.g. House #12, Road #4, Dhanmondi)"
                    className={inputClassName}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-800">
                    Alternative Phone (Optional)
                  </label>
                  <div className="relative">
                    <FiPhone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      name="alternativePhone"
                      value={formData.alternativePhone}
                      onChange={handleInputChange}
                      placeholder="Alternative phone (optional)"
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-800">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@example.com (optional)"
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className={sectionCardClass}>
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FiCreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Payment Method
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                    Select Payment Method
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const methodValue = normalizePaymentMethodValue(method);
                  const methodIsCod = isCashOnDeliveryMethod(methodValue);
                  const methodIsGateway = isGatewayPaymentMethod(method);
                  const isSelected = selectedPaymentMethodId === String(method?._id || "");
                  const accountValue = String(
                    method?.accountNo || method?.accountNumber || "",
                  ).trim();
                  const methodRequiresProof =
                    method?.requiresTransactionProof === undefined
                      ? true
                      : Boolean(method?.requiresTransactionProof);

                  return (
                    <label
                      key={method._id}
                      className={`block cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedPaymentMethodId(String(method?._id || ""));
                          const nextMethod = normalizePaymentMethodValue(method);
                          pushDataLayerEvent("add_payment_info", {
                            ecommerce: {
                              currency: getDataLayerCurrency(),
                              value: Number(total || 0),
                              payment_type: nextMethod || undefined,
                              items: getDataLayerItems(),
                            },
                          });
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected ? (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            ) : null}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {methodValue}
                              </span>
                              {methodIsCod ? (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                                  Default / Cash on Delivery
                                </span>
                              ) : null}
                              {methodIsGateway ? (
                                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                                  Online Payment
                                </span>
                              ) : null}
                              {methodRequiresProof ? (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                  Manual Verification
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {methodIsCod
                                ? "📦 Pay with cash upon delivery of your order."
                                : methodIsGateway
                                  ? "Pay securely through our online payment gateway after placing order."
                                  : accountValue
                                    ? `Send payment to: ${accountValue}`
                                    : "Manual payment instructions."}
                            </p>
                          </div>
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/90 text-slate-700">
                          {methodIsCod ? (
                            <FiTruck className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <FiCreditCard className="h-5 w-5 text-slate-700" />
                          )}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {paymentMethods.length === 0 ? (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No payment method is available right now.
                </div>
              ) : null}

              {selectedPaymentMethod ? (
                requiresTransactionProof ? (
                  <div className="mt-4 space-y-2">
                    <input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Transaction ID*"
                      className={inputClassName}
                    />
                    <p className="text-xs leading-5 text-gray-500">
                      Add the wallet or bank transaction reference so admin can
                      verify this payment quickly.
                    </p>
                  </div>
                ) : selectedPaymentIsGateway ? (
                  <p className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs leading-5 text-sky-700">
                    You will be redirected to the secure payment gateway after placing
                    the order.
                  </p>
                ) : null
              ) : null}
            </div>
          </form>

          <div className="storefront-sticky-offset space-y-4 lg:sticky lg:self-start">
            <div className={sectionCardClass}>
              <h3 className="text-xl font-semibold text-gray-900">
                Order Summary
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Review live pricing before submission.
              </p>

              <div className="mt-5 space-y-3 max-h-108 overflow-auto pr-1">
                {effectiveCheckoutItems.map((item) => {
                  const itemData = getItemData(item);
                  const variantLines = getOrderItemVariantLines(itemData);
                  const colorSwatch = getOrderItemColorSwatch(itemData);
                  return (
                    <div
                      key={`${itemData.productId}-${itemData.variationId || ""}-${itemData.color || ""}-${itemData.dimensions || ""}-${itemData.selectedVariantSignature || ""}`}
                      className="flex gap-3 rounded-2xl border border-gray-100 bg-[#fafafa] p-3"
                    >
                      <ProductImage
                        src={itemData.image}
                        alt={itemData.title}
                        className="h-16 w-16 rounded-xl object-cover bg-gray-100"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-gray-900">
                          {itemData.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          <span>Qty: {itemData.quantity}</span>
                          {variantLines.length > 0 ? (
                            variantLines.map((line) => (
                              <span key={`${itemData.productId}-${line}`}>
                                {line}
                              </span>
                            ))
                          ) : itemData.variationLabel ? (
                            <span>Variant: {itemData.variationLabel}</span>
                          ) : null}
                          {colorSwatch ? (
                            <span className="inline-flex items-center rounded-full bg-gray-100 p-1">
                              <span
                                className="inline-block h-3 w-3 shrink-0 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor: colorSwatch,
                                  boxShadow:
                                    "inset 0 0 0 1px rgba(15,23,42,0.12)",
                                }}
                              />
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(resolveLiveCartLineTotal(item))}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-[#fafafa] px-4 py-3">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-black">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-[#fafafa] px-4 py-3">
                  <span className="text-gray-600">Shipping</span>
                  <div className="text-right">
                    <p className="font-medium text-black">
                      {shippingFeeStatusLabel}
                    </p>
                    <p className="text-[11px] leading-4 text-gray-500">
                      {shippingSourceLabel}
                    </p>
                  </div>
                </div>
                {isFreeShippingCoupon ? (
                  <div className="flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3">
                    <span className="text-green-700">Free delivery offer</span>
                    <span className="font-medium text-green-700">Applied</span>
                  </div>
                ) : null}
                {shippingMeta?.estimatedMaxDays > 0 ? (
                  <div className="flex items-center justify-between rounded-2xl bg-[#fafafa] px-4 py-3">
                    <span className="text-gray-600">Estimated delivery</span>
                    <span className="font-medium text-black">
                      {shippingMeta.estimatedMinDays > 0
                        ? `${shippingMeta.estimatedMinDays}-${shippingMeta.estimatedMaxDays} days`
                        : `${shippingMeta.estimatedMaxDays} days`}
                    </span>
                  </div>
                ) : null}



                {discount > 0 ? (
                  <div className="flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3">
                    <span className="text-green-700">Discount</span>
                    <span className="font-medium text-green-700">
                      -{formatCurrency(discount)}
                    </span>
                  </div>
                ) : null}

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900">
                        Total Amount
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {isCashOnDeliveryMethod(paymentMethodValue)
                          ? "Payable upon delivery"
                          : "Including VAT & Delivery"}
                      </p>
                    </div>
                    <span className="text-2xl font-black text-slate-950">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <label className="flex items-start gap-2.5 text-xs leading-5 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-black cursor-pointer"
                    />
                    <span>
                      I agree to the{" "}
                      <Link
                        to="/policy/terms"
                        target="_blank"
                        className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-600"
                      >
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/policy/privacy"
                        target="_blank"
                        className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-600"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  onClick={handleSubmitOrder}
                  disabled={loading || paymentMethods.length === 0}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-black px-6 py-4 text-base font-black text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing Order...
                    </>
                  ) : (
                    <span>{paymentActionLabel || "Confirm Order"}</span>
                  )}
                </button>

                {/* Trust Guarantees */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-[10px] font-semibold text-slate-600">
                  <div className="flex flex-col items-center gap-1">
                    <FiShield className="h-4 w-4 text-emerald-600" />
                    <span>100% Authentic</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <FiTruck className="h-4 w-4 text-blue-600" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Cash on Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckOut;
