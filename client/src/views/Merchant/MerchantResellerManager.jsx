import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiRefreshCw, FiSearch } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MODE_META = {
  "manage-merchant": { title: "Manage Merchant", description: "Vendors / merchants selling on the platform.", listType: "vendor", showAdd: true },
  "add-merchant": { title: "Add Merchant", description: "Create a new merchant / vendor account.", listType: "vendor", showAdd: true, addOnly: true },
  "manage-reseller": { title: "Manage Reseller", description: "Resellers with discounted pricing privileges.", listType: "reseller", showAdd: true },
  "add-reseller": { title: "Add Reseller", description: "Create a new reseller account.", listType: "reseller", showAdd: true, addOnly: true },
  "payment-invoice": { title: "Payment Invoice", description: "Recent sales are invoiced here (generated from orders & sales).", listType: "vendor", showAdd: false },
};

const MerchantResellerManager = ({ initialMode = "manage-merchant" }) => {
  const meta = MODE_META[initialMode] || MODE_META["manage-merchant"];
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(!!meta.addOnly);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", storeName: "", resellerRate: 0 });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/auth/admin/all-users`, { headers: getAuthHeaders() });
      setUsers(data?.users || data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const isResellerUser = (user) => user.isReseller === true || user.isReseller === "true";

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = users.filter((user) => {
      if (meta.listType === "reseller") return isResellerUser(user);
      return user.userType === "vendor" || isResellerUser(user);
    });
    if (!term) return base;
    return base.filter((user) =>
      String(user.name || "").toLowerCase().includes(term) ||
      String(user.email || "").toLowerCase().includes(term) ||
      String(user.phone || "").toLowerCase().includes(term),
    );
  }, [meta.listType, search, users]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    const isReseller = meta.listType === "reseller";
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        userType: "vendor",
        isReseller,
        resellerRate: Number(form.resellerRate || 0),
      };
      const { data } = await axios.post(`${baseUrl}/auth/register`, payload);
      if (data?.success || data?.user || data?.token) {
        toast.success(isReseller ? "Reseller created" : "Merchant created");
        setForm({ name: "", email: "", phone: "", password: "", storeName: "", resellerRate: 0 });
        setShowForm(false);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account");
    } finally {
      setSaving(false);
    }
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
            onClick={fetchUsers}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          {meta.showAdd && (
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <FiPlus size={14} /> Add {meta.listType === "reseller" ? "Reseller" : "Merchant"}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password *</label>
            <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Store Name</label>
            <input type="text" value={form.storeName} onChange={(e) => setForm((prev) => ({ ...prev, storeName: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reseller Rate %</label>
            <input type="number" min="0" max="100" value={form.resellerRate} onChange={(e) => setForm((prev) => ({ ...prev, resellerRate: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50">
              {saving ? "Creating..." : `Create ${meta.listType === "reseller" ? "Reseller" : "Merchant"}`}
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search merchants / resellers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-400">No accounts found.</td></tr>
            ) : (
              filtered.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black">{user.name || "—"}</p>
                    <p className="text-xs text-slate-400">{user.storeName || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {user.email || ""}
                    {user.phone ? <span className="block">{user.phone}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{isResellerUser(user) ? "Reseller" : user.userType || "user"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {isResellerUser(user) ? `${Number(user.resellerRate || 0)}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${user.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                      {user.status || "active"}
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

export default MerchantResellerManager;