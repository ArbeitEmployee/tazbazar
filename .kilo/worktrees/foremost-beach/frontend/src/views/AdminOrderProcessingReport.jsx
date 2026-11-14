"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiTruck,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiRotateCcw,
} from "react-icons/fi";
import {
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  getOrderCustomerProfile,
} from "../utils/orderPresentation";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const ORDER_STATUS_META = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
    icon: FiClock,
    blurb: "Awaiting confirmation & payment verification",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-cyan-100 text-cyan-800",
    dot: "bg-cyan-500",
    icon: FiPackage,
    blurb: "Confirmed and queued for processing",
  },
  processing: {
    label: "Processing",
    color: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
    icon: FiTruck,
    blurb: "Being prepared for shipment",
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800",
    dot: "bg-purple-500",
    icon: FiTruck,
    blurb: "Dispatched to delivery service",
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    dot: "bg-green-500",
    icon: FiCheckCircle,
    blurb: "Successfully delivered to customer",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    dot: "bg-red-500",
    icon: FiXCircle,
    blurb: "Order has been cancelled",
  },
  returned: {
    label: "Returned",
    color: "bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
    icon: FiRotateCcw,
    blurb: "Order returned by customer",
  },
};

const PAYMENT_STATUS_META = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    dot: "bg-green-500",
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800",
    dot: "bg-red-500",
  },
};

const PAGE_SIZE = 250;

const AdminOrderProcessingReport = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalFetched, setTotalFetched] = useState(0);
  const [fetchedAll, setFetchedAll] = useState(false);
  const isMountedRef = useRef(false);

  const filterOrders = useCallback((list) => {
    const status = String(statusFilter || "").trim();
    const payment = String(paymentFilter || "").trim();
    const type = String(typeFilter || "").trim();
    const source = String(sourceFilter || "").trim();
    const term = String(searchTerm || "").trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    return list.filter((order) => {
      if (status && status !== "all" && order.orderStatus !== status) return false;
      if (payment && payment !== "all" && order.paymentStatus !== payment) return false;
      if (type && type !== "all") {
        const orderType = String(order?.orderType || "")
          .trim()
          .toLowerCase();
        if (orderType !== type) return false;
      }
      if (source && source !== "all") {
        const orderSource = String(order?.source || "shop").toLowerCase();
        if (orderSource !== source.toLowerCase()) return false;
      }
      if (from || to) {
        const created = new Date(order.createdAt);
        if (from && created < from) return false;
        if (to && created > to) return false;
      }
      if (term) {
        const customer = getOrderCustomerProfile(order);
        const haystack = [
          order.orderNumber,
          customer.name,
          customer.email,
          customer.phone,
          order.transactionId,
          order.paymentMethod,
          order.source,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [fromDate, toDate, paymentFilter, searchTerm, sourceFilter, statusFilter, typeFilter]);

  const fetchAllOrders = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      else setRefreshing(true);
      let currentPage = 1;
      let allOrders = [];
      let hasMore = true;

      try {
        while (hasMore) {
          const { data } = await axios.get(`${baseUrl}/orders/admin/all`, {
            headers: getAuthHeaders(),
            params: { page: currentPage, limit: PAGE_SIZE },
          });
          if (!data?.success) {
            toast.error("Failed to load orders");
            break;
          }
          allOrders = allOrders.concat(data.orders || []);
          setTotalFetched(data?.pagination?.totalOrders ?? allOrders.length);
          hasMore = Boolean(data?.pagination?.hasNextPage);
          currentPage += 1;
          if (allOrders.length >= 5000) break;
        }
        setOrders(allOrders);
        setFetchedAll(!hasMore);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load the order report");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const refreshReport = useCallback(() => fetchAllOrders(false), [fetchAllOrders]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAllOrders(true);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const filteredOrders = useMemo(() => filterOrders(orders), [filterOrders, orders]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const base = {
      totalOrders: orders.length,
      todayOrders: 0,
      pendingAction: 0,
      pendingValue: 0,
      activePipeline: 0,
      pipelineValue: 0,
      deliveredRevenue: 0,
      cancelledValue: 0,
      returnedValue: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      byStatus: {},
      byPayment: {},
      byType: { online: 0, manual: 0 },
      bySource: {},
      byDay: {},
    };

    for (const order of orders) {
      const total = Number(order?.total || 0);
      const status = String(order?.orderStatus || "").toLowerCase();
      const payment = String(order?.paymentStatus || "").toLowerCase();
      const type = String(order?.orderType || "")
        .trim()
        .toLowerCase() === "manual" ? "manual" : "online";
      const source = String(order?.source || "shop");
      const created = new Date(order.createdAt);

      base.totalRevenue += total;
      base.byStatus[status] = base.byStatus[status] || { count: 0, value: 0 };
      base.byStatus[status].count += 1;
      base.byStatus[status].value += total;

      base.byPayment[payment] = base.byPayment[payment] || { count: 0, value: 0 };
      base.byPayment[payment].count += 1;
      base.byPayment[payment].value += total;

      base.byType[type] = (base.byType[type] || 0) + 1;
      base.bySource[source] = base.bySource[source] || { count: 0, value: 0 };
      base.bySource[source].count += 1;
      base.bySource[source].value += total;

      const dayKey = created.toLocaleDateString("en-CA");
      base.byDay[dayKey] = base.byDay[dayKey] || { count: 0, value: 0 };
      base.byDay[dayKey].count += 1;
      base.byDay[dayKey].value += total;

      if (created >= today) base.todayOrders += 1;

      if (["pending", "confirmed", "processing"].includes(status)) {
        base.pendingAction += 1;
        base.pendingValue += total;
      }
      if (["confirmed", "processing", "shipped"].includes(status)) {
        base.activePipeline += 1;
        base.pipelineValue += total;
      }
      if (status === "delivered") base.deliveredRevenue += total;
      if (status === "cancelled") base.cancelledValue += total;
      if (status === "returned") base.returnedValue += total;
    }

    base.averageOrderValue = orders.length ? base.totalRevenue / orders.length : 0;

    return base;
  }, [orders]);

  const exportCsv = () => {
    if (!filteredOrders.length) {
      toast.error("Nothing to export yet");
      return;
    }
    const header = [
      "Order Number",
      "Date",
      "Customer",
      "Phone",
      "Email",
      "Type",
      "Source",
      "Status",
      "Payment",
      "Payment Method",
      "Transaction ID",
      "Subtotal",
      "Shipping",
      "Discount",
      "Total",
      "Items",
    ];
    const body = filteredOrders.map((order) => {
      const customer = getOrderCustomerProfile(order);
      return [
        order.orderNumber,
        new Date(order.createdAt).toISOString(),
        customer.name,
        customer.phone,
        customer.email,
        order.orderType,
        order.source,
        order.orderStatus,
        order.paymentStatus,
        formatPaymentMethodLabel(order.paymentMethod),
        order.transactionId,
        Number(order.subtotal || 0).toFixed(2),
        Number(order.shippingFee || 0).toFixed(2),
        Number(order.discount || 0).toFixed(2),
        Number(order.total || 0).toFixed(2),
        (order.items || []).length,
      ];
    });
    const csv = [header, ...body]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `order-processing-report-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported as CSV");
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (value) => {
    try {
      const n = Number(value || 0);
      return `Tk ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch {
      return "Tk 0.00";
    }
  };

  const paginated = useMemo(() => {
    const perPage = 12;
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    return {
      rows: filteredOrders.slice(start, start + perPage),
      totalPages,
      page: safePage,
    };
  }, [filteredOrders, page]);

  useEffect(() => {
    if (paginated.page < page) setPage(paginated.page);
  }, [paginated.page, page]);

  const statusRows = Object.keys(ORDER_STATUS_META)
    .map((key) => {
      const meta = ORDER_STATUS_META[key];
      const data = stats.byStatus[key] || { count: 0, value: 0 };
      return { key, ...meta, count: data.count, value: data.value };
    })
    .filter((row) => row.count > 0 || ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"].includes(row.key));

  const paymentRows = Object.keys(PAYMENT_STATUS_META).map((key) => {
    const meta = PAYMENT_STATUS_META[key];
    const data = stats.byPayment[key] || { count: 0, value: 0 };
    return { key, ...meta, count: data.count, value: data.value };
  });

  const sourceRows = Object.entries(stats.bySource)
    .map(([source, data]) => ({ source, count: data.count, value: data.value }))
    .sort((a, b) => b.count - a.count);

  const sourceOptions = Object.keys(stats.bySource).sort();

  const totalPagesLabel = fetchedAll
    ? `${stats.totalOrders} orders loaded`
    : `${stats.totalOrders}+ orders loaded (${totalFetched} total)`;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            Order Processing Report
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {totalPagesLabel} · {filteredOrders.length} orders matching filters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshReport}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!filteredOrders.length}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
          <p className="mt-4 text-sm text-gray-500">
            Building order processing report...
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Total Orders", value: stats.totalOrders.toLocaleString(), accent: "from-slate-900 to-slate-600" },
              { label: "Today's Orders", value: stats.todayOrders.toLocaleString(), accent: "from-cyan-600 to-cyan-400" },
              { label: "Pending Action", value: stats.pendingAction.toLocaleString(), accent: "from-amber-500 to-yellow-400" },
              { label: "Pipeline Value", value: formatCurrency(stats.pipelineValue), accent: "from-blue-600 to-blue-400" },
              { label: "Delivered Revenue", value: formatCurrency(stats.deliveredRevenue), accent: "from-green-600 to-emerald-400" },
              { label: "Avg Order Value", value: formatCurrency(stats.averageOrderValue), accent: "from-purple-600 to-violet-400" },
            ].map((card) => (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {card.label}
                </p>
                <p className="mt-2 break-words text-lg font-black text-gray-900 sm:text-xl">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Orders by Processing Status
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Count and order value for each stage of the fulfillment pipeline
                </p>
              </div>
              <div className="hidden text-right text-xs text-gray-500 sm:block">
                <div>Total value</div>
                <div className="text-base font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
              {statusRows.map((row) => {
                const Icon = row.icon;
                const all = Math.max(1, stats.totalOrders);
                const pct = Math.round((row.count / all) * 100);
                return (
                  <button
                    key={row.key}
                    onClick={() => setStatusFilter(row.key)}
                    className={`group flex flex-col gap-2 rounded-xl border p-3 text-left transition ${
                      statusFilter === row.key
                        ? "border-gray-900 ring-2 ring-gray-900/10 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${row.color}`}
                      >
                        <Icon size={11} />
                        {row.label}
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {row.count}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {formatCurrency(row.value)}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${row.dot} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-gray-400">{pct}% of total</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment status + Source mix */}
          <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <h3 className="mb-4 text-base font-bold text-gray-900">
                Payment Status
              </h3>
              <div className="space-y-3">
                {paymentRows.map((row) => {
                  const all = Math.max(1, stats.totalOrders);
                  const pct = Math.round((row.count / all) * 100);
                  return (
                    <button
                      key={row.key}
                      onClick={() => setPaymentFilter(row.key)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        paymentFilter === row.key
                          ? "border-gray-900 bg-gray-50 ring-2 ring-gray-900/10"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="relative flex h-2.5 w-2.5 flex-none">
                        {row.count > 0 && (
                          <span
                            className={`inline-flex h-2.5 w-2.5 rounded-full ${row.dot}`}
                          />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${row.color}`}
                          >
                            {row.label}
                          </span>
                          <span className="text-xs font-bold text-gray-900">
                            {row.count} ·{" "}
                            <span className="text-gray-500">
                              {formatCurrency(row.value)}
                            </span>
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${row.dot}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Order Source Mix
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Where orders came from
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5">
                    Online: {stats.byType.online}
                  </span>
                  <span className="inline-flex rounded-full bg-slate-900 px-2 py-0.5 text-white">
                    Manual: {stats.byType.manual}
                  </span>
                </div>
              </div>
              {sourceRows.length ? (
                <div className="space-y-3">
                  {sourceRows.map((row) => {
                    const all = Math.max(1, stats.totalOrders);
                    const pct = Math.round((row.count / all) * 100);
                    return (
                      <button
                        key={row.source}
                        onClick={() => setSourceFilter(row.source)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          sourceFilter === row.source
                            ? "border-gray-900 bg-gray-50 ring-2 ring-gray-900/10"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-bold text-gray-900">
                              {row.source}
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {row.count}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {formatCurrency(row.value)}
                          </div>
                        </div>
                        <div className="h-1.5 w-24 flex-none overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gray-900"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">
                  No order source data yet.
                </div>
              )}
            </div>
          </div>

          {/* Detailed orders table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Order Processing Details
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Filter, search and review every order in the pipeline
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setPaymentFilter("all");
                    setTypeFilter("all");
                    setSourceFilter("all");
                    setFromDate("");
                    setToDate("");
                    setSearchTerm("");
                  }}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50"
                >
                  Clear filters
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Order, customer, phone, transaction..."
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Order status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                >
                  <option value="all">All statuses</option>
                  {Object.entries(ORDER_STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Payment status
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                >
                  <option value="all">All payments</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Order type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                >
                  <option value="all">All types</option>
                  <option value="online">Online</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {sourceOptions.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Source
                  </label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => {
                      setSourceFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                  >
                    <option value="all">All sources</option>
                    {sourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Order #",
                      "Date",
                      "Customer",
                      "Type",
                      "Total",
                      "Status",
                      "Payment",
                      "Source",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider sm:px-5"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-sm text-gray-400"
                      >
                        No orders match the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginated.rows.map((order) => {
                      const customer = getOrderCustomerProfile(order);
                      const statusMeta =
                        ORDER_STATUS_META[order.orderStatus] || {};
                      const paymentMeta =
                        PAYMENT_STATUS_META[order.paymentStatus] || {};
                      const manual = String(order?.orderType || "")
                        .trim()
                        .toLowerCase() === "manual";
                      return (
                        <tr
                          key={order._id}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 sm:px-5">
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {order.orderNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 sm:px-5">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-3 sm:px-5">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.phone || customer.email || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 sm:px-5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                manual
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {manual ? "Manual" : "Online"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 sm:px-5">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="px-4 py-3 sm:px-5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusMeta.color || "bg-gray-100 text-gray-700"}`}
                            >
                              {statusMeta.label || order.orderStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 sm:px-5">
                            <div className="text-sm text-gray-700">
                              {formatPaymentMethodLabel(order.paymentMethod)}
                            </div>
                            <div
                              className={`text-xs font-medium ${paymentMeta.color || "text-gray-500"}`}
                            >
                              {formatPaymentStatusLabel(order.paymentStatus)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 sm:px-5">
                            {order.source}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-2 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                Page{" "}
                <span className="font-semibold text-gray-900">
                  {paginated.page}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{paginated.totalPages}</span>{" "}
                · {filteredOrders.length} orders
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={paginated.page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  <FiChevronLeft size={14} /> Prev
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(paginated.totalPages, p + 1))
                  }
                  disabled={paginated.page >= paginated.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  Next <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrderProcessingReport;