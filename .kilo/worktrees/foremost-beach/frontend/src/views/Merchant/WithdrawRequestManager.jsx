import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiRefreshCw } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const STATUS_BADGES = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-blue-200 bg-blue-50 text-blue-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const WithdrawRequestManager = () => {
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ user: "", name: "", phone: "", amount: 0, method: "bKash", accountNumber: "", note: "" });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/withdraw-requests`, {
        headers: getAuthHeaders(),
        params: statusFilter ? { status: statusFilter } : {},
      });
      setRequests(data?.requests || []);
      setSummary(data?.summary || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load withdraw requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    axios
      .get(`${baseUrl}/auth/admin/all-users`, { headers: getAuthHeaders() })
      .then((response) => {
        const list = response.data?.users || response.data?.data || [];
        setUsers(list.filter((entry) => entry.isReseller || entry.userType === "vendor"));
      })
      .catch(() => null);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!Number(form.amount)) return toast.error("Amount is required");
    try {
      setSaving(true);
      const { data } = await axios.post(`${baseUrl}/withdraw-requests`, form, { headers: getAuthHeaders() });
      if (data?.success) {
        toast.success("Withdraw request submitted");
        setForm({ user: "", name: "", phone: "", amount: 0, method: "bKash", accountNumber: "", note: "" });
        setShowForm(false);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (request, status) => {
    try {
      await axios.patch(`${baseUrl}/withdraw-requests/${request._id}/status`, { status }, { headers: getAuthHeaders() });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update request");
    }
  };

  const pendingTotal = useMemo(
    () => (summary?.pending || 0),
    [summary],
  );

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">Withdraw Request</h1>
          <p className="mt-1 text-sm text-slate-500">Review and process merchant / reseller withdrawal requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiPlus size={14} /> New Request
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total", value: summary.total, color: "text-black" },
            { label: "Pending", value: summary.pending, color: "text-amber-600" },
            { label: "Approved", value: summary.approved, color: "text-blue-600" },
            { label: "Paid", value: summary.paid, color: "text-emerald-600" },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className={`mt-1 text-lg font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">User</label>
            <select value={form.user} onChange={(e) => setForm((prev) => ({ ...prev, user: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">Walk-in / manual</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>{user.name || user.email || user.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount *</label>
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Method</label>
            <select value={form.method} onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option>bKash</option>
              <option>Nagad</option>
              <option>Rocket</option>
              <option>Bank</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Account Number</label>
            <input type="text" value={form.accountNumber} onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium">Note</label>
            <input type="text" value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50">
              {saving ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      )}

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="paid">Paid</option>
        <option value="rejected">Rejected</option>
      </select>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400">Loading requests...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400">No withdraw requests found.</td></tr>
            ) : (
              requests.map((request) => (
                <tr key={request._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black">{request.name || request.user?.name || "—"}</p>
                    <p className="text-xs text-slate-400">{request.phone || request.user?.phone || ""}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-black">{Number(request.amount || 0).toFixed(2)} Tk</td>
                  <td className="px-4 py-3 text-slate-600">{request.method}</td>
                  <td className="px-4 py-3 text-slate-600">{request.accountNumber || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${STATUS_BADGES[request.status] || STATUS_BADGES.pending}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {request.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleStatus(request, "approved")} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50">
                          Approve
                        </button>
                        <button onClick={() => handleStatus(request, "paid")} className="rounded-lg bg-black px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800">
                          Mark Paid
                        </button>
                        <button onClick={() => handleStatus(request, "rejected")} className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-50">
                          Reject
                        </button>
                      </div>
                    )}
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

export default WithdrawRequestManager;