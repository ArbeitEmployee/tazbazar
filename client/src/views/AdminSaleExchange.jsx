import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiRefreshCw, FiTrash2, FiMaximize2 } from "react-icons/fi";
import { dashboardSecondaryButtonClass } from "../utils/dashboardFormStyles";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "completed", "refunded", "failed", "cancelled"];

const statusClass = (status) => {
  switch (status) {
    case "delivered":
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "processing":
    case "shipped":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "confirmed":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-red-50 text-red-700 border-red-200";
  }
};

const AdminSaleExchange = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${baseUrl}/orders/admin/all?isExchange=1&page=${page}&limit=${limit}`,
        { headers: getAuthHeaders() },
      );
      setOrders(data?.orders || data?.data || []);
      setTotal(data?.pagination?.totalOrders ?? data?.totalOrders ?? data?.totalCount ?? data?.orders?.length ?? 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load exchange orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, [page]);

  const handleStatus = async (order, field, value) => {
    try {
      const endpoint =
        field === "status"
          ? `${baseUrl}/orders/admin/${order._id}/status`
          : `${baseUrl}/orders/admin/${order._id}/payment-status`;
      await axios.patch(endpoint, field === "status" ? { status: value } : { paymentStatus: value }, { headers: getAuthHeaders() });
      toast.success(`${field === "status" ? "Order" : "Payment"} status updated`);
      fetchExchanges();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete exchange order "${order.orderNumber}"?`)) return;
    try {
      await axios.delete(`${baseUrl}/orders/admin/${order._id}`, { headers: getAuthHeaders() });
      toast.success("Exchange order deleted");
      if (selected?._id === order._id) setSelected(null);
      fetchExchanges();
    } catch (error) {
      toast.error("Failed to delete exchange order");
    }
  };

  return (
    <div className="app-panel flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Exchanges</p>
          <h1 className="mt-1 text-xl font-semibold text-black md:text-2xl">Sale Exchange</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage exchange orders created from the Exchange Order form. ({total} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchExchanges}
            className={`${dashboardSecondaryButtonClass} flex items-center gap-2`}
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Order No.</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Returned / New</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Order status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-400">Loading exchanges...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-400">No exchange orders found.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-semibold text-black">{order.orderNumber}</div>
                    <div className="text-xs text-slate-500">Ref: {(order.exchangeRefOrder || "").slice(-10)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-black">
                      {order.shippingAddress?.firstName || "Unknown"} {order.shippingAddress?.lastName || ""}
                    </div>
                    {order.shippingAddress?.phone ? <div className="text-xs text-slate-500">{order.shippingAddress.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="text-red-600">{(order.exchangeReturnedItems || []).length} returned</span>
                    {" · "}
                    <span className="text-emerald-600">{(order.items || []).length} new</span>
                    {order.exchangeFee > 0 ? <span className="ml-1 text-amber-600">+৳{order.exchangeFee}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-black">৳{Number(order.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatus(order, "status", e.target.value)}
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(order.orderStatus)}`}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => handleStatus(order, "payment", e.target.value)}
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(order.paymentStatus)}`}
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setSelected(order)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-black"
                        title="View details"
                      >
                        <FiMaximize2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {page > 1 ? (
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          className="mx-auto flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← Load newer exchanges
        </button>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Exchange details</p>
                <h2 className="mt-0.5 text-lg font-semibold text-black">{selected.orderNumber}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Returned items</p>
                {(selected.exchangeReturnedItems || []).length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No returned items</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {selected.exchangeReturnedItems.map((item, index) => (
                      <li key={index} className="flex justify-between gap-2">
                        <span>{item.title || item.product || "Product"} × {item.quantity}</span>
                        <span>৳{Number(item.price || 0) * Number(item.quantity || 1)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">New items</p>
                {(selected.items || []).length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No new items</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {selected.items.map((item, index) => (
                      <li key={index} className="flex justify-between gap-2">
                        <span>{item.title || item.product?.title || "Product"} × {item.quantity}</span>
                        <span>৳{Number(item.price || 0) * Number(item.quantity || 1)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Subtotal (new)</p>
                <p className="font-bold text-black">৳{Number(selected.subtotal || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Returned credit</p>
                <p className="font-bold text-red-600">-৳{Number(selected.discount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Exchange fee</p>
                <p className="font-bold text-amber-600">+৳{Number(selected.exchangeFee || 0).toLocaleString()}</p>
              </div>
              <div className="col-span-3 border-t border-slate-200 pt-2">
                <p className="text-xs text-slate-500">Payable amount</p>
                <p className="text-xl font-bold text-black">৳{Number(selected.total || 0).toLocaleString()}</p>
              </div>
            </div>

            {selected.adminNotes ? (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{selected.adminNotes}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminSaleExchange;