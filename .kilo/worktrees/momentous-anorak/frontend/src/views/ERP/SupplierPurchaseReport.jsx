import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiDownload, FiRefreshCw } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Supplier-wise purchase report (reuses the /api/reports/module supplier type).
const SupplierPurchaseReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = { type: "supplier" };
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await axios.get(`${baseUrl}/reports/module`, {
        headers: getAuthHeaders(),
        params,
      });
      setRows(data?.rows || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportCsv = () => {
    const header = ["Supplier", "Phone", "Purchases", "Total", "Paid", "Due", "Current Due"];
    const body = rows.map((row) => [
      row.supplierName,
      row.phone,
      row.purchases,
      Number(row.totalAmount || 0).toFixed(2),
      Number(row.paidAmount || 0).toFixed(2),
      Number(row.dueAmount || 0).toFixed(2),
      Number(row.currentDue || 0).toFixed(2),
    ]);
    const csv = [header, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `supplier-purchase-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">Supplier Purchase Report</h1>
          <p className="mt-1 text-sm text-slate-500">Supplier-wise purchase totals with payment status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={!rows.length}
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

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Purchases</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Current Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">Loading report...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">No purchase data for this range.</td></tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-black">{row.supplierName}</td>
                  <td className="px-4 py-3 text-slate-600">{row.purchases}</td>
                  <td className="px-4 py-3 font-medium">{Number(row.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-600">{Number(row.paidAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-red-600">{Number(row.dueAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(row.currentDue || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierPurchaseReport;
