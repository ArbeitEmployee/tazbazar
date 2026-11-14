import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// LandingPageManager — manage + create view over the existing /api/landing-pages
// module (already used by the storefront /lp/[slug] pages).
const LandingPageManager = ({ initialMode = "manage" }) => {
  const [pages, setPages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(initialMode === "add");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    headline: "",
    subheadline: "",
    description: "",
    bannerImage: "",
    products: [],
    theme: "clean",
    isActive: true,
  });

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/landing-pages`, { headers: getAuthHeaders() });
      setPages(data?.pages || data?.landingPages || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load landing pages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    axios
      .get(`${baseUrl}/products`, { headers: getAuthHeaders() })
      .then((response) => setProducts(response.data?.products || response.data?.data || []))
      .catch(() => null);
  }, []);

  const startEdit = (page) => {
    setEditingId(page._id);
    setForm({
      title: page.title || "",
      slug: page.slug || "",
      headline: page.headline || "",
      subheadline: page.subheadline || "",
      description: page.description || "",
      bannerImage: page.bannerImage || "",
      products: (page.products || []).map((entry) => entry._id || entry),
      theme: page.theme || "clean",
      isActive: page.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    try {
      setSaving(true);
      const payload = {
        title: form.title,
        slug: form.slug,
        headline: form.headline,
        subheadline: form.subheadline,
        description: form.description,
        bannerImage: form.bannerImage,
        products: form.products,
        theme: form.theme,
        isActive: form.isActive,
      };
      if (editingId) {
        await axios.patch(`${baseUrl}/landing-pages/${editingId}`, payload, { headers: getAuthHeaders() });
        toast.success("Landing page updated");
      } else {
        await axios.post(`${baseUrl}/landing-pages`, payload, { headers: getAuthHeaders() });
        toast.success("Landing page created");
      }
      setForm({ title: "", slug: "", headline: "", subheadline: "", description: "", bannerImage: "", products: [], theme: "clean", isActive: true });
      setEditingId("");
      setShowForm(false);
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save landing page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete landing page "${page.title}"?`)) return;
    try {
      await axios.delete(`${baseUrl}/landing-pages/${page._id}`, { headers: getAuthHeaders() });
      toast.success("Landing page deleted");
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete landing page");
    }
  };

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">
            {initialMode === "add" ? "Add Landing Page" : "Manage Landing Page"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage campaign-style landing pages.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPages}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setEditingId(""); setShowForm((prev) => !prev); }}
            className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiPlus size={14} /> New Page
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="auto-generated if empty" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Headline</label>
              <input type="text" value={form.headline} onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Subheadline</label>
              <input type="text" value={form.subheadline} onChange={(e) => setForm((prev) => ({ ...prev, subheadline: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Banner Image URL</label>
              <input type="text" value={form.bannerImage} onChange={(e) => setForm((prev) => ({ ...prev, bannerImage: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="https://..." />
              {form.bannerImage && <img src={form.bannerImage} alt="banner preview" className="mt-2 h-28 w-full rounded-lg object-cover" />}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Products</label>
              <select
                multiple
                value={form.products}
                onChange={(e) => setForm((prev) => ({ ...prev, products: Array.from(e.target.selectedOptions, (option) => option.value) }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.title || product.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Hold Ctrl/Cmd or Shift to select multiple.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} className="h-4 w-4" />
              Active
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update Page" : "Create Page"}
            </button>
            <button type="button" onClick={() => { setEditingId(""); setShowForm(false); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">Loading landing pages...</td></tr>
            ) : pages.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">No landing pages found.</td></tr>
            ) : (
              pages.map((page) => (
                <tr key={page._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-black">{page.title}</td>
                  <td className="px-4 py-3 text-slate-600">/{page.slug}</td>
                  <td className="px-4 py-3 text-slate-600">{Array.isArray(page.products) ? page.products.length : 0}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(page.viewCount || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${page.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                      {page.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(page)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(page)} className="ml-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-50">
                      Delete
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

export default LandingPageManager;