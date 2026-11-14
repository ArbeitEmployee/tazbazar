import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiSearch, FiTrash2, FiEdit2, FiRefreshCw } from "react-icons/fi";
import {
  dashboardFieldClass,
  dashboardFormSurfaceClass,
  dashboardPrimaryButtonClass,
  dashboardSecondaryButtonClass,
} from "../../utils/dashboardFormStyles";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SALE_TYPE_META = {
  office: {
    title: "Manage Office Sale",
    description: "Track and manage office purchases and sales.",
    badge: "Office",
  },
  company: {
    title: "Company Sale",
    description: "Track and manage company level sales.",
    badge: "Company",
  },
  reseller: {
    title: "Reseller Sale",
    description: "Track and manage reseller channel sales.",
    badge: "Reseller",
  },
};

const PAYMENT_METHODS = ["cash", "card", "mobile_banking"];
const PAYMENT_STATUSES = ["paid", "due", "partial"];

const SaleManager = ({ saleType = "office" }) => {
  const meta = SALE_TYPE_META[saleType] || SALE_TYPE_META.office;

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ totalCount: 0, totalRevenue: 0, todayCount: 0, todayRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [amountPaid, setAmountPaid] = useState(0);

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/products`, { headers: getAuthHeaders() });
      setProducts(data?.products || data?.data || []);
    } catch (error) {
      toast.error("Failed to load products");
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/pos?type=${saleType}`, { headers: getAuthHeaders() });
      setSales(data?.sales || data?.data || []);
      if (data?.stats) setStats(data.stats);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [saleType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const resetForm = () => {
    setEditingId("");
    setCustomerName("");
    setCustomerPhone("");
    setItems([]);
    setDiscount(0);
    setTax(0);
    setPaymentMethod("cash");
    setPaymentStatus("paid");
    setAmountPaid(0);
    setCartOpen(false);
    setProductSearch("");
  };

  const startEdit = (sale) => {
    setEditingId(sale._id);
    setCustomerName(sale.customerName || "");
    setCustomerPhone(sale.customerPhone || "");
    setItems(
      (sale.items || []).map((item) => ({
        productId: item.product?._id || item.product || "",
        title: item.product?.title || "Product",
        quantity: item.quantity,
        price: item.price,
      })),
    );
    setDiscount(sale.discount || 0);
    setTax(sale.tax || 0);
    setPaymentMethod(sale.paymentMethod || "cash");
    setPaymentStatus(sale.paymentStatus || "paid");
    setAmountPaid(sale.amountPaid || sale.total || 0);
    setCartOpen(true);
  };

  const addItem = (product) => {
    const exists = items.find((item) => item.productId === product._id);
    if (exists) {
      setItems(items.map((item) => (item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setItems([
        ...items,
        { productId: product._id, title: product.title, quantity: 1, price: product.salePrice || product.price },
      ]);
    }
    setProductSearch("");
  };

  const updateItem = (productId, patch) => {
    setItems(items.map((item) => (item.productId === productId ? { ...item, ...patch } : item)));
  };

  const removeItem = (productId) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (items.length === 0) {
      return toast.error("Add at least one product");
    }
    if (Number(amountPaid) <= 0 && paymentStatus !== "due") {
      return toast.error("Paid amount must be greater than 0");
    }

    const payload = {
      saleType,
      customerName,
      customerPhone,
      items: items.map((item) => ({ product: item.productId, quantity: item.quantity, price: item.price })),
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      subtotal,
      total,
      paymentMethod,
      paymentStatus,
      amountPaid: Number(amountPaid),
    };

    try {
      setSaving(true);
      if (editingId) {
        const { data } = await axios.put(`${baseUrl}/pos/${editingId}`, payload, { headers: getAuthHeaders() });
        if (data.success) toast.success("Sale updated successfully");
      } else {
        const { data } = await axios.post(`${baseUrl}/pos`, payload, { headers: getAuthHeaders() });
        if (data.success) toast.success("Sale created successfully");
      }
      resetForm();
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to save sale");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (sale, nextStatus) => {
    try {
      await axios.put(`${baseUrl}/pos/${sale._id}`, { paymentStatus: nextStatus }, { headers: getAuthHeaders() });
      toast.success("Payment status updated");
      fetchSales();
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const handleDelete = async (sale) => {
    if (!window.confirm(`Delete sale "${sale.saleId}"?`)) return;
    try {
      await axios.delete(`${baseUrl}/pos/${sale._id}`, { headers: getAuthHeaders() });
      toast.success("Sale deleted");
      if (sale._id === editingId) resetForm();
      fetchSales();
    } catch (error) {
      toast.error("Failed to delete sale");
    }
  };

  const filteredProducts = products.filter((p) =>
    (p.title || "").toLowerCase().includes(productSearch.toLowerCase()),
  );

  return (
    <div className="app-panel flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{meta.badge} Sales</p>
          <h1 className="mt-1 text-xl font-semibold text-black md:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchSales();
              fetchProducts();
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setCartOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiPlus size={14} /> New Sale
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total count</p>
          <p className="mt-1 text-2xl font-bold text-black">{stats.totalCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total revenue</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">৳{Number(stats.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Today</p>
          <p className="mt-1 text-2xl font-bold text-black">{stats.todayCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Today revenue</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">৳{Number(stats.todayRevenue || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* New / Edit sale form */}
      {cartOpen ? (
        <form onSubmit={handleSubmit} className={`${dashboardFormSurfaceClass} space-y-4 p-4 md:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                {meta.badge} Sale
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-black">
                {editingId ? "Edit sale" : "Create new sale"}
              </h2>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className={dashboardFieldClass}
            />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Customer phone"
              className={dashboardFieldClass}
            />
          </div>

          {/* Product picker */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Add products</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className={`${dashboardFieldClass} pl-10`}
              />
            </div>
            {productSearch ? (
              <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {filteredProducts.slice(0, 12).map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => addItem(product)}
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-slate-100" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">{product.title}</p>
                      <p className="text-xs text-slate-500">{product.sku ? `SKU: ${product.sku} · ` : ""}Stock: {product.stock ?? "—"}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">৳{product.salePrice || product.price}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Items */}
          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="w-24 px-4 py-2.5">Qty</th>
                    <th className="w-32 px-4 py-2.5">Unit price</th>
                    <th className="w-28 px-4 py-2.5 text-right">Total</th>
                    <th className="w-12 px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-4 py-2 font-medium text-black">{item.title}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.productId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateItem(item.productId, { price: Number(e.target.value) || 0 })}
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-black">
                        ৳{Number(item.quantity * item.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-red-600">
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
              No products added yet. Search and click a product above to add it.
            </p>
          )}

          {/* Totals + payment */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Discount</span>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className={dashboardFieldClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Tax</span>
              <input type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)} className={dashboardFieldClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Payment method</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={dashboardFieldClass}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Payment status</span>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={dashboardFieldClass}>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Subtotal</p>
              <p className="mt-0.5 text-lg font-bold text-black">৳{subtotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total due</p>
              <p className="mt-0.5 text-lg font-bold text-emerald-600">৳{total.toLocaleString()}</p>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Amount paid</span>
              <input type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className={dashboardFieldClass} />
            </label>
          </div>

          <button type="submit" disabled={saving} className={`${dashboardPrimaryButtonClass} disabled:opacity-50`}>
            {saving ? "Saving..." : editingId ? "Update sale" : "Create sale"}
          </button>
        </form>
      ) : null}

      {/* Sales list */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Sale ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400">Loading sales...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400">No {meta.badge.toLowerCase()} sales yet.</td></tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-black">{sale.saleId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-black">{sale.customerName || "Walk-in Customer"}</div>
                    {sale.customerPhone ? <div className="text-xs text-slate-500">{sale.customerPhone}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{(sale.items || []).length} item(s)</td>
                  <td className="px-4 py-3 text-right font-bold text-black">৳{Number(sale.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="mb-1 text-xs text-slate-500">{sale.paymentMethod}</div>
                    <select
                      value={sale.paymentStatus}
                      onChange={(e) => handleQuickStatus(sale, e.target.value)}
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        sale.paymentStatus === "paid"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : sale.paymentStatus === "due"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-sky-200 bg-sky-50 text-sky-700"
                      }`}
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(sale)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-black" title="Edit">
                        <FiEdit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(sale)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Delete">
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
    </div>
  );
};

export default SaleManager;