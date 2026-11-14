import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiRefreshCw } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Supplier due = opening/current due from supplier profile + unpaid purchase dues
// (aggregated from the supplier report endpoint, so no duplicate data source).
const SupplierDues = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchDues = useCallback(async () => {
    try {
      setLoading(true);
      const params = { type: "supplier" };
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await axios.get(`${baseUrl}/reports/module`, {
        headers: getAuthHeaders(),
        params,
      });
      setSuppliers(data?.rows || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load supplier dues");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  const totalDue = suppliers.reduce((sum, row) => sum + Number(row.dueAmount || 0), 0);

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">Supplier Due</h1>
          <p className="mt-1 text-sm text-slate-500">Outstanding dues per supplier from purchase records.</p>
        </div>
        <button
          onClick={fetchDues}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="ml-auto rounded-lg bg-red-50 px-4 py-2">
          <p className="text-xs uppercase tracking-wider text-red-500">Total Due</p>
          <p className="text-lg font-bold text-red-600">{totalDue.toFixed(2)} Tk</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Purchases</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">No supplier dues found.</td></tr>
            ) : (
              suppliers.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-black">{row.supplierName}</td>
                  <td className="px-4 py-3 text-slate-600">{row.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{row.purchases}</td>
                  <td className="px-4 py-3">{Number(row.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-600">{Number(row.paidAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">{Number(row.dueAmount || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierDues;
