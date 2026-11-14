import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUserPlus,
  FiCheck,
  FiX,
  FiShoppingCart,
  FiFileText,
  FiDollarSign,
  FiPackage,
  FiCalendar,
  FiCheckCircle,
  FiEdit3,
} from "react-icons/fi";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MODE_META = {
  add: { title: "Add Purchase", description: "Record a new supplier purchase into inventory.", type: "product" },
  manage: { title: "Manage Purchase", description: "Browse, edit, filter and record supplier purchase payments.", type: "" },
  variant: { title: "Variant Purchase", description: "Purchase inventory products.", type: "product" },
  fabric: { title: "Fabrics Purchase", description: "Manage raw materials and fabric supplies.", type: "fabric" },
};

const emptyItem = {
  productId: "",
  productTitle: "",
  productImage: "",
  stock: 0,
  quantity: 1,
  purchasePrice: 0,
};

const PurchaseManager = ({ initialMode = "manage" }) => {
  const mode = MODE_META[initialMode] ? initialMode : "manage";
  const meta = MODE_META[mode];

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(mode === "add" || mode === "variant" || mode === "fabric");

  // Filtering
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  // Payment Modal
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [paying, setPaying] = useState(false);

  // Edit Purchase Modal
  const [editTarget, setEditTarget] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    supplierId: "",
    invoiceNumber: "",
    purchaseDate: "",
    paidAmount: 0,
    notes: "",
  });

  // Delete Confirm
  const [deletingId, setDeletingId] = useState(null);

  // Supplier Add Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    openingDue: 0,
  });

  // Purchase Form
  const [form, setForm] = useState({
    supplierId: "",
    invoiceNumber: `INV-PUR-${Date.now().toString().slice(-6)}`,
    purchaseDate: new Date().toISOString().split("T")[0],
    paidAmount: 0,
    notes: "",
    purchaseType: meta.type || "product",
    items: [{ ...emptyItem }],
  });

  const fetchLookups = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const supReq = axios
        .get(`${baseUrl}/suppliers`, { headers })
        .then((res) => res.data?.data || res.data?.suppliers || [])
        .catch((err) => {
          console.warn("Suppliers fetch fallback:", err.message);
          return [];
        });

      const prodReq = axios
        .get(`${baseUrl}/products`, { headers })
        .then((res) => {
          const list = res.data?.products || res.data?.data || [];
          return Array.isArray(list) ? list : [];
        })
        .catch(async () => {
          try {
            const pub = await axios.get(`${baseUrl}/products/public`);
            return pub.data?.products || [];
          } catch {
            return [];
          }
        });

      const [supplierList, productList] = await Promise.all([supReq, prodReq]);
      setSuppliers(supplierList);
      setProducts(productList);

      if (supplierList.length > 0 && !form.supplierId) {
        setForm((prev) => ({ ...prev, supplierId: supplierList[0]._id }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load suppliers/products");
    }
  }, [form.supplierId]);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (meta.type) params.purchaseType = meta.type;

      const { data } = await axios.get(`${baseUrl}/purchases`, {
        headers: getAuthHeaders(),
        params,
      });
      setPurchases(data?.purchases || []);
      setSummary(data?.summary || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [meta.type, paymentStatus, search]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const total = useMemo(
    () =>
      form.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.purchasePrice || 0),
        0
      ),
    [form.items]
  );

  const dueAmount = useMemo(() => {
    const paid = Number(form.paidAmount || 0);
    return Math.max(0, total - paid);
  }, [total, form.paidAmount]);

  const generateNewInvoice = () => {
    const inv = `INV-PUR-${Date.now().toString().slice(-6)}`;
    setForm((prev) => ({ ...prev, invoiceNumber: inv }));
    toast.success(`Generated Invoice: ${inv}`);
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      setSupplierSaving(true);
      const { data } = await axios.post(
        `${baseUrl}/suppliers`,
        {
          name: newSupplier.name.trim(),
          phone: newSupplier.phone.trim(),
          email: newSupplier.email.trim(),
          address: newSupplier.address.trim(),
          openingDue: Number(newSupplier.openingDue || 0),
        },
        { headers: getAuthHeaders() }
      );

      const created = data?.data || data?.supplier;
      if (created) {
        toast.success(`Supplier "${created.name}" created successfully!`);
        setSuppliers((prev) => [created, ...prev]);
        setForm((prev) => ({ ...prev, supplierId: created._id }));
        setShowSupplierModal(false);
        setNewSupplier({ name: "", phone: "", email: "", address: "", openingDue: 0 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to create supplier");
    } finally {
      setSupplierSaving(false);
    }
  };

  const updateItem = (index, patch) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  };

  const selectProductForItem = (index, productId) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) {
      updateItem(index, {
        productId: "",
        productTitle: "",
        productImage: "",
        stock: 0,
        purchasePrice: 0,
      });
      return;
    }

    const suggestedPrice = prod.costPrice || prod.price || 0;
    const img = Array.isArray(prod.images) && prod.images.length ? prod.images[0] : "";

    updateItem(index, {
      productId: prod._id,
      productTitle: prod.title || prod.name || "Product",
      productImage: img,
      stock: prod.stock || 0,
      purchasePrice: suggestedPrice,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.supplierId) {
      toast.error("Please select a supplier or create one with '+ Add Supplier'");
      return;
    }
    if (!form.invoiceNumber.trim()) {
      toast.error("Invoice number is required");
      return;
    }

    const items = form.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: Math.max(1, Number(item.quantity || 1)),
        purchasePrice: Math.max(0, Number(item.purchasePrice || 0)),
      }));

    if (!items.length) {
      toast.error("Please select at least one product with valid quantity and price");
      return;
    }

    try {
      setSaving(true);
      const { data } = await axios.post(
        `${baseUrl}/purchases`,
        {
          supplierId: form.supplierId,
          invoiceNumber: form.invoiceNumber.trim(),
          purchaseDate: form.purchaseDate || undefined,
          paidAmount: Number(form.paidAmount || 0),
          notes: form.notes,
          purchaseType: form.purchaseType || "product",
          items,
        },
        { headers: getAuthHeaders() }
      );

      if (data?.success) {
        toast.success("Purchase recorded & inventory stock updated successfully!");
        setForm({
          supplierId: suppliers[0]?._id || "",
          invoiceNumber: `INV-PUR-${Date.now().toString().slice(-6)}`,
          purchaseDate: new Date().toISOString().split("T")[0],
          paidAmount: 0,
          notes: "",
          purchaseType: meta.type || "product",
          items: [{ ...emptyItem }],
        });
        setShowForm(false);
        fetchPurchases();
        fetchLookups();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create purchase");
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (purchase) => {
    setEditTarget(purchase);
    setEditForm({
      supplierId: purchase.supplier?._id || purchase.supplier || "",
      invoiceNumber: purchase.invoiceNumber || "",
      purchaseDate: purchase.purchaseDate
        ? new Date(purchase.purchaseDate).toISOString().split("T")[0]
        : "",
      paidAmount: Number(purchase.paidAmount || 0),
      notes: purchase.notes || "",
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    try {
      setEditing(true);
      const { data } = await axios.patch(
        `${baseUrl}/purchases/${editTarget._id}`,
        {
          supplierId: editForm.supplierId,
          invoiceNumber: editForm.invoiceNumber,
          purchaseDate: editForm.purchaseDate,
          paidAmount: Number(editForm.paidAmount || 0),
          notes: editForm.notes,
        },
        { headers: getAuthHeaders() }
      );

      if (data?.success) {
        toast.success("Purchase updated successfully!");
        setEditTarget(null);
        fetchPurchases();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update purchase");
    } finally {
      setEditing(false);
    }
  };

  // Handle Delete Purchase
  const handleDeletePurchase = async (purchaseId) => {
    if (!window.confirm("Are you sure you want to delete this purchase? Stock will be reverted automatically.")) {
      return;
    }

    try {
      setDeletingId(purchaseId);
      const { data } = await axios.delete(`${baseUrl}/purchases/${purchaseId}`, {
        headers: getAuthHeaders(),
      });

      if (data?.success) {
        toast.success("Purchase deleted and stock reverted");
        fetchPurchases();
        fetchLookups();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete purchase");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePay = async (event) => {
    event.preventDefault();
    if (!payTarget || !Number(payAmount)) return;
    try {
      setPaying(true);
      const { data } = await axios.patch(
        `${baseUrl}/purchases/${payTarget._id}/payment`,
        { amount: Number(payAmount) },
        { headers: getAuthHeaders() }
      );
      if (data?.success) {
        toast.success("Payment recorded successfully");
        setPayTarget(null);
        setPayAmount(0);
        fetchPurchases();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setPaying(false);
    }
  };

  const statusBadge = (value) => {
    const map = {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      partial: "bg-amber-50 text-amber-700 border-amber-200",
      unpaid: "bg-red-50 text-red-700 border-red-200",
    };
    return map[value] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  const selectedSupplierObj = suppliers.find((s) => s._id === form.supplierId);

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiShoppingCart size={22} />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">{meta.title}</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchPurchases();
              fetchLookups();
              toast.success("Data reloaded");
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
          >
            <FiRefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <FiPlus size={16} /> {showForm ? "Hide Form" : "New Purchase"}
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Purchases</span>
              <FiPackage className="text-indigo-500" size={18} />
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.count ?? purchases.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
              <FiFileText className="text-blue-500" size={18} />
            </div>
            <p className="text-2xl font-black text-slate-900">৳ {Number(summary.totalAmount || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Paid Amount</span>
              <FiCheckCircle size={18} />
            </div>
            <p className="text-2xl font-black text-emerald-600">৳ {Number(summary.paidAmount || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Due</span>
              <FiDollarSign size={18} />
            </div>
            <p className="text-2xl font-black text-rose-600">৳ {Number(summary.dueAmount || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* PURCHASE CREATION FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Purchase Order Details</span>
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Category: {form.purchaseType}
            </span>
          </div>

          {/* Supplier & Invoice Row */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Supplier *</label>
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <FiUserPlus size={14} /> + New Supplier
                </button>
              </div>

              {suppliers.length === 0 ? (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  <span>No supplier found!</span>
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="font-bold underline text-amber-900"
                  >
                    Add One Now
                  </button>
                </div>
              ) : (
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplierId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.phone ? `(${s.phone})` : ""}
                    </option>
                  ))}
                </select>
              )}

              {selectedSupplierObj && (
                <p className="text-xs text-slate-500 pt-0.5">
                  Phone: {selectedSupplierObj.phone || "—"} | Address: {selectedSupplierObj.address || "—"}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Invoice / Memo No *</label>
                <button
                  type="button"
                  onClick={generateNewInvoice}
                  className="text-xs text-slate-500 hover:text-indigo-600 transition"
                >
                  Generate Auto
                </button>
              </div>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="e.g. INV-PUR-1001"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Purchase Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Products in this Purchase</h3>
              <span className="text-xs text-slate-400">Total Items: {form.items.length}</span>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => {
                const selectedProd = products.find((p) => p._id === item.productId);
                const lineTotal = Number(item.quantity || 0) * Number(item.purchasePrice || 0);

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/70 items-center transition hover:border-slate-300"
                  >
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Product *</label>
                      <div className="flex items-center gap-2">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <FiPackage size={16} />
                          </div>
                        )}
                        <select
                          value={item.productId}
                          onChange={(e) => selectProductForItem(index, e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                          required
                        >
                          <option value="">-- Select Product ({products.length} available) --</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.title || p.name} (Stock: {p.stock || 0})
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedProd && (
                        <p className="text-[11px] text-slate-500 pl-11">
                          Current Stock: <span className="font-semibold text-slate-700">{selectedProd.stock || 0}</span> | Regular Sell: ৳{selectedProd.price}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 text-center focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Unit Cost (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.purchasePrice}
                        onChange={(e) => updateItem(index, { purchasePrice: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">Subtotal</span>
                        <span className="text-sm font-bold text-slate-900">৳{lineTotal.toFixed(0)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items,
                          }))
                        }
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Remove product"
                      >
                        <FiTrash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))}
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition"
            >
              <FiPlus size={14} /> Add Another Product
            </button>
          </div>

          {/* Payment & Notes Row */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Paid Now (৳)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.paidAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, paidAmount: total }))}
                  className="text-[11px] font-semibold text-emerald-600 hover:underline"
                >
                  Paid in Full (৳{total.toFixed(0)})
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, paidAmount: 0 }))}
                  className="text-[11px] font-semibold text-rose-500 hover:underline"
                >
                  Pay Later / Due
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Remarks / Supplier Note</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Delivery received at central warehouse batch #12"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Footer Summary & Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 bg-slate-50/80 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-500 block">Total Amount</span>
                <span className="text-xl font-black text-slate-900">৳ {total.toFixed(2)}</span>
              </div>
              <div className="border-l border-slate-200 pl-6">
                <span className="text-xs text-slate-500 block">Balance / Due</span>
                <span className={`text-xl font-black ${dueAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  ৳ {dueAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <FiCheck size={16} />
                {saving ? "Saving & Updating Stock..." : "Confirm & Save Purchase"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* QUICK ADD SUPPLIER MODAL */}
      {showSupplierModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowSupplierModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateSupplier}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FiUserPlus className="text-indigo-600" /> Add New Supplier
              </h3>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Supplier / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Distribution Ltd."
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="supplier@mail.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Motijheel, Dhaka"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Previous Opening Due (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newSupplier.openingDue}
                  onChange={(e) => setNewSupplier((prev) => ({ ...prev, openingDue: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={supplierSaving}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {supplierSaving ? "Saving..." : "Save Supplier"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PURCHASE MODAL */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setEditTarget(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleEditSubmit}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FiEdit3 className="text-indigo-600" /> Edit Purchase ({editTarget.invoiceNumber})
              </h3>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
              <span>Total Bill: <strong className="text-slate-900">৳ {Number(editTarget.totalAmount || 0).toLocaleString()}</strong></span>
              <span>Items: <strong className="text-slate-900">{Array.isArray(editTarget.items) ? editTarget.items.length : 0} items</strong></span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Supplier</label>
                <select
                  value={editForm.supplierId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, supplierId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.phone ? `(${s.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Invoice / Memo No *</label>
                  <input
                    type="text"
                    required
                    value={editForm.invoiceNumber}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={editForm.purchaseDate}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Paid Amount (৳) — Max: ৳{Number(editTarget.totalAmount || 0).toLocaleString()}
                </label>
                <input
                  type="number"
                  min="0"
                  max={editTarget.totalAmount}
                  step="0.01"
                  value={editForm.paidAmount}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  New Due will be: <strong className="text-rose-600">৳ {Math.max(0, Number(editTarget.totalAmount || 0) - Number(editForm.paidAmount || 0)).toLocaleString()}</strong>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editing}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {editing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & PURCHASES LIST */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-64 max-w-md flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search invoice number, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none shadow-sm"
              />
            </div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none shadow-sm"
            >
              <option value="">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Invoice</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Paid</th>
                <th className="px-5 py-3.5">Due</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading purchases...</span>
                    </div>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-400">
                    <FiShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No purchases found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click &quot;New Purchase&quot; above to create your first supplier purchase entry.
                    </p>
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{purchase.invoiceNumber}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {purchase.supplier?.name || purchase.supplierName || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {Array.isArray(purchase.items) ? purchase.items.length : 0} items
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ৳ {Number(purchase.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-emerald-600 font-semibold">
                      ৳ {Number(purchase.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-rose-600 font-semibold">
                      ৳ {Number(purchase.dueAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(
                          purchase.paymentStatus
                        )}`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Pay Due Button */}
                        {purchase.paymentStatus !== "paid" ? (
                          <button
                            onClick={() => {
                              setPayTarget(purchase);
                              setPayAmount(Number(purchase.dueAmount || 0));
                            }}
                            className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
                            title="Record Payment"
                          >
                            Pay Due
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold px-2 py-1">Settled ✓</span>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(purchase)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                          title="Edit Purchase"
                        >
                          <FiEdit3 size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeletePurchase(purchase._id)}
                          disabled={deletingId === purchase._id}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-50"
                          title="Delete Purchase & Revert Stock"
                        >
                          <FiTrash2 size={15} />
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

      {/* RECORD PAYMENT MODAL */}
      {payTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setPayTarget(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handlePay}
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="text-xs text-slate-500">Invoice: <strong className="text-slate-800">{payTarget.invoiceNumber}</strong></p>
              <p className="text-xs text-slate-500">Supplier: <strong className="text-slate-800">{payTarget.supplier?.name || "—"}</strong></p>
              <p className="text-xs text-rose-600 font-semibold">Outstanding Due: ৳ {Number(payTarget.dueAmount || 0).toLocaleString()}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Amount (৳) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={payTarget.dueAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {paying ? "Saving..." : "Confirm Payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PurchaseManager;
