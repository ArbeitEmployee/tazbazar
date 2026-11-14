import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiPlus, FiRefreshCw, FiSave, FiTrash2, FiX } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MODE_META = {
  attribute: {
    title: "Attribute / Size",
    description: "Manage size / attribute presets attached to products (e.g. S, M, L, XL).",
    presetName: "size",
    optionLabel: "Size options (comma separated)",
    optionPlaceholder: "S, M, L, XL",
  },
  variant: {
    title: "Variant",
    description: "Manage variant definitions attached to products (e.g. Red, Blue, 250ml).",
    presetName: "color",
    optionLabel: "Variant options (comma separated)",
    optionPlaceholder: "Red, Green, Blue",
  },
};

// ProductAttributeManager — edits each product's variantDefinitions
// (schema: preset size/color/custom + options with label/value). This is the
// same structure ProductCreate uses, so data stays consistent end to end.
const ProductAttributeManager = ({ initialMode = "attribute" }) => {
  const meta = MODE_META[initialMode] ? MODE_META[initialMode] : MODE_META.attribute;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [selected, setSelected] = useState(null);
  const [definitions, setDefinitions] = useState([]);
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/products`, { headers: getAuthHeaders() });
      setProducts(data?.products || data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openProduct = (product) => {
    setSelected(product);
    const defs = Array.isArray(product.variantDefinitions) ? product.variantDefinitions : [];
    setDefinitions(
      defs.map((definition) => ({
        preset: definition.preset || "custom",
        name: definition.name || "",
        options: (definition.options || []).map((option) => option.label || option.value || ""),
      })),
    );
  };

  const addDefinition = () => {
    setDefinitions((prev) => [
      ...prev,
      { preset: meta.presetName, name: meta.presetName === "size" ? "Size" : "Variant", options: [] },
    ]);
  };

  const saveProduct = async () => {
    if (!selected) return;
    try {
      setSavingId(selected._id);
      const payload = {
        variantDefinitions: definitions.map((definition) => ({
          preset: definition.preset,
          name: definition.name,
          options: (definition.options || [])
            .map((label) => String(label || "").trim())
            .filter(Boolean)
            .map((label) => ({ label, value: label })),
        })),
      };
      await axios.put(`${baseUrl}/products/${selected._id}`, payload, { headers: getAuthHeaders() });
      toast.success("Saved successfully");
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setSavingId("");
    }
  };

  const filtered = products.filter((product) =>
    String(product.title || product.name || "").toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {selected ? (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-black">{selected.title || selected.name}</h2>
              <p className="text-xs text-slate-500">
                {selected.sku ? `SKU: ${selected.sku}` : "No SKU"} · {definitions.length} definition(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addDefinition}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <FiPlus size={14} /> Add Definition
              </button>
              <button
                onClick={saveProduct}
                disabled={savingId === selected._id}
                className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                <FiSave size={14} /> {savingId === selected._id ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => { setSelected(null); setDefinitions([]); }}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                title="Close"
              >
                <FiX size={15} />
              </button>
            </div>
          </div>

          {definitions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No definitions yet. Click "Add Definition" to create one.
            </p>
          ) : (
            definitions.map((definition, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4 md:grid-cols-12">
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Preset</label>
                  <select
                    value={definition.preset}
                    onChange={(e) =>
                      setDefinitions((prev) =>
                        prev.map((entry, i) => (i === index ? { ...entry, preset: e.target.value } : entry)),
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="size">Size</option>
                    <option value="color">Color</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
                  <input
                    type="text"
                    value={definition.name}
                    onChange={(e) =>
                      setDefinitions((prev) =>
                        prev.map((entry, i) => (i === index ? { ...entry, name: e.target.value } : entry)),
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="mb-1 block text-xs font-medium text-slate-500">{meta.optionLabel}</label>
                  <input
                    type="text"
                    value={(definition.options || []).join(", ")}
                    onChange={(e) =>
                      setDefinitions((prev) =>
                        prev.map((entry, i) =>
                          i === index
                            ? { ...entry, options: e.target.value.split(",").map((value) => value.trim()) }
                            : entry,
                        ),
                      )
                    }
                    placeholder={meta.optionPlaceholder}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end justify-end md:col-span-1">
                  <button
                    onClick={() => setDefinitions((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Remove definition"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="py-6 text-center text-slate-400 md:col-span-3">Loading products...</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-slate-400 md:col-span-3">No products found.</p>
            ) : (
              filtered.slice(0, 60).map((product) => (
                <button
                  key={product._id}
                  onClick={() => openProduct(product)}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-black"
                >
                  <p className="font-medium text-black">{product.title || product.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(product.variantDefinitions || []).length} definition(s) ·{" "}
                    {Number(product.stock || 0)} in stock
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductAttributeManager;
