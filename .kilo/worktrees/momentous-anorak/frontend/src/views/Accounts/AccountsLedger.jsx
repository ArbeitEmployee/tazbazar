import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiRefreshCw } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// All accounts sub-pages reuse the same ledger API. Each mode only changes
// the default entry type / summary focus, so no duplicate ledger code exists.
const MODE_META = {
  income: { title: "Income", types: ["income", "adjustment"], entryType: "income", showSummary: true },
  expense: { title: "Expense", types: ["expense"], entryType: "expense", showSummary: true },
  due: { title: "Due", types: ["income", "expense", "salary", "bill", "loan", "payout", "fund_transfer", "adjustment"], entryType: "expense", showSummary: false, dueFocus: true },
  balance: { title: "Balance", types: [], entryType: "income", showSummary: true, balanceFocus: true },
  "fund-transfer": { title: "Fund Transfer", types: ["fund_transfer"], entryType: "fund_transfer", showSummary: false },
  "employee-salary": { title: "Employee Salary", types: ["salary"], entryType: "salary", showSummary: false },
  "bill-statements": { title: "Bill Statements", types: ["bill"], entryType: "bill", showSummary: false },
  loan: { title: "Loan", types: ["loan"], entryType: "loan", showSummary: false },
  withdrawal: { title: "Withdrawal", types: ["payout"], entryType: "payout", showSummary: false },
};

const ENTRY_TYPES = ["income", "expense", "fund_transfer", "salary", "bill", "payout", "loan", "adjustment"];

const AccountsLedger = ({ initialMode = "income" }) => {
  const mode = MODE_META[initialMode] ? initialMode : "income";
  const meta = MODE_META[mode];

  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    type: meta.entryType,
    title: "",
    category: "",
    amount: 0,
    note: "",
    entryDate: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (meta.types.length) params.types = meta.types.join(",");
      const requests = [
        axios.get(`${baseUrl}/accounts/entries`, { headers: getAuthHeaders(), params }),
        axios.get(`${baseUrl}/accounts/summary`, { headers: getAuthHeaders() }),
        axios.get(`${baseUrl}/accounts/purposes`, { headers: getAuthHeaders() }).catch(() => null),
      ];
      const [entriesRes, summaryRes, purposesRes] = await Promise.all(requests);
      setEntries(entriesRes.data?.entries || []);
      setSummary(summaryRes.data?.summary || null);
      setPurposes(purposesRes?.data?.purposes || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load accounts data");
    } finally {
      setLoading(false);
    }
  }, [meta.types]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, type: meta.entryType }));
  }, [meta.entryType]);

  const totals = useMemo(() => {
    const income = entries
      .filter((entry) => ["income", "adjustment"].includes(entry.type))
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const expense = entries
      .filter((entry) => !["income", "adjustment"].includes(entry.type))
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [entries]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!Number(form.amount)) return toast.error("Amount is required");
    try {
      setSaving(true);
      const payload = {
        type: form.type,
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        note: form.note,
        entryDate: form.entryDate || undefined,
      };
      if (editingId) {
        await axios.patch(`${baseUrl}/accounts/entries/${editingId}`, payload, { headers: getAuthHeaders() });
        toast.success("Entry updated");
      } else {
        await axios.post(`${baseUrl}/accounts/entries`, payload, { headers: getAuthHeaders() });
        toast.success("Entry created");
      }
      setForm({ type: meta.entryType, title: "", category: "", amount: 0, note: "", entryDate: "" });
      setEditingId("");
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete "${entry.title}"?`)) return;
    try {
      await axios.delete(`${baseUrl}/accounts/entries/${entry._id}`, { headers: getAuthHeaders() });
      toast.success("Entry deleted");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete entry");
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setForm({
      type: entry.type || meta.entryType,
      title: entry.title || "",
      category: entry.category || "",
      amount: entry.amount || 0,
      note: entry.note || "",
      entryDate: entry.entryDate ? String(entry.entryDate).slice(0, 10) : "",
    });
    setShowForm(true);
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {meta.balanceFocus
              ? "Overall income vs expense balance overview."
              : meta.dueFocus
                ? "Payables and receivables overview from ledger entries."
                : `Ledger entries recorded under ${meta.title}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiPlus size={14} /> New Entry
          </button>
        </div>
      </div>

      {(meta.showSummary || meta.balanceFocus || meta.dueFocus) && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {meta.balanceFocus && summary?.breakdownByType ? (
            Object.entries(summary.breakdownByType).slice(0, 4).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">{key.replace(/_/g, " ")}</p>
                <p className="mt-1 text-lg font-bold text-black">{Number(value || 0).toFixed(2)} Tk</p>
              </div>
            ))
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Income (filtered)</p>
                <p className="mt-1 text-lg font-bold text-emerald-600">{totals.income.toFixed(2)} Tk</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Expense (filtered)</p>
                <p className="mt-1 text-lg font-bold text-red-600">{totals.expense.toFixed(2)} Tk</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Balance</p>
                <p className="mt-1 text-lg font-bold text-black">{totals.balance.toFixed(2)} Tk</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Entries</p>
                <p className="mt-1 text-lg font-bold text-black">{entries.length}</p>
              </div>
            </>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Entry Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Purpose / Category</label>
            <input
              type="text"
              list="account-purposes-list"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <datalist id="account-purposes-list">
              {purposes.map((purpose) => (
                <option key={purpose._id} value={purpose.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input
              type="date"
              value={form.entryDate}
              onChange={(e) => setForm((prev) => ({ ...prev, entryDate: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Note</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {editingId ? "Update Entry" : "Save Entry"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId("");
                  setShowForm(false);
                  setForm({ type: meta.entryType, title: "", category: "", amount: 0, note: "", entryDate: "" });
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}


      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">Loading entries...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">No entries found.</td></tr>
            ) : (
              entries.map((entry) => {
                const isIncome = ["income", "adjustment"].includes(entry.type);
                return (
                  <tr key={entry._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-slate-600">
                      {entry.entryDate ? new Date(entry.entryDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{String(entry.type || "").replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 font-medium text-black">{entry.title}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.category || "—"}</td>
                    <td className={`px-4 py-3 font-semibold ${isIncome ? "text-emerald-600" : "text-red-600"}`}>
                      {isIncome ? "+" : "−"}{Number(entry.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(entry)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="ml-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AccountsLedger;
