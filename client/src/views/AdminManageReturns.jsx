import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiRotateCcw,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEdit3,
  FiPackage,
  FiPhone,
  FiUser,
  FiMapPin,
  FiAlertTriangle,
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

const AdminManageReturns = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const limit = 20;

  const fetchReturns = async () => {
    try {
      setLoading(true);
      let url = `${baseUrl}/orders/admin/all?isReturn=1&page=${page}&limit=${limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (statusFilter !== "all") {
        url += `&returnStatus=${statusFilter}`;
      }
      if (typeFilter !== "all") {
        url += `&returnType=${typeFilter}`;
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
      console.error("Failed to load return requests:", error);
      toast.error(
        error.response?.data?.message || "Failed to load return requests",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReturns();
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
            ? "Request approved successfully!"
            : "Request rejected",
        );
        setReviewModalOpen(false);
        setReviewOrder(null);
        setResolutionNote("");
        fetchReturns();
      } else {
        toast.error("Failed to update request");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to review request",
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
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <FiRotateCcw className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Manage Returns & Reports
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            View & resolve customer return/refund and issue dispute requests from the website. ({total} total)
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
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none transition"
            />
          </form>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              fetchReturns();
            }}
            className={`${dashboardSecondaryButtonClass} flex items-center gap-1.5 text-xs py-2`}
          >
            <FiRotateCcw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "All Status", value: "all" },
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
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "All Types", value: "all" },
            { label: "Return & Refund", value: "return" },
            { label: "Issue Reports", value: "report_issue" },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setTypeFilter(t.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                typeFilter === t.value
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Returns List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <FiRotateCcw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-500" />
            Loading return requests...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <FiPackage className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-base text-slate-800">No return requests found</p>
            <p className="text-xs text-slate-400 mt-1">
              Customer return requests and dispute submissions will appear here.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const returnReq = order.returnRequest || order.returnMeta || {};
            const reqStatus = returnReq.status || "none";
            const isDispute = returnReq.type === "report_issue";

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
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isDispute ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {isDispute ? "Issue Report" : "Return & Refund"}
                      </span>
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
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition flex items-center gap-1.5 shadow-sm"
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

                  {/* Return Details */}
                  <div className="space-y-2 bg-amber-50/30 border border-amber-100 p-3 rounded-xl lg:col-span-2">
                    <p className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                      {isDispute ? <FiAlertTriangle className="text-rose-600" /> : <FiRotateCcw className="text-amber-600" />}
                      {isDispute ? "Dispute / Complaint" : "Return Request Details"}
                    </p>

                    <div className="space-y-1.5 text-xs">
                      <p>
                        <span className="text-slate-500 font-medium">Reason:</span>{" "}
                        <span className="font-semibold text-slate-900">{returnReq.reason || "Not specified"}</span>
                      </p>

                      {returnReq.description ? (
                        <div className="bg-white p-2.5 rounded-lg border border-amber-100 text-slate-700">
                          <span className="font-semibold text-slate-900 block mb-0.5">Customer Description:</span>
                          {returnReq.description}
                        </div>
                      ) : null}

                      {returnReq.resolutionNote ? (
                        <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs">
                          <span className="font-bold text-slate-700">Admin Resolution Note:</span> {returnReq.resolutionNote}
                        </div>
                      ) : null}

                      <div className="pt-1 flex items-center gap-3 text-slate-500">
                        <span>Order Total: <strong className="text-slate-900">৳{order.total}</strong></span>
                        <span>Items: <strong className="text-slate-900">{order.items?.length || 0}</strong></span>
                        <span>Payment: <strong className="text-slate-900 capitalize">{order.paymentStatus}</strong></span>
                      </div>
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
                <FiRotateCcw className="text-amber-600" />
                Review Request: {reviewOrder.orderNumber}
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
                <span className="text-slate-500 font-medium">Type & Reason:</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  [{reviewOrder.returnRequest?.type === "report_issue" ? "Report Issue" : "Return & Refund"}]{" "}
                  {reviewOrder.returnRequest?.reason || "N/A"}
                </p>
              </div>

              {reviewOrder.returnRequest?.description ? (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium block mb-1">Customer Note:</span>
                  <p className="text-slate-800">{reviewOrder.returnRequest.description}</p>
                </div>
              ) : null}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Admin Resolution Note for Customer
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Return approved. Please keep package ready for pickup / refund has been processed."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-amber-500"
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
                className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition shadow-sm"
              >
                {isSubmittingReview ? "Saving..." : "Approve Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageReturns;
