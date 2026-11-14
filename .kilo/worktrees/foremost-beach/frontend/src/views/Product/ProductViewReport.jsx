import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiEye, FiRefreshCw, FiSearch } from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Product view report — products are tracked via viewCount (incremented by the
// public /api/products/:id/view endpoint). Sorted by most viewed.
const ProductViewReport = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${baseUrl}/products`, { headers: getAuthHeaders() });
      const list = data?.products || data?.data || [];
      setProducts(
        [...list].sort((a, b) => Number(b.viewCount || 0) - Number(a.viewCount || 0)),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load product views");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      String(product.title || product.name || "").toLowerCase().includes(term),
    );
  }, [products, search]);

  const totalViews = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.viewCount || 0), 0),
    [products],
  );

  return (
    <div className="app-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">Product View Report</h1>
          <p className="mt-1 text-sm text-slate-500">Most viewed products, tracked from the storefront.</p>
        </div>
        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Products</p>
          <p className="mt-1 text-lg font-bold text-black">{products.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Total Views</p>
          <p className="mt-1 text-lg font-bold text-black">{totalViews}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Top Product</p>
          <p className="mt-1 truncate text-lg font-bold text-black">
            {products[0]?.title || products[0]?.name || "—"}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Views</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="3" className="px-4 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="3" className="px-4 py-10 text-center text-slate-400">No products found.</td></tr>
            ) : (
              filtered.map((product, index) => (
                <tr key={product._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-black">
                    {product.title || product.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-black">
                      <FiEye size={14} className="text-slate-400" />
                      {Number(product.viewCount || 0)}
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

export default ProductViewReport;
