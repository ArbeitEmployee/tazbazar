import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiArchive,
  FiCheckCircle,
  FiFilter,
  FiRefreshCw,
  FiTrash2,
  FiPhoneCall,
  FiEye,
  FiX,
  FiMapPin,
  FiShoppingBag,
} from "react-icons/fi";
import SearchableSelect from "../components/SearchableSelect";
import { useAuth } from "../hooks/useAuth";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const resolveImage = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    if (value.startsWith("http") || value.startsWith("data:")) return value;
    if (value.startsWith("/")) return baseUrl ? `${baseUrl}${value}` : value;
    return baseUrl ? `${baseUrl}/uploads/products/${value}` : `/uploads/products/${value}`;
  }
  if (typeof value === "object") {
    return resolveImage(value.url || value.secure_url || value.data || value.src || value.path || "");
  }
  return "";
};

const statusBadgeClass = (status = "") => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "new") return "bg-blue-100 text-blue-700";
  if (normalized === "follow_up") return "bg-yellow-100 text-yellow-700";
  if (normalized === "converted") return "bg-emerald-100 text-emerald-700";
  if (normalized === "discarded") return "bg-zinc-200 text-zinc-700";
  return "bg-gray-100 text-gray-700";
};

const statusLabel = (status = "") => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "new") return "New (নতুন)";
  if (normalized === "follow_up") return "Follow-up (যোগাযোগ চলমান)";
  if (normalized === "converted") return "Converted (অর্ডার হয়েছে)";
  if (normalized === "discarded") return "Discarded (বাতিল)";
  return status;
};

const ModuleAbandonedOrders = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const canAccess = useMemo(
    () => String(user?.userType || "").toLowerCase() === "admin",
    [user?.userType],
  );

  const fetchRows = useCallback(async (filters = {}) => {
    if (!canAccess) return;

    const nextSearch = filters.search !== undefined ? filters.search : search;
    const nextStatus = filters.status !== undefined ? filters.status : status;

    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/abandoned-orders`, {
        headers: getAuthHeaders(),
        params: {
          search: nextSearch || undefined,
          status: nextStatus || undefined,
          limit: 100,
        },
      });

      setRows(response.data?.abandonedOrders || []);
      setSummary(response.data?.summary || {});
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load abandoned orders");
      setRows([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }, [canAccess, search, status]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const changeStatus = async (row, nextStatus) => {
    try {
      await axios.patch(
        `${baseUrl}/abandoned-orders/${row._id}`,
        { status: nextStatus },
        { headers: getAuthHeaders() },
      );
      setRows((prev) =>
        prev.map((entry) =>
          entry._id === row._id
            ? {
                ...entry,
                status: nextStatus,
              }
            : entry,
        ),
      );
      toast.success("Status updated");
      fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const convertToOrder = async (row) => {
    try {
      const response = await axios.post(
        `${baseUrl}/abandoned-orders/${row._id}/convert`,
        {},
        { headers: getAuthHeaders() },
      );
      const orderNumber = response.data?.order?.orderNumber || "";
      toast.success(orderNumber ? `Converted: ${orderNumber}` : "Converted to order");
      fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to convert abandoned order");
    }
  };

  const deleteRow = async (row) => {
    const ok = window.confirm("Delete this abandoned order entry?");
    if (!ok) return;

    try {
      await axios.delete(`${baseUrl}/abandoned-orders/${row._id}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Deleted");
      fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete abandoned order");
    }
  };

  const applyFilters = async () => {
    try {
      setIsApplying(true);
      await fetchRows();
    } finally {
      setIsApplying(false);
    }
  };

  const clearFilters = async () => {
    setSearch("");
    setStatus("");
    try {
      setIsApplying(true);
      await fetchRows({ search: "", status: "" });
    } finally {
      setIsApplying(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-black mb-2">Access Required</h2>
        <p className="text-gray-600">Only admin can access abandoned orders.</p>
      </div>
    );
  }

  const summaryCards = [
    { label: "New (নতুন)", value: Number(summary?.new?.count || 0), color: "text-blue-600" },
    { label: "Follow-up (যোগাযোগ)", value: Number(summary?.follow_up?.count || 0), color: "text-amber-600" },
    { label: "Converted (অর্ডার হয়েছে)", value: Number(summary?.converted?.count || 0), color: "text-emerald-600" },
    { label: "Discarded (বাতিল)", value: Number(summary?.discarded?.count || 0), color: "text-zinc-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-zinc-900 to-black rounded-2xl p-6 md:p-8 text-white shadow-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-2xl mb-4">
          <FiArchive className="w-6 h-6 text-amber-300" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">Incomplete Orders (অসম্পূর্ণ অর্ডার)</h1>
        <p className="text-zinc-300 mt-2 text-sm md:text-base max-w-2xl">
          যেসব কাস্টমার চেকআউট ফর্মে ফোন নম্বর দিয়েও অর্ডার শেষ করেনি, তাদের তালিকা এখানে সংরক্ষিত আছে। আপনি সরাসরি কল দিয়ে অর্ডার কনফার্ম করতে পারেন।
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-medium text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1.5 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <FiFilter className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-black">Search & Filter</p>
            <p className="text-xs text-gray-500">Search by customer name, phone, email or status.</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full lg:max-w-2xl">
              <label className="block">
                <span className="text-xs font-medium text-gray-600 mb-1 block">Search Customer</span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, phone number (01X...), email"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600 mb-1 block">Filter Status</span>
                <SearchableSelect
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "new", label: "New (নতুন)" },
                    { value: "follow_up", label: "Follow-up (যোগাযোগ চলমান)" },
                    { value: "converted", label: "Converted (অর্ডার হয়েছে)" },
                    { value: "discarded", label: "Discarded (বাতিল)" },
                  ]}
                  placeholder="All Statuses"
                  searchable={false}
                  className="min-w-0"
                  buttonClassName="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-left"
                  menuClassName="rounded-xl"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={applyFilters}
                disabled={isApplying}
                className="inline-flex h-10 items-center justify-center gap-2 px-5 bg-black text-white rounded-xl text-sm font-semibold transition hover:bg-gray-800 disabled:opacity-60"
              >
                <FiRefreshCw className={`w-4 h-4 ${isApplying ? "animate-spin" : ""}`} />
                Apply
              </button>
              <button
                onClick={clearFilters}
                disabled={isApplying}
                className="inline-flex h-10 items-center justify-center gap-2 px-4 border border-gray-300 bg-white rounded-xl text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black">Incomplete Order List ({rows.length})</h2>
          <button
            onClick={fetchRows}
            className="inline-flex h-9 items-center gap-2 px-3.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent mb-2" />
            <p className="text-sm">Loading incomplete orders...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FiShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-base font-semibold text-gray-800">No Incomplete Orders Found</p>
            <p className="text-xs text-gray-500 mt-1">When customers enter their phone number during checkout without finishing the order, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase font-semibold text-gray-500 bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Customer Info</th>
                  <th className="py-3 px-4">Delivery Address</th>
                  <th className="py-3 px-4">Products in Cart</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const phone = row.customer?.phone || "";
                  const altPhone = row.customer?.alternativePhone || "";
                  const items = Array.isArray(row.items) ? row.items : [];

                  return (
                    <tr key={row._id} className="hover:bg-gray-50/80 transition-colors align-top">
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <p className="font-semibold text-gray-900">{row.customer?.name || "Customer"}</p>
                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100"
                          >
                            <FiPhoneCall className="w-3 h-3" />
                            {phone}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No phone</span>
                        )}
                        {altPhone ? (
                          <p className="text-xs text-gray-500 mt-1">Alt: {altPhone}</p>
                        ) : null}
                        {row.customer?.email ? (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[170px]">{row.customer.email}</p>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4 min-w-[200px]">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {row.customer?.address || "Address not entered"}
                        </p>
                        {row.customer?.city || row.customer?.district ? (
                          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <FiMapPin className="w-3 h-3 text-gray-400" />
                            {[row.customer.subCity, row.customer.city, row.customer.district].filter(Boolean).join(", ")}
                          </p>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="space-y-1.5">
                          {items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {item.image ? (
                                <img
                                  src={resolveImage(item.image)}
                                  alt={item.title}
                                  className="w-8 h-8 rounded-md object-cover bg-gray-100 shrink-0 border border-gray-200"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                                <p className="text-[11px] text-gray-500">
                                  Qty: {item.quantity} × {item.price} Tk
                                  {item.variationLabel ? ` (${item.variationLabel})` : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                          {items.length > 2 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRow(row)}
                              className="text-xs text-blue-600 hover:underline font-medium"
                            >
                              +{items.length - 2} more item(s)...
                            </button>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[110px]">
                        <p className="font-bold text-gray-900">{Number(row.total || row.subtotal || 0).toFixed(2)} Tk</p>
                        <p className="text-[11px] text-gray-500">{items.length} item(s)</p>
                      </td>

                      <td className="py-3.5 px-4 min-w-[140px]">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadgeClass(row.status)}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                        <div className="mt-2">
                          <SearchableSelect
                            value={row.status || "new"}
                            onChange={(value) => changeStatus(row, value)}
                            options={[
                              { value: "new", label: "New (নতুন)" },
                              { value: "follow_up", label: "Follow-up" },
                              { value: "converted", label: "Converted" },
                              { value: "discarded", label: "Discarded" },
                            ]}
                            placeholder="Change Status"
                            searchable={false}
                            className="min-w-0"
                            buttonClassName="text-xs border border-gray-200 rounded-lg px-2.5 py-1 bg-white text-gray-800"
                            menuClassName="rounded-xl"
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500 min-w-[110px]">
                        {row.capturedAt ? new Date(row.capturedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right min-w-[160px]">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRow(row)}
                            title="View Details"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => convertToOrder(row)}
                            disabled={String(row.status) === "converted"}
                            title="Convert to Confirmed Order"
                            className="inline-flex h-8 items-center gap-1 px-2.5 text-xs font-semibold rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Convert
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRow(row)}
                            title="Delete"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-black">Incomplete Order Details</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Captured: {selectedRow.capturedAt ? new Date(selectedRow.capturedAt).toLocaleString() : "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-black"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Customer Box */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Customer & Delivery Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Full Name</span>
                    <strong className="text-black font-semibold">{selectedRow.customer?.name || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Phone Number</span>
                    {selectedRow.customer?.phone ? (
                      <a
                        href={`tel:${selectedRow.customer.phone}`}
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs hover:bg-emerald-200"
                      >
                        <FiPhoneCall className="w-3 h-3" />
                        {selectedRow.customer.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                  {selectedRow.customer?.alternativePhone ? (
                    <div>
                      <span className="text-gray-500 text-xs block">Alternative Phone</span>
                      <strong className="text-gray-800">{selectedRow.customer.alternativePhone}</strong>
                    </div>
                  ) : null}
                  {selectedRow.customer?.email ? (
                    <div>
                      <span className="text-gray-500 text-xs block">Email</span>
                      <span className="text-gray-800">{selectedRow.customer.email}</span>
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 text-xs block">Delivery Address</span>
                    <p className="text-gray-900 font-medium">{selectedRow.customer?.address || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-2xl border border-gray-200 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Products in Cart ({selectedRow.items?.length || 0})
                </h4>
                <div className="divide-y divide-gray-100">
                  {selectedRow.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img
                            src={resolveImage(item.image)}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                          {item.variationLabel ? (
                            <p className="text-xs text-gray-500">Variant: {item.variationLabel}</p>
                          ) : null}
                          <p className="text-xs text-gray-500">
                            {item.quantity} × {item.price} Tk
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 shrink-0">
                        {(Number(item.quantity || 1) * Number(item.price || 0)).toFixed(2)} Tk
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 border-t border-gray-200 pt-3 flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-700">Total Cart Value:</span>
                  <span className="text-base font-bold text-black">
                    {Number(selectedRow.total || selectedRow.subtotal || 0).toFixed(2)} Tk
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-100"
                >
                  Close
                </button>
                {selectedRow.customer?.phone ? (
                  <a
                    href={`tel:${selectedRow.customer.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    <FiPhoneCall className="w-4 h-4" />
                    Call Customer
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => convertToOrder(selectedRow)}
                  disabled={String(selectedRow.status) === "converted"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Convert to Confirmed Order
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ModuleAbandonedOrders;
