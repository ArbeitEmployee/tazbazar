import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MODE_META = {
  list: {
    title: "Campaign",
    description: "Create and manage campaign pages with banners and product selections.",
  },
  image: {
    title: "Campaign Image",
    description: "Manage campaign banner images.",
  },
  slider: {
    title: "Campaign Slider",
    description: "Manage campaign slider image galleries.",
  },
};

// CampaignManagement — reuses the single /api/campaigns backend for the full
// campaign list, image management and slider management pages.
const CampaignManagement = ({ initialMode = "list" }) => {
  const meta = MODE_META[initialMode] || MODE_META.list;
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(initialMode !== "list");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    bannerImage: "",
    sliderImages: [],
    products: [],
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/campaigns`, { headers: getAuthHeaders() });
      setCampaigns(data?.campaigns || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    axios
      .get(`${baseUrl}/products`, { headers: getAuthHeaders() })
      .then((response) => setProducts(response.data?.products || response.data?.data || []))
      .catch(() => null);
  }, []);

  const startEdit = (campaign) => {
    setEditingId(campaign._id);
    setForm({
      title: campaign.title || "",
      slug: campaign.slug || "",
      description: campaign.description || "",
      bannerImage: campaign.bannerImage || "",
      sliderImages: Array.isArray(campaign.sliderImages) ? campaign.sliderImages : [],
      products: Array.isArray(campaign.products)
        ? campaign.products.map((entry) => entry._id || entry)
        : [],
      startDate: campaign.startDate ? String(campaign.startDate).slice(0, 10) : "",
      endDate: campaign.endDate ? String(campaign.endDate).slice(0, 10) : "",
      isActive: campaign.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Campaign title is required");
    try {
      setSaving(true);
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        bannerImage: form.bannerImage,
        sliderImages: form.sliderImages,
        products: form.products,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isActive: form.isActive,
      };
      if (editingId) {
        await axios.patch(`${baseUrl}/campaigns/${editingId}`, payload, { headers: getAuthHeaders() });
        toast.success("Campaign updated");
      } else {
        await axios.post(`${baseUrl}/campaigns`, payload, { headers: getAuthHeaders() });
        toast.success("Campaign created");
      }
      setForm({ title: "", slug: "", description: "", bannerImage: "", sliderImages: [], products: [], startDate: "", endDate: "", isActive: true });
      setEditingId("");
      setShowForm(initialMode !== "list");
      fetchCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campaign) => {
    if (!window.confirm(`Delete campaign "${campaign.title}"?`)) return;
    try {
      await axios.delete(`${baseUrl}/campaigns/${campaign._id}`, { headers: getAuthHeaders() });
      toast.success("Campaign deleted");
      fetchCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    }
  };

  const toggleForm = (value) => ({ ...form, ...value });

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCampaigns}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => {
              setEditingId("");
              setShowForm((prev) => !prev);
            }}
            className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FiPlus size={14} /> New Campaign
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="auto-generated if empty"
              />
            </div>
            {initialMode !== "slider" && (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Banner Image URL</label>
                <input
                  type="text"
                  value={form.bannerImage}
                  onChange={(e) => setForm((prev) => ({ ...prev, bannerImage: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
                {form.bannerImage && (
                  <img src={form.bannerImage} alt="Banner preview" className="mt-2 h-28 w-full rounded-lg object-cover" />
                )}
              </div>
            )}
            {initialMode === "slider" && (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Slider Images (one URL per line)</label>
                <textarea
                  value={form.sliderImages.join("\n")}
                  onChange={(e) => setForm((prev) => ({ ...prev, sliderImages: e.target.value.split("\n").map((value) => value.trim()).filter(Boolean) }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://...\nhttps://..."
                />
                {form.sliderImages.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {form.sliderImages.map((image) => (
                      <img key={image} src={image} alt="slider" className="h-16 w-full rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
            )}
            {initialMode === "list" && (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Products</label>
              <select
                multiple
                value={form.products}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, products: Array.from(e.target.selectedOptions, (option) => option.value) }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.title || product.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Hold Ctrl/Cmd or Shift to select multiple.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4"
              />
              Active
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {editingId ? "Update Campaign" : "Create Campaign"}
            </button>
            <button
              type="button"
              onClick={() => { setEditingId(""); setShowForm(false); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Banner</th>
              <th className="px-4 py-3">Sliders</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400">Loading campaigns...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400">No campaigns found.</td></tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black">{campaign.title}</p>
                    <p className="text-xs text-slate-400">/{campaign.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {campaign.bannerImage ? (
                      <img src={campaign.bannerImage} alt="banner" className="h-10 w-20 rounded object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{Array.isArray(campaign.sliderImages) ? campaign.sliderImages.length : 0}</td>
                  <td className="px-4 py-3 text-slate-600">{Array.isArray(campaign.products) ? campaign.products.length : 0}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "—"}
                    {" → "}
                    {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "∞"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${campaign.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                      {campaign.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(campaign)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(campaign)}
                      className="ml-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-50"
                    >
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

export default CampaignManagement;