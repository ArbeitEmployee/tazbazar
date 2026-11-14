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

// Maps the Report menu items to the supported /api/reports/module types.
const REPORT_MODES = {
  "profit-loss": { title: "Profit / Loss Report", type: "profit" },
  "product-stock-profit": { title: "Product Stock and Profit", type: "stock" },
  "order-report": { title: "Order Report", type: "sales" },
  "office-sale-report": { title: "Office Sale Report", type: "office-sale" },
  "order-profit": { title: "Order Profit", type: "sales" },
  "sale-profit": { title: "Sale Profit", type: "profit" },
  "purchase-report": { title: "Purchase Report", type: "purchases" },
  "supplier-report": { title: "Supplier Report", type: "supplier" },
  "stock-report": { title: "Stock Report", type: "stock" },
  "account-report": { title: "Account Report", type: "account" },
};

const ReportCenter = ({ initialMode = "profit-loss" }) => {
  const meta = REPORT_MODES[initialMode] || REPORT_MODES["profit-loss"];
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = { type: meta.type };
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await axios.get(`${baseUrl}/reports/module`, {
        headers: getAuthHeaders(),
        params,
      });
      setRows(data?.rows || []);
      setSummary(data?.summary || null);
      setColumns(data?.columns || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [from, meta.type, to]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportCsv = () => {
    const header = columns.map((column) => column.label);
    const body = rows.map((row) => columns.map((column) => row[column.key]));
    const csv = [header, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const slug = meta.type.replace(/[^a-z0-9]+/g, "-");
    link.setAttribute("download", `${slug}-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCell = (column, value) => {
    if (value === undefined || value === null) return "—";
    if (column.type === "date" && value) {
      return new Date(value).toLocaleString();
    }
    if (column.type === "currency") {
      return `${Number(value || 0).toFixed(2)} Tk`;
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  const summaryCards = summary && typeof summary === "object" && Object.keys(summary).length
    ? Object.entries(summary).slice(0, 4)
    : [];

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Report type: <strong>{meta.type}</strong> · {rows.length} rows
          </p>
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

      {summaryCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {summaryCards.map(([key, value]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(key).replace(/_/g, " ")}</p>
              <p className="mt-1 text-lg font-bold text-black">
                {typeof value === "number" ? Number(value).toFixed(2) : value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3">{column.label}</th>
              ))}
              {columns.length === 0 && <th className="px-4 py-3">Data</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={Math.max(1, columns.length)} className="px-4 py-10 text-center text-slate-400">Loading report...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={Math.max(1, columns.length)} className="px-4 py-10 text-center text-slate-400">No data for this report.</td></tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/70">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-slate-700">
                      {formatCell(column, row[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportCenter;