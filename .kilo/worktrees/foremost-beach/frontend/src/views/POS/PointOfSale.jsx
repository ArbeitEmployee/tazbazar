import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiSearch,
  FiShoppingCart,
  FiDollarSign,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiX,
  FiRefreshCw,
  FiUser,
  FiRotateCcw,
} from "react-icons/fi";
import {
  normalizeProductVariantDefinitions,
  getProductPricingForSelectedVariants,
  buildSelectedVariantLabel,
  getSelectedVariantSignature,
  normalizeSelectedVariantsPayload,
} from "../../utils/productVariants";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PAYMENT_METHODS = ["cash", "card", "mobile_banking"];
const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  mobile_banking: "Mobile Banking",
};
const PAYMENT_STATUSES = ["paid", "partial", "due"];

const normalizePrice = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const getStockLimit = (product = {}) => {
  const stock = Number(product?.stock);
  return Number.isFinite(stock) && stock >= 0 ? stock : null;
};

const formatTk = (value) => `৳${Number(value || 0).toLocaleString("en-US")}`;

const PointOfSale = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  // Customer + payment
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [amountPaid, setAmountPaid] = useState("");

  // Variant picker
  const [pickKey, setPickKey] = useState(null);
  const [pickerProduct, setPickerProduct] = useState(null);
  const [pickerSelection, setPickerSelection] = useState({});
  const [pickerQty, setPickerQty] = useState(1);

  // Receipt + history
  const [receiptSale, setReceiptSale] = useState(null);
  const [todaySales, setTodaySales] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const { data } = await axios.get(`${baseUrl}/products`, {
        headers: getAuthHeaders(),
      });
      setProducts(data?.products || data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchTodaySales = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const { data } = await axios.get(`${baseUrl}/pos?type=pos`, {
        headers: getAuthHeaders(),
      });
      setTodaySales(data?.sales || data?.data || []);
    } catch (error) {
      setTodaySales([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchTodaySales();
  }, [fetchProducts, fetchTodaySales]);

  const filteredProducts = useMemo(() => {
    const term = String(searchTerm || "").trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        String(product?.title || "").toLowerCase().includes(term) ||
        String(product?.sku || "")
          .toLowerCase()
          .includes(term),
    );
  }, [products, searchTerm]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const discountValue = normalizePrice(discount);
  const taxValue = normalizePrice(tax);
  const total = Math.max(0, subtotal - discountValue + taxValue);
  const paidValue = amountPaid === "" ? 0 : normalizePrice(amountPaid);
  const changeReturned = paidValue > total ? paidValue - total : 0;

  const handleProductClick = (product) => {
    const definitions = normalizeProductVariantDefinitions(product);
    if (definitions.length === 0) {
      addItem(product, []);
      return;
    }
    setPickerProduct(product);
    setPickerSelection({});
    setPickerQty(1);
    setPickKey(product._id);
  };

  const resolveSelectedVariants = (product, selection) =>
    normalizeSelectedVariantsPayload(
      Object.entries(selection).map(([name, value]) => ({
        name,
        value,
      })),
    ).filter((variant) =>
      normalizeProductVariantDefinitions(product).some(
        (definition) =>
          definition.name.toLowerCase() === variant.name.toLowerCase(),
      ),
    );

  const addItem = (product, selectedVariants) => {
    const normalizedVariants = normalizeSelectedVariantsPayload(
      selectedVariants
    );
    const signature = getSelectedVariantSignature(normalizedVariants);
    const pricing = getProductPricingForSelectedVariants(
      product,
      normalizedVariants
    );
    const price = pricing?.currentPrice != null
      ? pricing.currentPrice
      : normalizePrice(product?.price);

    const stockLimit = getStockLimit(product);
    const existing = cart.find(
      (item) =>
        item.productId === product._id && item.signature === signature
    );

    if (existing) {
      if (stockLimit !== null && existing.qty + 1 > stockLimit) {
        toast.error(`Only ${stockLimit} in stock for "${product.title}"`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.signature === signature && item.productId === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      );
      if (pickKey) setPickKey(null);
      return;
    }

    if (stockLimit !== null && 1 > stockLimit) {
      toast.error(`"${product.title}" is out of stock`);
      return;
    }

    setCart([
      ...cart,
      {
        productId: product._id,
        signature,
        title: product.title,
        sku: product.sku,
        image: product.images?.[0]?.url || "",
        selectedVariants: normalizedVariants,
        variantLabel: buildSelectedVariantLabel(normalizedVariants),
        price,
        qty: 1,
        stock: stockLimit,
      },
    ]);
    if (pickKey) setPickKey(null);
  };

  const changeQty = (item, delta) => {
    const stockLimit = item.stock;
    setCart(
      cart.map((cartItem) => {
        if (cartItem.signature !== item.signature || cartItem.productId !== item.productId) {
          return cartItem;
        }
        const nextQty = cartItem.qty + delta;
        if (nextQty < 1) return cartItem;
        if (stockLimit !== null && nextQty > stockLimit) {
          toast.error(`Only ${stockLimit} in stock for "${item.title}"`);
          return cartItem;
        }
        return { ...cartItem, qty: nextQty };
      })
    );
  };

  const removeFromCart = (item) => {
    setCart(
      cart.filter(
        (cartItem) =>
          !(cartItem.signature === item.signature && cartItem.productId === item.productId)
      )
    );
  };

  const clearOrder = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount(0);
    setTax(0);
    setPaymentMethod("cash");
    setPaymentStatus("paid");
    setAmountPaid("");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return toast.error("Cart is empty");
    }
    if (Number(total) <= 0) {
      return toast.error("Order total must be greater than 0");
    }
    if (paymentStatus !== "due" && paidValue <= 0) {
      return toast.error(paidValue === 0 ? "Enter the amount paid" : "Paid amount must be greater than 0");
    }

    const payload = {
      saleType: "pos",
      customerName,
      customerPhone,
      items: cart.map((item) => ({
        product: item.productId,
        quantity: item.qty,
        price: item.price,
      })),
      subtotal,
      discount: discountValue,
      tax: taxValue,
      total,
      paymentMethod,
      paymentStatus,
      amountPaid: paymentStatus === "due" ? 0 : paidValue,
    };

    try {
      setCheckoutBusy(true);
      const { data } = await axios.post(`${baseUrl}/pos`, payload, {
        headers: getAuthHeaders(),
      });
      if (data?.success) {
        toast.success("Sale completed successfully");
        setReceiptSale(data?.data || null);
        clearOrder();
        fetchTodaySales();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Checkout failed");
    } finally {
      setCheckoutBusy(false);
    }
  };

  const handleVoid = async (sale) => {
    if (!window.confirm(`Void sale "${sale.saleId}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${baseUrl}/pos/${sale._id}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Sale voided");
      fetchTodaySales();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to void sale");
    }
  };

  const printReceipt = (sale) => {
    const rows = (sale.items || [])
      .map(
        (item) =>
          `<tr><td>${item.product?.title || "Product"}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${formatTk(item.quantity * item.price)}</td></tr>`
      )
      .join("");
    const printWindow = window.open("", "_blank", "width=360,height=520");
    if (!printWindow) {
      return toast.error("Popup was blocked. Allow popups to print receipts.");
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${sale.saleId}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; padding: 12px; color: #111; }
            h2 { margin: 0 0 2px; text-align: center; }
            .muted { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            td { padding: 4px 0; font-size: 13px; }
            .total-row td { border-top: 1px dashed #999; font-weight: bold; padding-top: 8px; }
            .footer { margin-top: 12px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <h2>Sales Receipt</h2>
          <p class="muted" style="text-align:center">${sale.saleId}</p>
          <p class="muted">Customer: ${sale.customerName || "Walk-in Customer"}${sale.customerPhone ? ` (${sale.customerPhone})` : ""}</p>
          <p class="muted">Date: ${new Date(sale.createdAt).toLocaleString()}</p>
          <table>
            <thead><tr><td>Item</td><td style="text-align:center">Qty</td><td style="text-align:right">Total</td></tr></thead>
            <tbody>${rows}</tbody>
            <tr><td colspan="2">Subtotal</td><td style="text-align:right">${formatTk(sale.subtotal)}</td></tr>
            ${Number(sale.discount || 0) ? `<tr><td colspan="2">Discount</td><td style="text-align:right">-${formatTk(sale.discount)}</td></tr>` : ""}
            ${Number(sale.tax || 0) ? `<tr><td colspan="2">Tax</td><td style="text-align:right">${formatTk(sale.tax)}</td></tr>` : ""}
            <tr class="total-row"><td colspan="2">Total</td><td style="text-align:right">${formatTk(sale.total)}</td></tr>
            <tr><td colspan="2">Paid (${sale.paymentMethod})</td><td style="text-align:right">${formatTk(sale.amountPaid)}</td></tr>
            ${Number(sale.changeReturned || 0) > 0 ? `<tr><td colspan="2">Change</td><td style="text-align:right">${formatTk(sale.changeReturned)}</td></tr>` : ""}
          </table>
          <div class="footer">Thank you for your purchase!</div>
          <script>window.onload = function(){ window.print(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const pickerDefinitions = pickerProduct
    ? normalizeProductVariantDefinitions(pickerProduct)
    : [];
  const pickerStock = pickerProduct ? getStockLimit(pickerProduct) : null;
  const pickerConfirmedVariants = pickerProduct
    ? resolveSelectedVariants(pickerProduct, pickerSelection)
    : [];
  const pickerPricing = pickerProduct
    ? getProductPricingForSelectedVariants(pickerProduct, pickerConfirmedVariants)
    : { currentPrice: 0 };
  const pickerUnitPrice =
    pickerPricing?.currentPrice != null
      ? pickerPricing.currentPrice
      : pickerProduct
      ? normalizePrice(pickerProduct?.price)
      : 0;
  const pickerLineTotal = pickerUnitPrice * pickerQty;
  const pickerCanConfirm =
    pickerDefinitions.length === 0 ||
    pickerDefinitions.every((definition) => pickerSelection[definition.name]);

  return (
    <div className="app-panel flex flex-col gap-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black md:text-2xl">
            Point of Sale
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Fast walk-in sales with customer, discount, and payment tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchProducts();
              fetchTodaySales();
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={clearOrder}
            disabled={cart.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRotateCcw size={14} /> New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* ============ Products ============ */}
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const stockLimit = getStockLimit(product);
                  const outOfStock = stockLimit !== null && stockLimit <= 0;
                  const hasVariants =
                    normalizeProductVariantDefinitions(product).length > 0;
                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleProductClick(product)}
                      disabled={outOfStock}
                      className={`group overflow-hidden rounded-xl border bg-white text-left transition-all ${
                        outOfStock
                          ? "cursor-not-allowed border-slate-200 opacity-50"
                          : "cursor-pointer border-slate-200 hover:border-indigo-500 hover:shadow-md"
                      }`}
                    >
                      <div className="relative aspect-square bg-slate-100">
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.title}
                            className="h-full w-full object-contain mix-blend-multiply p-2"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">
                            No Image
                          </div>
                        )}
                        {hasVariants && (
                          <span className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            VARIANTS
                          </span>
                        )}
                        {outOfStock && (
                          <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            OUT
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 p-3">
                        <h3 className="truncate text-sm font-medium text-slate-800">
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-indigo-600">
                            {formatTk(
                              getProductPricingForSelectedVariants(product, [])
                                ?.currentPrice ?? product.price ?? 0
                            )}
                          </p>
                          <p
                            className={`text-xs ${
                              stockLimit === null
                                ? "text-slate-400"
                                : stockLimit <= 5
                                ? "text-rose-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {stockLimit === null
                              ? "In stock"
                              : `${stockLimit} left`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============ Cart / Checkout ============ */}
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <FiShoppingCart className="text-indigo-600" /> Current Order
            </h2>
            <span className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">
              {cartCount} items
            </span>
          </div>

          <div className="max-h-72 flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-3 py-10 text-slate-400">
                <FiShoppingCart size={48} className="text-slate-200" />
                <p>Add products to start an order</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.signature}`}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-200" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-slate-800">
                          {item.title}
                        </h4>
                        {item.variantLabel ? (
                          <p className="truncate text-xs text-slate-500">
                            {item.variantLabel}
                          </p>
                        ) : null}
                        {item.sku ? (
                          <p className="text-xs text-slate-400">{item.sku}</p>
                        ) : null}
                        <p className="mt-0.5 font-bold text-indigo-600">
                          {formatTk(item.price)}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            × {item.qty}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item)}
                        className="self-start p-1 text-red-400 transition hover:text-red-600"
                        aria-label="Remove"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => changeQty(item, -1)}
                          className="p-1 text-slate-600 hover:bg-slate-100"
                          aria-label="Decrease"
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(item, 1)}
                          className="p-1 text-slate-600 hover:bg-slate-100"
                          aria-label="Increase"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                      <p className="font-semibold text-slate-800">
                        {formatTk(item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Customer name"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <input
                type="text"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Customer phone"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Discount
                </span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Tax
                </span>
                <input
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(event) => setTax(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Payment method
                </span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Payment status
                </span>
                <select
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {paymentStatus !== "due" && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Amount paid
                </span>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>
            )}

            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatTk(subtotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span className="font-semibold text-rose-600">
                    -{formatTk(discountValue)}
                  </span>
                </div>
              )}
              {taxValue > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-semibold">{formatTk(taxValue)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="font-medium text-slate-700">Total</span>
                <span className="text-lg font-bold text-slate-900">
                  {formatTk(total)}
                </span>
              </div>
              {changeReturned > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Change</span>
                  <span className="font-semibold">{formatTk(changeReturned)}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutBusy || cart.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              <FiDollarSign size={18} />
              {checkoutBusy ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>

      {/* ============ Today's sales ============ */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="font-semibold text-slate-800">Today's POS Sales</h2>
          <span className="text-xs text-slate-500">
            {historyLoading ? "Loading..." : `${todaySales.length} sale(s)`}
          </span>
        </div>
        {historyLoading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            Loading sales...
          </p>
        ) : todaySales.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            No POS sales today yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Sale ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {todaySales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-black">
                      {sale.saleId}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">
                        {sale.customerName || "Walk-in Customer"}
                      </p>
                      {sale.customerPhone ? (
                        <p className="text-xs text-slate-500">
                          {sale.customerPhone}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(sale.items || []).length} item(s)
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-black">
                      {formatTk(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          sale.paymentStatus === "paid"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : sale.paymentStatus === "partial"
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {PAYMENT_METHOD_LABELS[sale.paymentMethod] ||
                          sale.paymentMethod}{" "}
                        · {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {sale.createdAt
                        ? new Date(sale.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => printReceipt(sale)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-black"
                          title="Print receipt"
                        >
                          <FiPrinter size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoid(sale)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Void sale"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ Variant picker modal ============ */}
      {pickKey ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800">
                {pickerProduct?.title}
              </h3>
              <button
                type="button"
                onClick={() => setPickKey(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="max-h-[50vh] space-y-4 overflow-y-auto p-4">
              {pickerDefinitions.map((definition) => (
                <div key={definition.name}>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    {definition.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {definition.options.map((option, index) => {
                      const isSelected =
                        pickerSelection[definition.name] === option.value;
                      return (
                        <button
                          key={`${option.value}-${index}`}
                          type="button"
                          onClick={() =>
                            setPickerSelection((prev) => ({
                              ...prev,
                              [definition.name]: option.value,
                            }))
                          }
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {option.preset === "color" && option.colorHex ? (
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-3.5 w-3.5 rounded-full border border-black/10"
                                style={{ backgroundColor: option.colorHex }}
                              />
                              {option.label || option.value}
                            </span>
                          ) : (
                            (option.label || option.value)
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-700">Quantity</p>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPickerQty((q) => Math.max(1, q - 1))}
                    className="p-1.5 text-slate-600 hover:bg-slate-100"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {pickerQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        pickerStock !== null &&
                        pickerQty + 1 > pickerStock
                      ) {
                        toast.error(`Only ${pickerStock} in stock`);
                        return;
                      }
                      setPickerQty((q) => q + 1);
                    }}
                    className="p-1.5 text-slate-600 hover:bg-slate-100"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                <span className="ml-auto text-sm text-slate-500">
                  {pickerStock === null
                    ? "In stock"
                    : `${pickerStock} in stock`}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="text-sm text-slate-600">
                  {buildSelectedVariantLabel(pickerConfirmedVariants) ||
                    "No options selected"}
                </span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatTk(pickerLineTotal)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                disabled={!pickerCanConfirm}
                onClick={() => {
                  const resolved = resolveSelectedVariants(
                    pickerProduct,
                    pickerSelection
                  );
                  addItem(pickerProduct, resolved);
                  if (pickKey) {
                    const stockLimit = getStockLimit(pickerProduct);
                    if (
                      stockLimit === null ||
                      pickerQty <= stockLimit
                    ) {
                      setCart((prev) =>
                        prev.map((item) =>
                          item.productId === pickerProduct._id &&
                          item.signature ===
                            getSelectedVariantSignature(
                              normalizeSelectedVariantsPayload(resolved)
                            )
                            ? { ...item, qty: pickerQty }
                            : item
                        )
                      );
                    }
                  }
                }}
                className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {formatTk(pickerLineTotal)} · Add to Order
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ============ Receipt modal ============ */}
      {receiptSale ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-4 text-center">
              <h3 className="text-lg font-bold text-black">Sale Completed</h3>
              <p className="text-sm text-slate-500">{receiptSale.saleId}</p>
            </div>
            <div className="space-y-2 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Customer</span>
                <span className="font-medium text-slate-800">
                  {receiptSale.customerName || "Walk-in Customer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Items</span>
                <span className="font-medium text-slate-800">
                  {(receiptSale.items || []).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total</span>
                <span className="font-bold text-slate-900">
                  {formatTk(receiptSale.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Paid</span>
                <span className="font-medium text-slate-800">
                  {formatTk(receiptSale.amountPaid)}
                </span>
              </div>
              {Number(receiptSale.changeReturned || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Change</span>
                  <span className="font-semibold">
                    {formatTk(receiptSale.changeReturned)}
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => printReceipt(receiptSale)}
                className="flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <FiPrinter size={16} /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setReceiptSale(null)}
                className="rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PointOfSale;