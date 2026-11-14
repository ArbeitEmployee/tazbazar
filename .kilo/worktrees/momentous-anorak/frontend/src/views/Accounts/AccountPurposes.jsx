import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AccountPurposes = () => {
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "both" });

  const fetchPurposes = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/accounts/purposes`, { headers: getAuthHeaders() });
      setPurposes(data?.purposes || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load purposes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurposes();
  }, [fetchPurposes]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Purpose name is required");
    try {
      setSaving(true);
      await axios.post(`${baseUrl}/accounts/purposes`, form, { headers: getAuthHeaders() });
      toast.success("Purpose created");
      setForm({ name: "", type: "both" });
      fetchPurposes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create purpose");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (purpose) => {
    if (!window.confirm(`Delete purpose "${purpose.name}"?`)) return;
    try {
      await axios.delete(`${baseUrl}/accounts/purposes/${purpose._id}`, { headers: getAuthHeaders() });
      toast.success("Purpose deleted");
      fetchPurposes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete purpose");
    }
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">Account Purpose</h1>
          <p className="mt-1 text-sm text-slate-500">
            Purposes used across income / expense ledger entries.
          </p>
        </div>
        <button
          onClick={fetchPurposes}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="min-w-52 flex-1">
          <label className="mb-1 block text-sm font-medium">Purpose Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g. Office Rent, Marketing, Utility Bill"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Applies To</label>
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="both">Both</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          <FiPlus size={14} /> Add Purpose
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="py-6 text-center text-slate-400 md:col-span-3">Loading purposes...</p>
        ) : purposes.length === 0 ? (
          <p className="py-6 text-center text-slate-400 md:col-span-3">No purposes yet. Add your first one above.</p>
        ) : (
          purposes.map((purpose) => (
            <div key={purpose._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-medium text-black">{purpose.name}</p>
                <p className="text-xs capitalize text-slate-500">{purpose.type}</p>
              </div>
              <button
                onClick={() => handleDelete(purpose)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                title="Delete"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountPurposes;
