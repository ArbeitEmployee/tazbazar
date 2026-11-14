import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiDownload, FiRefreshCw, FiSearch } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Product stock report — reuses the /api/reports/module stock endpoint.
const ProductStockReport = () => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/reports/module`, {
        headers: getAuthHeaders(),
        params: { type: "stock" },
      });
      setRows(data?.rows || []);
      setSummary(data?.summary || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load stock report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        String(row.title || "").toLowerCase().includes(term) ||
        String(row.sku || "").toLowerCase().includes(term),
    );
  }, [rows, search]);

  const exportCsv = () => {
    const header = ["Product", "SKU", "Stock", "Low Stock Alert", "Price"];
    const body = filtered.map((row) => [
      row.title,
      row.sku,
      row.stock,
      row.lowStockThreshold,
      Number(row.regularPrice || 0).toFixed(2),
    ]);
    const csv = [header, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `product-stock-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadge = (row) => {
    const stock = Number(row.stock || 0);
    const threshold = Number(row.lowStockThreshold || 0);
    if (stock <= 0) return "border-red-200 bg-red-50 text-red-700";
    if (threshold > 0 && stock <= threshold) return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  };

  const statusLabel = (row) => {
    const stock = Number(row.stock || 0);
    const threshold = Number(row.lowStockThreshold || 0);
    if (stock <= 0) return "Out of stock";
    if (threshold > 0 && stock <= threshold) return "Low stock";
    return "Healthy";
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">Product Stock Report</h1>
          <p className="mt-1 text-sm text-slate-500">Current stock levels with low-stock alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiDownload size={14} /> Export CSV
          </button>
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Products", value: summary.count ?? rows.length, color: "text-black" },
            { label: "Total Stock", value: Number(summary.totalStock || 0), color: "text-black" },
            {
              label: "Low Stock",
              value: Number(summary.lowStock ?? summary.lowStockCount ?? 0),
              color: "text-amber-600",
            },
            {
              label: "Out of Stock",
              value: Number(summary.outOfStock ?? summary.outOfStockCount ?? 0),
              color: "text-red-600",
            },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className={`mt-1 text-lg font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search product or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Low Alert At</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">Loading report...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">No products found.</td></tr>
            ) : (
              filtered.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-black">{row.title}</td>
                  <td className="px-4 py-3 text-slate-600">{row.sku || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{Number(row.stock || 0)}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(row.lowStockThreshold || 0)}</td>
                  <td className="px-4 py-3">{Number(row.regularPrice || 0).toFixed(2)} Tk</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadge(row)}`}>
                      {statusLabel(row)}
                    </span>
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

export default ProductStockReport;
