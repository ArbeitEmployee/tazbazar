import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiEdit3,
  FiPackage,
  FiPhone,
  FiUser,
  FiMapPin,
  FiExternalLink,
} from "react-icons/fi";
import { dashboardSecondaryButtonClass } from "../utils/dashboardFormStyles";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getStatusBadge = (status) => {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const AdminManageExchange = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const limit = 20;

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      let url = `${baseUrl}/orders/admin/all?isExchange=1&page=${page}&limit=${limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (statusFilter !== "all") {
        url += `&returnStatus=${statusFilter}`;
      }

      const { data } = await axios.get(url, { headers: getAuthHeaders() });
      setOrders(data?.orders || data?.data || []);
      setTotal(
        data?.pagination?.totalOrders ??
          data?.totalOrders ??
          data?.orders?.length ??
          0,
      );
    } catch (error) {
      console.error("Failed to load exchange requests:", error);
      toast.error(
        error.response?.data?.message || "Failed to load exchange orders",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExchanges();
  };

  const handleReview = async (action) => {
    if (!reviewOrder?._id) return;
    try {
      setIsSubmittingReview(true);
      const res = await axios.patch(
        `${baseUrl}/orders/admin/${reviewOrder._id}/return`,
        {
          action,
          resolutionNote,
        },
        { headers: getAuthHeaders() },
      );

      if (res.data?.success) {
        toast.success(
          action === "approve"
            ? "Exchange request approved!"
            : "Exchange request rejected",
        );
        setReviewModalOpen(false);
        setReviewOrder(null);
        setResolutionNote("");
        fetchExchanges();
      } else {
        toast.error("Failed to update exchange request");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to review exchange request",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiRefreshCw className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Manage Exchange
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            View & review all product exchange requests submitted by customers from the website. ({total} total)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, phone..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none transition"
            />
          </form>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              fetchExchanges();
            }}
            className={`${dashboardSecondaryButtonClass} flex items-center gap-1.5 text-xs py-2`}
          >
            <FiRefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "All Exchanges", value: "all" },
          { label: "Pending Review", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              statusFilter === tab.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exchange Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading exchange requests...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <FiPackage className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-base text-slate-800">No exchange requests found</p>
            <p className="text-xs text-slate-400 mt-1">
              Customer exchange submissions from the track order page will appear here.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const returnReq = order.returnRequest || order.returnMeta || {};
            const exchangeItems = returnReq.exchangeItems || [];
            const reqStatus = returnReq.status || (order.isExchange ? "approved" : "none");

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${getStatusBadge(
                          reqStatus,
                        )}`}
                      >
                        {reqStatus === "pending"
                          ? "Pending Review"
                          : reqStatus === "approved"
                            ? "Approved"
                            : reqStatus === "rejected"
                              ? "Rejected"
                              : reqStatus}
                      </span>
                      {order.orderStatus ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">
                          Order: {order.orderStatus}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-400">
                      Ordered: {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                      {returnReq.requestedAt ? ` | Requested: ${new Date(returnReq.requestedAt).toLocaleString()}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {reqStatus === "pending" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewOrder(order);
                          setResolutionNote(returnReq.resolutionNote || "");
                          setReviewModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
                      >
                        <FiEdit3 size={13} /> Review Request
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewOrder(order);
                          setResolutionNote(returnReq.resolutionNote || "");
                          setReviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                      >
                        Edit Note / Status
                      </button>
                    )}

                    <a
                      href={`/track-order/${order.orderNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition flex items-center gap-1"
                    >
                      <FiExternalLink size={12} /> View Tracking
                    </a>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
                  {/* Customer Info */}
                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                      <FiUser className="text-slate-500" /> Customer Details
                    </p>
                    <p className="font-medium text-slate-800">
                      {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                    </p>
                    <p className="flex items-center gap-1">
                      <FiPhone className="text-slate-400" /> {order.shippingAddress?.phone || "N/A"}
                    </p>
                    <p className="flex items-start gap-1">
                      <FiMapPin className="text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {order.shippingAddress?.address}, {order.shippingAddress?.city}
                      </span>
                    </p>
                  </div>

                  {/* Exchange Item Info */}
                  <div className="space-y-2 bg-indigo-50/40 border border-indigo-100 p-3 rounded-xl lg:col-span-2">
                    <p className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                      <FiRefreshCw className="text-indigo-600" /> Exchange Details
                    </p>

                    <div className="space-y-1.5 text-xs">
                      <p>
                        <span className="text-slate-500 font-medium">Reason:</span>{" "}
                        <span className="font-semibold text-slate-900">{returnReq.reason || "Exchange"}</span>
                      </p>

                      {exchangeItems.length > 0 ? (
                        <div className="bg-white p-2.5 rounded-lg border border-indigo-100 space-y-1.5">
                          {exchangeItems.map((ex, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                              <div>
                                <span className="font-bold text-slate-900">{ex.title}</span>
                                {ex.originalVariant ? (
                                  <span className="text-slate-500 ml-1.5">(Orig: {ex.originalVariant})</span>
                                ) : null}
                              </div>
                              {ex.requestedVariant ? (
                                <div className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  Wanted: {ex.requestedVariant}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600">
                          {returnReq.description ? (
                            <p><span className="text-slate-500">Note:</span> {returnReq.description}</p>
                          ) : (
                            <p>Manual exchange order</p>
                          )}
                        </div>
                      )}

                      {returnReq.resolutionNote ? (
                        <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs">
                          <span className="font-bold text-slate-700">Admin Note:</span> {returnReq.resolutionNote}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FiRefreshCw className="text-indigo-600" />
                Review Exchange Request: {reviewOrder.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Customer Reason:</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {reviewOrder.returnRequest?.reason || "Not specified"}
                </p>
              </div>

              {reviewOrder.returnRequest?.exchangeItems?.map((ex, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800">{ex.title}</p>
                  <p className="text-slate-500">Original: {ex.originalVariant || "Standard"}</p>
                  <p className="text-indigo-600 font-bold mt-0.5">
                    Requested Replacement: {ex.requestedVariant || "N/A"}
                  </p>
                </div>
              ))}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Admin Resolution Note for Customer
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Exchange approved. Our rider will collect the old item and deliver the replacement size L."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                disabled={isSubmittingReview}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview("reject")}
                disabled={isSubmittingReview}
                className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => handleReview("approve")}
                disabled={isSubmittingReview}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
              >
                {isSubmittingReview ? "Saving..." : "Approve Exchange"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageExchange;
