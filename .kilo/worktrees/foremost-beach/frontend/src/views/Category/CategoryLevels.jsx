import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const LEVEL_META = {
  sub: {
    title: "Sub Category",
    description: "Second-level categories nested under main categories.",
    parentLabel: "Main Category",
    parentLevel: "main",
  },
  subsub: {
    title: "Sub Sub Category",
    description: "Third-level categories nested under sub categories.",
    parentLabel: "Sub Category",
    parentLevel: "sub",
  },
};

// Shared manager for Sub Category / Sub Sub Category pages.
// Reuses the same /api/categories backend as Main Category (no duplicate CRUD).
const CategoryLevels = ({ level = "sub" }) => {
  const meta = LEVEL_META[level] || LEVEL_META.sub;
  const [categories, setCategories] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({ name: "", description: "", parent: "" });
  const [filterParent, setFilterParent] = useState("");

  const fetchParents = useCallback(async () => {
    try {
      if (meta.parentLevel === "main") {
        const { data } = await axios.get(`${baseUrl}/categories?level=main`, { headers: getAuthHeaders() });
        setParents(data?.categories || []);
      } else {
        const mainRes = await axios.get(`${baseUrl}/categories?level=main`, { headers: getAuthHeaders() });
        const mains = mainRes.data?.categories || [];
        const subs = [];
        for (const main of mains) {
          const childRes = await axios.get(`${baseUrl}/categories?parentId=${main._id}`, {
            headers: getAuthHeaders(),
          });
          (childRes.data?.categories || []).forEach((sub) => subs.push({ ...sub, parentName: main.name }));
        }
        setParents(subs);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load parent categories");
    }
  }, [meta.parentLevel]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const query = filterParent ? `parentId=${filterParent}` : "";
      const { data } = await axios.get(`${baseUrl}/categories${query ? `?${query}` : ""}`, {
        headers: getAuthHeaders(),
      });
      const all = data?.categories || [];
      // Client-side level filter: keep only entries whose parent is at our parent level
      const parentIds = new Set(parents.map((parent) => parent._id));
      const filtered = filterParent
        ? all
        : all.filter((category) => {
            const parentId = category.parent?._id || category.parent;
            return parentId ? parentIds.has(parentId) : meta.parentLevel === "main";
          });
      setCategories(filtered);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [filterParent, meta.parentLevel, parents]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Category name is required");
    if (!form.parent) return toast.error(`Select a ${meta.parentLabel}`);
    try {
      setSaving(true);
      const payload = { name: form.name, description: form.description, parent: form.parent };
      if (editingId) {
        await axios.put(`${baseUrl}/categories/${editingId}`, payload, { headers: getAuthHeaders() });
        toast.success("Category updated");
      } else {
        await axios.post(`${baseUrl}/categories`, payload, { headers: getAuthHeaders() });
        toast.success("Category created");
      }
      setForm({ name: "", description: "", parent: "" });
      setEditingId("");
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name || "",
      description: category.description || "",
      parent: category.parent?._id || category.parent || "",
    });
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      await axios.delete(`${baseUrl}/categories/${category._id}`, { headers: getAuthHeaders() });
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    }
  };

  const parentName = (category) => {
    const parentId = category.parent?._id || category.parent;
    const parent = parents.find((entry) => entry._id === parentId);
    return parent?.name || "—";
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
        <button
          onClick={() => { fetchCategories(); fetchParents(); }}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{meta.parentLabel} *</label>
          <select
            value={form.parent}
            onChange={(e) => setForm((prev) => ({ ...prev, parent: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select {meta.parentLabel}</option>
            {parents.map((parent) => (
              <option key={parent._id} value={parent._id}>
                {meta.parentLevel === "sub" && parent.parentName ? `${parent.parentName} → ${parent.name}` : parent.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <FiPlus size={14} /> {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(""); setForm({ name: "", description: "", parent: "" }); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <select
        value={filterParent}
        onChange={(e) => setFilterParent(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">All {meta.parentLabel}s</option>
        {parents.map((parent) => (
          <option key={parent._id} value={parent._id}>{parent.name}</option>
        ))}
      </select>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">{meta.parentLabel}</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-400">No categories found.</td></tr>
            ) : (
              categories.map((category) => (
                <tr key={category._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-black">{category.name}</td>
                  <td className="px-4 py-3 text-slate-600">{parentName(category)}</td>
                  <td className="px-4 py-3 text-slate-600">{category.description || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${category.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(category)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-black" title="Edit">
                        <FiEdit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(category)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Delete">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
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

export default CategoryLevels;
