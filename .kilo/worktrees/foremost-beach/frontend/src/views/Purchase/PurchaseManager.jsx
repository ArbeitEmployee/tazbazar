import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MODE_META = {
  add: { title: "Add Purchase", description: "Record a new supplier purchase.", type: "product" },
  manage: { title: "Manage Purchase", description: "Browse, filter and pay for purchases.", type: "" },
  variant: { title: "Variant Purchase", description: "Purchases recorded for product variants.", type: "variant" },
  fabric: { title: "Fabrics Purchase", description: "Purchases recorded for fabrics.", type: "fabric" },
};

const emptyItem = { productId: "", quantity: 1, purchasePrice: 0, variationId: "" };

const PurchaseManager = ({ initialMode = "manage" }) => {
  const mode = MODE_META[initialMode] ? initialMode : "manage";
  const meta = MODE_META[mode];

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(mode === "add");
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [form, setForm] = useState({
    supplierId: "",
    invoiceNumber: "",
    purchaseDate: "",
    paidAmount: 0,
    notes: "",
    purchaseType: meta.type || "product",
    items: [{ ...emptyItem }],
  });

  const fetchLookups = useCallback(async () => {
    try {
      const [supplierRes, productRes] = await Promise.all([
        axios.get(`${baseUrl}/suppliers`),
        axios.get(`${baseUrl}/products`, { headers: getAuthHeaders() }),
      ]);
      setSuppliers(supplierRes.data?.data || supplierRes.data?.suppliers || []);
      setProducts(productRes.data?.products || productRes.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load suppliers/products");
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (meta.type) params.purchaseType = meta.type;
      const { data } = await axios.get(`${baseUrl}/purchases`, {
        headers: getAuthHeaders(),
        params,
      });
      setPurchases(data?.purchases || []);
      setSummary(data?.summary || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [meta.type, paymentStatus, search]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const total = useMemo(
    () => form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.purchasePrice || 0), 0),
    [form.items],
  );

  const updateItem = (index, patch) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.supplierId) {
      toast.error("Select a supplier");
      return;
    }
    if (!form.invoiceNumber.trim()) {
      toast.error("Invoice number is required");
      return;
    }
    const items = form.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity || 1),
        purchasePrice: Number(item.purchasePrice || 0),
        variationId: item.variationId || undefined,
      }));
    if (!items.length) {
      toast.error("Add at least one product");
      return;
    }
    try {
      setSaving(true);
      const { data } = await axios.post(
        `${baseUrl}/purchases`,
        {
          supplierId: form.supplierId,
          invoiceNumber: form.invoiceNumber,
          purchaseDate: form.purchaseDate || undefined,
          paidAmount: Number(form.paidAmount || 0),
          notes: form.notes,
          purchaseType: form.purchaseType,
          items,
        },
        { headers: getAuthHeaders() },
      );
      if (data?.success) {
        toast.success("Purchase created successfully");
        setForm({
          supplierId: "",
          invoiceNumber: "",
          purchaseDate: "",
          paidAmount: 0,
          notes: "",
          purchaseType: meta.type || "product",
          items: [{ ...emptyItem }],
        });
        setShowForm(false);
        fetchPurchases();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create purchase");
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (event) => {
    event.preventDefault();
    if (!payTarget || !Number(payAmount)) return;
    try {
      const { data } = await axios.patch(
        `${baseUrl}/purchases/${payTarget._id}/payment`,
        { amount: Number(payAmount) },
        { headers: getAuthHeaders() },
      );
      if (data?.success) {
        toast.success("Payment recorded");
        setPayTarget(null);
        setPayAmount(0);
        fetchPurchases();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const statusBadge = (value) => {
    const map = {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      partial: "bg-amber-50 text-amber-700 border-amber-200",
      unpaid: "bg-red-50 text-red-700 border-red-200",
    };
    return map[value] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchPurchases(); fetchLookups(); }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiPlus size={14} /> New Purchase
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Purchases</p>
            <p className="mt-1 text-lg font-bold text-black">{summary.count ?? purchases.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total</p>
            <p className="mt-1 text-lg font-bold text-black">{Number(summary.totalAmount || 0).toFixed(2)} Tk</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Paid</p>
            <p className="mt-1 text-lg font-bold text-emerald-600">{Number(summary.paidAmount || 0).toFixed(2)} Tk</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Due</p>
            <p className="mt-1 text-lg font-bold text-red-600">{Number(summary.dueAmount || 0).toFixed(2)} Tk</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Supplier *</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm((prev) => ({ ...prev, supplierId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Invoice Number *</label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-black">Items</p>
            {form.items.map((item, index) => {
              const selectedProduct = products.find((product) => product._id === item.productId);
              const variations = Array.isArray(selectedProduct?.variations) ? selectedProduct.variations : [];
              return (
                <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, { productId: e.target.value, variationId: "" })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.title || product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Variation (optional)</label>
                    <select
                      value={item.variationId}
                      onChange={(e) => updateItem(index, { variationId: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      disabled={!variations.length}
                    >
                      <option value="">None</option>
                      {variations.map((variation) => (
                        <option key={variation._id} value={variation._id}>
                          {variation.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.purchasePrice}
                      onChange={(e) => updateItem(index, { purchasePrice: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end justify-end md:col-span-1">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items,
                        }))
                      }
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Remove item"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))}
              className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              + Add another item
            </button>
          </div>


          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Paid Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.paidAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Total: <span className="text-base font-bold text-black">{total.toFixed(2)} Tk</span>
            </p>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Purchase"}
            </button>
          </div>

        </form>
      )}


      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All payment status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="10" className="px-4 py-10 text-center text-slate-400">Loading purchases...</td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-10 text-center text-slate-400">No purchases found.</td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-black">{purchase.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {purchase.supplier?.name || purchase.supplierName || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{purchase.purchaseType || "product"}</td>
                  <td className="px-4 py-3 text-slate-600">{Array.isArray(purchase.items) ? purchase.items.length : 0}</td>
                  <td className="px-4 py-3 font-medium">{Number(purchase.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-600">{Number(purchase.paidAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-red-600">{Number(purchase.dueAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${statusBadge(purchase.paymentStatus)}`}>
                      {purchase.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {purchase.paymentStatus !== "paid" && (
                      <button
                        onClick={() => {
                          setPayTarget(purchase);
                          setPayAmount(Number(purchase.dueAmount || 0));
                        }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPayTarget(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handlePay}
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-black">Record Payment</h3>
            <p className="text-sm text-slate-500">
              Invoice <strong>{payTarget.invoiceNumber}</strong> — due{" "}
              <strong>{Number(payTarget.dueAmount || 0).toFixed(2)} Tk</strong>
            </p>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
                Save Payment
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default PurchaseManager;
