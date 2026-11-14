import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const DAMAGE_REASONS = ["Damaged in transit", "Damaged in storage", "Defective product", "Expired", "Water damage", "Other"];

const DamageProducts = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ productId: "", variationId: "", quantity: 1, reason: "Damaged in transit", note: "" });

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/damage-products`, {
        headers: getAuthHeaders(),
        params: search ? { search } : {},
      });
      setEntries(data?.damageProducts || []);
      setSummary(data?.summary || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load damage records");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    axios
      .get(`${baseUrl}/products`, { headers: getAuthHeaders() })
      .then((response) => setProducts(response.data?.products || response.data?.data || []))
      .catch(() => null);
  }, []);

  const selectedProduct = products.find((product) => product._id === form.productId);
  const variations = Array.isArray(selectedProduct?.variations) ? selectedProduct.variations : [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.productId) return toast.error("Select a product");
    if (!Number(form.quantity)) return toast.error("Quantity is required");
    try {
      setSaving(true);
      await axios.post(
        `${baseUrl}/damage-products`,
        {
          product: form.productId,
          variationId: form.variationId || undefined,
          quantity: Number(form.quantity),
          reason: form.reason,
          note: form.note,
        },
        { headers: getAuthHeaders() },
      );
      toast.success("Damage recorded and stock adjusted");
      setForm({ productId: "", variationId: "", quantity: 1, reason: "Damaged in transit", note: "" });
      setShowForm(false);
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record damage");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm("Delete this damage entry? Stock will be restored.")) return;
    try {
      await axios.delete(`${baseUrl}/damage-products/${entry._id}`, { headers: getAuthHeaders() });
      toast.success("Entry deleted, stock restored");
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete entry");
    }
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">Damage Products</h1>
          <p className="mt-1 text-sm text-slate-500">Record damaged stock — quantity is deducted automatically.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntries}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiPlus size={14} /> Record Damage
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Damage Entries</p>
            <p className="mt-1 text-lg font-bold text-black">{Number(summary.count || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Damaged Quantity</p>
            <p className="mt-1 text-lg font-bold text-red-600">{Number(summary.totalQuantity || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Last Entry</p>
            <p className="mt-1 text-lg font-bold text-black">
              {entries[0]?.damageDate ? new Date(entries[0].damageDate).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Product *</label>
            <select
              value={form.productId}
              onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value, variationId: "" }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>{product.title || product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Variation (optional)</label>
            <select
              value={form.variationId}
              onChange={(e) => setForm((prev) => ({ ...prev, variationId: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              disabled={!variations.length}
            >
              <option value="">None</option>
              {variations.map((variation) => (
                <option key={variation._id} value={variation._id}>{variation.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Quantity *</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reason *</label>
            <select
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {DAMAGE_REASONS.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Note</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Damage Record"}
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search damaged product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Variation</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400">No damage records found.</td></tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-slate-600">
                    {entry.damageDate ? new Date(entry.damageDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-black">
                    {entry.title || entry.product?.title || "—"}
                    {entry.sku ? <span className="ml-2 text-xs text-slate-400">{entry.sku}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{entry.variationLabel || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">{Number(entry.quantity || 0)}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.reason}</td>
                  <td className="px-4 py-3 text-slate-500">{entry.note || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(entry)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
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

export default DamageProducts;
