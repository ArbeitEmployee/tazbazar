/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// pages/OrderTracking.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "@/lib/routing";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiChevronLeft,
  FiCopy,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiHome,
  FiShoppingBag,
  FiRotateCcw,
  FiAlertTriangle,
  FiRefreshCw,
  FiHelpCircle,
} from "react-icons/fi";
import {
  FaBox,
  FaShippingFast,
  FaReceipt,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { getFullImageUrl } from "../utils/cloudinary";
import {
  canSubmitCancellation,
  getCancellationActionLabel,
  getCancellationStatusTone,
} from "../utils/orderCancellation";
import {
  formatOrderEstimatedDeliveryDate,
  formatOrderEstimatedDeliveryLabel,
  getOrderItemColorSwatch,
  getOrderItemLineTotal,
  getOrderItemUnitPrice,
  getOrderItemVariantLines,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  formatShippingSourceLabel,
  shouldShowPaymentStatus,
} from "../utils/orderPresentation";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

// Image component with fallback (same as in CheckOut)
const ProductImage = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(getFullImageUrl(src, 600));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(getFullImageUrl(src, 600));
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
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center`}
      >
        <svg
          className="w-6 h-6 text-gray-400"
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
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt || "Product"}
      className={className}
      onError={handleError}
    />
  );
};

const ORDER_PROGRESS_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const OrderTracking = ({
  variant = "public",
  orderNumber: providedOrderNumber = "",
  onBack,
}) => {
  const { orderNumber: routeOrderNumber } = useParams();
  const navigate = useNavigate();
  const isDashboard = variant === "dashboard";
  const resolvedOrderNumber = String(
    providedOrderNumber || routeOrderNumber || "",
  ).trim();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnType, setReturnType] = useState("return");
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);

  // Separate Exchange state
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedExchangeItemIndex, setSelectedExchangeItemIndex] = useState(0);
  const [exchangeReason, setExchangeReason] = useState("");
  const [exchangeReplacementDetails, setExchangeReplacementDetails] = useState("");
  const [exchangeLoading, setExchangeLoading] = useState(false);

  const submitReturn = async () => {
    if (!order?.orderNumber) return;
    if (!returnReason.trim()) {
      toast.error("Please select or enter a reason.");
      return;
    }

    try {
      setReturnLoading(true);
      const response = await axios.post(
        `${baseUrl}/orders/track/${encodeURIComponent(order.orderNumber)}/return`,
        {
          type: returnType,
          reason: returnReason,
          description: returnDescription,
        },
      );

      if (response.data?.success) {
        setOrder(response.data.order);
        toast.success(
          response.data.message || "Request submitted successfully!",
        );
        setShowReturnModal(false);
        setReturnReason("");
        setReturnDescription("");
      } else {
        toast.error("Failed to submit return request");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit return request",
      );
    } finally {
      setReturnLoading(false);
    }
  };

  const submitExchange = async () => {
    if (!order?.orderNumber) return;
    if (!exchangeReason.trim()) {
      toast.error("Please select or enter an exchange reason.");
      return;
    }

    const chosenItem =
      order?.items?.[selectedExchangeItemIndex] || order?.items?.[0] || {};
    const exchangeItems = [
      {
        productId: chosenItem?.product?._id || chosenItem?.product?.id || null,
        title: chosenItem?.product?.title || "Product",
        quantity: chosenItem?.quantity || 1,
        originalVariant: chosenItem?.dimensions || chosenItem?.color || "",
        requestedVariant: exchangeReplacementDetails || "",
      },
    ];

    try {
      setExchangeLoading(true);
      const response = await axios.post(
        `${baseUrl}/orders/track/${encodeURIComponent(order.orderNumber)}/return`,
        {
          type: "exchange",
          reason: exchangeReason,
          description: exchangeReplacementDetails,
          exchangeItems,
        },
      );

      if (response.data?.success) {
        setOrder(response.data.order);
        toast.success(
          response.data.message || "Exchange request submitted successfully!",
        );
        setShowExchangeModal(false);
        setExchangeReason("");
        setExchangeReplacementDetails("");
      } else {
        toast.error("Failed to submit exchange request");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit exchange request",
      );
    } finally {
      setExchangeLoading(false);
    }
  };

  const submitTrackingLookup = () => {
    const value = String(trackingInput || "").trim();
    if (!value) {
      toast.error("Enter an order number or mobile number first.");
      return;
    }
    navigate(`/track-order/${encodeURIComponent(value)}`);
  };

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    navigate("/");
  };

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${baseUrl}/orders/track/${resolvedOrderNumber}`,
      );

      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order details. Please check the order number or mobile number.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resolvedOrderNumber) {
      setTrackingInput(resolvedOrderNumber);
      fetchOrderDetails();
    } else {
      setTrackingInput("");
      setOrder(null);
      setError("");
      setLoading(false);
    }
  }, [resolvedOrderNumber]);

  // Copy order number
  const copyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      toast.success("Order number copied!");
    }
  };

  const submitCancellation = async () => {
    if (!order?.orderNumber) return;

    try {
      setCancelLoading(true);
      const response = await axios.patch(
        `${baseUrl}/orders/track/${order.orderNumber}/cancel`,
        { reason: cancelReason },
      );

      if (response.data?.success) {
        setOrder(response.data.order);
        toast.success(
          response.data.message || "Cancellation request updated successfully",
        );
        setShowCancelModal(false);
        setCancelReason("");
      } else {
        toast.error("Failed to update cancellation");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update cancellation",
      );
    } finally {
      setCancelLoading(false);
    }
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          icon: FiClock,
          color: "#f59e0b",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
          message: "Order is pending confirmation",
        };
      case "confirmed":
        return {
          icon: FiCheckCircle,
          color: "#06b6d4",
          bgColor: "bg-cyan-50",
          textColor: "text-cyan-700",
          borderColor: "border-cyan-200",
          message: "Order has been confirmed",
        };
      case "processing":
        return {
          icon: FiPackage,
          color: "#3b82f6",
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
          message: "Order is being processed",
        };
      case "shipped":
        return {
          icon: FiTruck,
          color: "#8b5cf6",
          bgColor: "bg-purple-50",
          textColor: "text-purple-700",
          borderColor: "border-purple-200",
          message: "Order has been shipped",
        };
      case "delivered":
        return {
          icon: FiCheckCircle,
          color: "#10b981",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          borderColor: "border-green-200",
          message: "Order has been delivered",
        };
      case "cancelled":
        return {
          icon: FiXCircle,
          color: "#ef4444",
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          borderColor: "border-red-200",
          message: "Order has been cancelled",
        };
      case "returned":
        return {
          icon: FiXCircle,
          color: "#f97316",
          bgColor: "bg-orange-50",
          textColor: "text-orange-700",
          borderColor: "border-orange-200",
          message: "Order has been returned",
        };
      default:
        return {
          icon: FiPackage,
          color: "#6b7280",
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
          message: "Order status unknown",
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tracking Order
          </h3>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    if (!resolvedOrderNumber) {
      if (isDashboard) {
        return (
          <div className="w-full space-y-6 p-1 md:p-2">
            <div className="app-panel p-8 md:p-10">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-black"
              >
                <FiChevronLeft className="w-4 h-4" />
                Back to My Orders
              </button>
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-gray-500">
                  <FiPackage className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-black">
                  No order selected
                </h2>
                <p className="mt-3 text-sm text-gray-600">
                  Choose an order from My Orders to open its tracking view
                  inside the dashboard.
                </p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors group"
              >
                <FiChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">
                  {isDashboard ? "Back to My Orders" : "Back to Home"}
                </span>
              </button>

              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Order Tracking
                </p>
                <h1 className="mt-3 text-3xl font-black text-black">
                  Track Your Order
                </h1>
                <p className="mt-3 text-gray-600 leading-7">
                  Enter your Order ID or the Mobile Number used during checkout
                  to see live delivery progress and product details.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(event) => setTrackingInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitTrackingLookup();
                      }
                    }}
                    placeholder="Enter Order Number (ORD-...) or Phone (01XXXXXXXXX)"
                    className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={submitTrackingLookup}
                    className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                  >
                    Track Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      isDashboard ? (
        <div className="w-full space-y-6 p-1 md:p-2">
          <div className="app-panel p-8 md:p-10 text-center">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-black"
            >
              <FiChevronLeft className="w-4 h-4" />
              Back to My Orders
            </button>
            <div className="mt-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-gray-500">
                <FiPackage className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-3xl font-black text-gray-900">
                Order Not Found
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
                {error ||
                  "We couldn't find an order with that number. Please return to My Orders and try again."}
              </p>
            </div>
          </div>
        </div>
      ) : (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-6">ðŸ“¦</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Not Found
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {error ||
                "We couldn't find an order with that number. Please check the order number and try again."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <FiHome className="w-4 h-4" />
                Back to Home
              </button>
              <button
                onClick={() => navigate("/shop")}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <FiShoppingBag className="w-4 h-4" />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
      )
    );
  }

  const statusInfo = getStatusInfo(order.orderStatus);
  const StatusIcon = statusInfo.icon;
  const cancellation = order.cancellation || {};
  const showPaymentStatus = shouldShowPaymentStatus(order);
  const estimatedDeliveryLabel = formatOrderEstimatedDeliveryLabel(order);
  const estimatedDeliveryDate = formatOrderEstimatedDeliveryDate(order);
  const shippingSourceLabel = formatShippingSourceLabel(order);

  return (
    <div className={isDashboard ? "w-full space-y-6 p-1 md:p-2" : "min-h-screen bg-gray-50 py-8 md:py-12"}>
      <div className={isDashboard ? "space-y-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        {!isDashboard && (
          <div className="mb-8">
            <button
              onClick={handleBack}
              className="group mb-6 flex items-center gap-2 text-gray-600 transition-colors hover:text-black"
            >
              <FiChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Back to Home</span>
            </button>

            <div className="mb-8 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                <StatusIcon
                  className="w-8 h-8"
                  style={{ color: statusInfo.color }}
                />
              </div>
              <h1 className="mb-3 mt-4 text-2xl font-bold text-black sm:text-3xl md:text-4xl">
                Order Tracking
              </h1>
              <div className="flex items-center justify-center gap-4">
                <p className="text-gray-600">
                  Tracking order:{" "}
                  <span className="font-semibold text-black">
                    {order.orderNumber}
                  </span>
                </p>
                <button
                  onClick={copyOrderNumber}
                  className="rounded p-1 transition-colors hover:bg-gray-200"
                  title="Copy order number"
                >
                  <FiCopy className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Tracking & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.bgColor}`}
                  >
                    <StatusIcon className={`w-6 h-6 ${statusInfo.textColor}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-black">
                      Order Status
                    </h2>
                    <p className="text-gray-600">{statusInfo.message}</p>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-full font-medium ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`}
                >
                  {order.orderStatus.toUpperCase()}
                </span>
              </div>

              {/* Tracking Timeline */}
              <div className="relative">
                {/* Timeline bar FIRST - naturally behind content */}
                <div className="absolute left-6 right-6 top-6 z-0 h-1">
                  <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
                  <div
                    className="absolute h-full bg-black rounded-full transition-all duration-500"
                    style={{
                      width: (() => {
                        if (order.orderStatus === "cancelled") return "0%";
                        if (order.orderStatus === "returned") return "100%";
                        const currentIndex = ORDER_PROGRESS_STATUSES.indexOf(
                          order.orderStatus,
                        );
                        if (currentIndex <= 0) return "0%";
                        const maxIndex = Math.max(
                          1,
                          ORDER_PROGRESS_STATUSES.length - 1,
                        );
                        return `${(currentIndex / maxIndex) * 100}%`;
                      })(),
                    }}
                  ></div>
                </div>

                {/* Icons container - appears on top naturally */}
                <div className="relative z-10 flex items-center justify-between">
                  {ORDER_PROGRESS_STATUSES.map((status, index) => {
                    const isActive = (() => {
                      const currentIndex = ORDER_PROGRESS_STATUSES.indexOf(
                        order.orderStatus,
                      );
                      return order.orderStatus === "cancelled"
                        ? false
                        : order.orderStatus === "returned"
                          ? true
                          : index <= currentIndex;
                    })();

                    const stepStatusInfo = getStatusInfo(status);
                    const StepIcon = stepStatusInfo.icon;

                    return (
                      <div key={status} className="relative z-10 text-center">
                        <div
                          className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                            isActive
                              ? "bg-black shadow-lg"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          <StepIcon
                            className={`w-5 h-5 ${
                              isActive ? "text-white" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            isActive ? "text-black" : "text-gray-500"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Array.isArray(order.statusTimeline) &&
              order.statusTimeline.length > 0 ? (
                <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold text-black mb-3">
                    Status Timeline
                  </h3>
                  <div className="space-y-2">
                    {order.statusTimeline
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a?.changedAt || 0).getTime() -
                          new Date(b?.changedAt || 0).getTime(),
                      )
                      .map((entry, index) => (
                        <div
                          key={`${entry?.status || "status"}-${index}`}
                          className="bg-white border border-gray-200 rounded-md px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-black uppercase">
                              {entry?.status || "-"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {entry?.changedAt
                                ? new Date(entry.changedAt).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                          {entry?.note ? (
                            <p className="text-xs text-gray-600 mt-1">
                              {entry.note}
                            </p>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </motion.div>

            {order.cancellation ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6"
              >
                <div
                  className={`rounded-2xl border p-4 ${getCancellationStatusTone(
                    cancellation,
                  )}`}
                >
                  <h3 className="text-base font-semibold">
                    {getCancellationActionLabel(cancellation)}
                  </h3>
                  <p className="mt-2 text-sm">
                    {cancellation.disabledReason ||
                      (cancellation.actionType === "request_cancel"
                        ? "Paid orders need admin approval before they can be cancelled."
                        : "You can cancel this order directly while the active cancellation window lasts.")}
                  </p>
                  {cancellation.showExpiryInfo && cancellation.expiresAt ? (
                    <p className="mt-2 text-sm">
                      {cancellation.expiryLabel ||
                        "Cancellation window ends on"}{" "}
                      {formatDate(cancellation.expiresAt)}
                    </p>
                  ) : null}
                  {cancellation.requestReason ? (
                    <p className="mt-2 text-sm">
                      Reason: {cancellation.requestReason}
                    </p>
                  ) : null}
                  {cancellation.resolutionNote ? (
                    <p className="mt-2 text-sm">
                      Admin note: {cancellation.resolutionNote}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      disabled={!canSubmitCancellation(cancellation)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        canSubmitCancellation(cancellation)
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-white/80 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {getCancellationActionLabel(cancellation)}
                    </button>
                    <a
                      href="/policy/cancellation"
                      className="rounded-lg border border-current px-4 py-2 text-sm font-medium"
                    >
                      Read policy
                    </a>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {order.returnRequest && order.returnRequest.status !== "none" ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6"
              >
                <div
                  className={`rounded-2xl border p-4 ${
                    order.returnRequest.status === "approved"
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                      : order.returnRequest.status === "rejected"
                        ? "border-rose-200 bg-rose-50/80 text-rose-900"
                        : "border-amber-200 bg-amber-50/80 text-amber-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      {order.returnRequest.type === "exchange" ||
                      order.returnRequest.type === "replacement" ? (
                        <FiRefreshCw className="w-5 h-5 text-indigo-600" />
                      ) : order.returnRequest.type === "report_issue" ? (
                        <FiAlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <FiRotateCcw className="w-5 h-5 text-rose-600" />
                      )}
                      {order.returnRequest.type === "report_issue"
                        ? "Issue Report"
                        : order.returnRequest.type === "exchange" ||
                            order.returnRequest.type === "replacement"
                          ? "Product Exchange Request"
                          : "Return Request"}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${
                        order.returnRequest.status === "approved"
                          ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                          : order.returnRequest.status === "rejected"
                            ? "bg-rose-100 border-rose-300 text-rose-800"
                            : "bg-amber-100 border-amber-300 text-amber-800"
                      }`}
                    >
                      {order.returnRequest.status === "pending"
                        ? "Under Review"
                        : order.returnRequest.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium">
                    Reason: {order.returnRequest.reason}
                  </p>

                  {order.returnRequest.exchangeItems &&
                  order.returnRequest.exchangeItems.length > 0 ? (
                    <div className="mt-3 p-3 rounded-xl bg-white/90 border border-current/10 text-xs">
                      <span className="font-bold block mb-1">Exchange Product:</span>
                      {order.returnRequest.exchangeItems.map((ex, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <p className="font-semibold text-gray-900">• {ex.title}</p>
                          {ex.originalVariant ? (
                            <p className="text-gray-600">Original variant: {ex.originalVariant}</p>
                          ) : null}
                          {ex.requestedVariant ? (
                            <p className="text-indigo-700 font-medium">
                              Requested replacement: {ex.requestedVariant}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {order.returnRequest.description &&
                  (!order.returnRequest.exchangeItems ||
                    order.returnRequest.exchangeItems.length === 0) ? (
                    <p className="mt-1 text-xs text-gray-600">
                      Details: {order.returnRequest.description}
                    </p>
                  ) : null}

                  {order.returnRequest.requestedAt ? (
                    <p className="mt-2 text-xs opacity-75">
                      Submitted on: {formatDate(order.returnRequest.requestedAt)}
                    </p>
                  ) : null}

                  {order.returnRequest.resolutionNote ? (
                    <div className="mt-3 p-3 rounded-xl bg-white/80 border border-current/10 text-xs">
                      <span className="font-bold block mb-0.5">Admin Resolution Note:</span>
                      {order.returnRequest.resolutionNote}
                    </div>
                  ) : null}

                  {order.returnRequest.status === "rejected" ? (
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setReturnType("return");
                          setShowReturnModal(true);
                        }}
                        className="text-xs font-bold underline hover:opacity-80"
                      >
                        Submit new return
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowExchangeModal(true)}
                        className="text-xs font-bold underline text-indigo-700 hover:opacity-80"
                      >
                        Submit new exchange
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}

            {/* Order Details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaReceipt className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-black">
                  Order Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-medium text-black mb-3 flex items-center gap-2">
                    <FaUser className="w-4 h-4 text-gray-500" />
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-600">Name:</span>{" "}
                      <span className="font-medium">{order.customerName}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Order Date:</span>{" "}
                      <span className="font-medium">
                        {formatDate(order.createdAt)}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Order Number:</span>{" "}
                      <span className="font-medium">{order.orderNumber}</span>
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="font-medium text-black mb-3 flex items-center gap-2">
                    <FaReceipt className="w-4 h-4 text-gray-500" />
                    Payment Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-600">Method:</span>{" "}
                      <span className="font-medium capitalize">
                        {formatPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </p>
                    {showPaymentStatus ? (
                      <p className="text-sm">
                        <span className="text-gray-600">Status:</span>{" "}
                        <span
                          className={`font-medium ${
                            order.paymentStatus === "completed"
                              ? "text-green-600"
                              : order.paymentStatus === "pending"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {formatPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Cash on Delivery is collected when the order reaches the
                        customer.
                      </p>
                    )}
                    {order.transactionId && order.transactionId !== "N/A" && (
                      <p className="text-sm">
                        <span className="text-gray-600">Transaction ID:</span>{" "}
                        <span className="font-medium">
                          {order.transactionId}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6"
            >
              <h2 className="text-xl font-semibold text-black mb-6">
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => {
                  const displayColor = getOrderItemColorSwatch(item);
                  const variantLines = getOrderItemVariantLines(item);
                  return (
                    <div
                      key={index}
                      className="flex gap-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {item.product?.image ? (
                          <ProductImage
                            src={item.product.images?.[0] || item.product.image}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiPackage className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.product?.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </div>
                          {variantLines.map((line) => (
                            <div
                              key={`${item.product?.title || "product"}-${line}`}
                              className="text-sm text-gray-600"
                            >
                              {line}
                            </div>
                          ))}
                          {displayColor && (
                            <div className="inline-flex items-center rounded-full bg-gray-100 p-1">
                              <span
                                className="inline-block h-3 w-3 shrink-0 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor: displayColor,
                                  boxShadow:
                                    "inset 0 0 0 1px rgba(15,23,42,0.12)",
                                }}
                              />
                            </div>
                          )}
                          {item.dimensions && (
                            <div className="text-sm text-gray-600">
                              dimensions: {item.dimensions}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Unit Price: Tk{" "}
                            {getOrderItemUnitPrice(item).toFixed(2)}
                          </div>
                          <div className="font-semibold">
                            Tk {getOrderItemLineTotal(item).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <div className="w-64 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>Tk {order.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1 rounded-lg bg-gray-50 px-3 py-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span>
                          {order.shippingFee > 0
                            ? `Tk ${order.shippingFee?.toFixed(2)}`
                            : "FREE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {shippingSourceLabel}
                      </p>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span>-Tk {order.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    {order.couponCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coupon:</span>
                        <span>{order.couponCode}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>Tk {order.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Shipping & Actions */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaMapMarkerAlt className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-black">
                  Shipping Address
                </h2>
              </div>

              <div className="space-y-3">
                <p className="font-medium">
                  {order.shippingAddress?.firstName}{" "}
                  {order.shippingAddress?.lastName}
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress?.address}
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress?.city},{" "}
                  {order.shippingAddress?.district}
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress?.postalCode},{" "}
                  {order.shippingAddress?.country}
                </p>
                <p className="text-gray-600">
                  Shipping source: {shippingSourceLabel}
                </p>
                {order.shippingAddress?.phone && (
                  <div className="flex items-center gap-2 mt-4">
                    <FaPhone className="w-4 h-4 text-gray-500" />
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                )}
                {order.shippingAddress?.email && (
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="w-4 h-4 text-gray-500" />
                    <span>{order.shippingAddress.email}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6"
            >
              <h3 className="text-lg font-semibold text-black mb-4">
                Order Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Date</span>
                  <span className="font-medium">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Delivery</span>
                  <div className="text-right">
                    <p className="font-medium">{estimatedDeliveryDate}</p>
                    {estimatedDeliveryLabel !== "To be confirmed" ? (
                      <p className="text-xs text-gray-500">
                        {estimatedDeliveryLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium">{order.items?.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold text-lg">
                    Tk {order.total?.toFixed(2)}
                  </span>
                </div>
              </div>

              {(order.courier?.consignmentId ||
                order.courier?.trackingNumber ||
                order.courier?.providerName) && (
                <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Courier</span>
                    <span className="font-medium">
                      {order.courier?.providerName || "Courier"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Consignment</span>
                    <span className="font-medium">
                      {order.courier?.consignmentId || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tracking No</span>
                    <span className="font-medium">
                      {order.courier?.trackingNumber || "N/A"}
                    </span>
                  </div>
                  {order.courier?.trackingUrl ? (
                    <a
                      href={order.courier.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-700 underline"
                    >
                      Open Courier Tracking
                    </a>
                  ) : null}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-2.5">
                {order.orderStatus === "delivered" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExchangeItemIndex(0);
                        setShowExchangeModal(true);
                      }}
                      className={`w-full py-2.5 px-3 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        order.returnRequest?.status === "pending" &&
                        order.returnRequest?.type === "exchange"
                          ? "border border-indigo-300 bg-indigo-50 text-indigo-700"
                          : order.returnRequest?.status === "approved" &&
                              order.returnRequest?.type === "exchange"
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                      }`}
                    >
                      <FiRefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {order.returnRequest?.status === "pending" &&
                        order.returnRequest?.type === "exchange"
                          ? "Exchange (Pending)"
                          : "Exchange"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReturnType("return");
                        setShowReturnModal(true);
                      }}
                      className={`w-full py-2.5 px-3 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        order.returnRequest?.status === "pending" &&
                        order.returnRequest?.type !== "exchange"
                          ? "border border-amber-300 bg-amber-50 text-amber-800"
                          : order.returnRequest?.status === "approved" &&
                              order.returnRequest?.type !== "exchange"
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]"
                      }`}
                    >
                      <FiRotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {order.returnRequest?.status === "pending" &&
                        order.returnRequest?.type !== "exchange"
                          ? "Return (Pending)"
                          : "Return / Report"}
                      </span>
                    </button>
                  </div>
                ) : null}

                {canSubmitCancellation(cancellation) ? (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 border border-red-200 text-red-600 font-bold rounded-xl text-xs hover:bg-red-50 transition-colors"
                  >
                    {getCancellationActionLabel(cancellation)}
                  </button>
                ) : null}

                <button
                  onClick={() => navigate("/shop")}
                  className="w-full py-2.5 bg-black text-white font-bold rounded-xl text-xs hover:bg-gray-800 transition-colors"
                >
                  Continue Shopping
                </button>

                <button
                  onClick={handleBack}
                  className="w-full py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 transition-colors"
                >
                  {isDashboard ? "Back to My Orders" : "Back to Home"}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 app-layer-modal flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white p-6"
          >
            <h3 className="text-xl font-bold text-black">
              {cancellation.actionType === "request_cancel"
                ? "Request order cancellation"
                : "Cancel order"}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {cancellation.actionType === "request_cancel"
                ? "This order has a completed payment, so your cancellation needs admin approval."
                : "This order will be cancelled immediately if you continue."}
            </p>

            <label className="mt-5 block text-sm font-medium text-gray-700">
              Reason for cancellation
            </label>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Add a cancellation reason (optional)"
              rows={4}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <a
                href="/policy/cancellation"
                className="text-sm font-medium text-gray-600 underline"
              >
                Read cancellation policy
              </a>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  disabled={cancelLoading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={submitCancellation}
                  disabled={cancelLoading}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {cancelLoading
                    ? "Submitting..."
                    : getCancellationActionLabel(cancellation)}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Return / Report Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 app-layer-modal flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xl font-bold text-black flex items-center gap-2">
                <FiRotateCcw className="text-amber-500" />
                Return or Report Issue
              </h3>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-600">
              For order <span className="font-semibold text-black">{order.orderNumber}</span>. Please select whether you want to return or report a problem.
            </p>

            {/* Request Type Selector */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Request Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "return", label: "Return & Refund (রিটার্ন ও রিফান্ড)" },
                  { value: "report_issue", label: "Report Issue / Dispute (অভিযোগ)" },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setReturnType(t.value)}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                      returnType === t.value
                        ? "border-black bg-black text-white shadow-sm"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Common Reasons */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Reason
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-medium text-black outline-none focus:border-black focus:bg-white"
              >
                <option value="">-- Select a reason --</option>
                <option value="Damaged / Broken item received">Damaged / Broken item received (ক্ষতিগ্রস্ত পণ্য)</option>
                <option value="Wrong product delivered">Wrong product delivered (ভুল পণ্য ডেলিভারি হয়েছে)</option>
                <option value="Defective or not functioning">Defective or not functioning (ত্রুটিপূর্ণ/কাজ করছে না)</option>
                <option value="Missing parts / Incomplete package">Missing parts / Incomplete package (পার্টস বা আইটেম নেই)</option>
                <option value="Product does not match description">Product does not match description (বিবরণের সাথে অমিল)</option>
                <option value="Delivery or rider issue">Delivery or rider issue (ডেলিভারি সংক্রান্ত অভিযোগ)</option>
                <option value="Other reason">Other reason (অন্যান্য কারণ)</option>
              </select>
            </div>

            {/* Detailed Description */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Details / Description (Optional)
              </label>
              <textarea
                value={returnDescription}
                onChange={(event) => setReturnDescription(event.target.value)}
                placeholder="Describe what went wrong or how we can help you..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none transition focus:border-black"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason("");
                  setReturnDescription("");
                }}
                disabled={returnLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReturn}
                disabled={returnLoading || !returnReason.trim()}
                className="rounded-lg bg-black px-5 py-2 text-xs font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {returnLoading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dedicated Exchange Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 app-layer-modal flex items-center justify-center bg-black/50 p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xl font-bold text-black flex items-center gap-2">
                <FiRefreshCw className="text-indigo-600" />
                Product Exchange (পণ্য পরিবর্তন)
              </h3>
              <button
                type="button"
                onClick={() => setShowExchangeModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-600">
              Select the product from order <span className="font-semibold text-black">{order.orderNumber}</span> you wish to exchange.
            </p>

            {/* Product Selector */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                1. Select Item to Exchange
              </label>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {order.items?.map((item, idx) => {
                  const isSelected = selectedExchangeItemIndex === idx;
                  const displayColor = getOrderItemColorSwatch(item);
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedExchangeItemIndex(idx)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                          : "border-gray-200 bg-gray-50/50 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="exchangeItem"
                        checked={isSelected}
                        onChange={() => setSelectedExchangeItemIndex(idx)}
                        className="accent-indigo-600 h-4 w-4 shrink-0"
                      />
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {item.product?.image ? (
                          <ProductImage
                            src={item.product.images?.[0] || item.product.image}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiPackage className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {item.product?.title}
                        </p>
                        <p className="text-[11px] text-gray-600">
                          Qty: {item.quantity}
                          {item.dimensions ? ` | Dim: ${item.dimensions}` : ""}
                          {item.color ? ` | Color: ${item.color}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exchange Reason */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                2. Reason for Exchange
              </label>
              <select
                value={exchangeReason}
                onChange={(e) => setExchangeReason(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-medium text-black outline-none focus:border-indigo-600 focus:bg-white"
              >
                <option value="">-- Select an exchange reason --</option>
                <option value="Size issue - Need larger/smaller size">Size issue - Need larger/smaller size (সাইজ পরিবর্তন প্রয়োজন)</option>
                <option value="Color issue - Want different color">Color issue - Want different color (রং পরিবর্তন করতে চাই)</option>
                <option value="Defective or damaged product replacement">Defective or damaged item (ত্রুটিপূর্ণ পণ্যের পরিবর্তন)</option>
                <option value="Wrong product received">Wrong product received (ভুল পণ্য পাঠানো হয়েছে)</option>
                <option value="Other exchange reason">Other exchange reason (অন্যান্য কারণ)</option>
              </select>
            </div>

            {/* Requested Replacement Details */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                3. Requested Replacement Details
              </label>
              <textarea
                value={exchangeReplacementDetails}
                onChange={(e) => setExchangeReplacementDetails(e.target.value)}
                placeholder="Specify desired size, color, or replacement instructions (e.g. Please replace with Size XL in Black color)..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none transition focus:border-indigo-600"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowExchangeModal(false);
                  setExchangeReason("");
                  setExchangeReplacementDetails("");
                }}
                disabled={exchangeLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitExchange}
                disabled={exchangeLoading || !exchangeReason.trim()}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {exchangeLoading ? "Submitting..." : "Submit Exchange Request"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
