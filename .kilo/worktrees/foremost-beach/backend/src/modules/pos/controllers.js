const Sale = require("../../models/Sale");

const SALE_TYPES = ["office", "company", "reseller", "pos", "exchange"];
const PAYMENT_METHODS = ["cash", "card", "mobile_banking"];
const PAYMENT_STATUSES = ["paid", "due", "partial"];

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      product: item?.product || null,
      quantity: Math.max(1, normalizeNumber(item?.quantity, 1)),
      price: Math.max(0, normalizeNumber(item?.price, 0)),
    }))
    .filter((item) => item.product);
};

const computeTotals = (items, discount = 0, tax = 0) => {
  const subtotal =
    items.reduce((acc, item) => acc + item.quantity * item.price, 0) || 0;
  const discountValue = normalizeNumber(discount);
  const taxValue = normalizeNumber(tax);
  const total = Math.max(0, subtotal - discountValue + taxValue);
  return { subtotal, total };
};

const buildSaleId = (saleType) => {
  const type =
    SALE_TYPES.includes(String(saleType || "").toLowerCase()) &&
    String(saleType).toLowerCase() !== "pos"
      ? String(saleType).toUpperCase()
      : "POS";
  return `${type}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

exports.createSale = async (req, res) => {
  try {
    const rawType = String(req.body?.saleType || "pos").toLowerCase();
    const saleType = SALE_TYPES.includes(rawType) ? rawType : "pos";

    const items = normalizeItems(req.body?.items);
    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product item is required",
      });
    }

    const discount = normalizeNumber(req.body?.discount, 0);
    const tax = normalizeNumber(req.body?.tax, 0);
    const totals = computeTotals(items, discount, tax);

    const newSale = new Sale({
      saleId: buildSaleId(saleType),
      saleType,
      customerName: String(req.body?.customerName || "").trim() || "Walk-in Customer",
      customerPhone: String(req.body?.customerPhone || "").trim(),
      items,
      subtotal: normalizeNumber(req.body?.subtotal, totals.subtotal),
      discount,
      tax,
      total: normalizeNumber(req.body?.total, totals.total),
      paymentMethod: PAYMENT_METHODS.includes(req.body?.paymentMethod)
        ? req.body.paymentMethod
        : "cash",
      paymentStatus: PAYMENT_STATUSES.includes(req.body?.paymentStatus)
        ? req.body.paymentStatus
        : "paid",
      amountPaid: normalizeNumber(
        req.body?.amountPaid,
        normalizeNumber(req.body?.total, totals.total),
      ),
      changeReturned: Math.max(
        0,
        normalizeNumber(
          req.body?.amountPaid,
          normalizeNumber(req.body?.total, totals.total),
        ) -
          normalizeNumber(req.body?.total, totals.total),
      ),
      soldBy: req.user ? req.user.id : null,
    });
    const savedSale = await newSale.save();
    res.status(201).json({ success: true, data: savedSale });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const query = {};
    const type = String(req.query?.type || "").toLowerCase();
    if (SALE_TYPES.includes(type)) {
      query.saleType = type;
    }

    const from = req.query?.from ? new Date(req.query.from) : null;
    const to = req.query?.to ? new Date(req.query.to) : null;
    if (from && !Number.isNaN(from.getTime())) {
      query.createdAt = { ...query.createdAt, $gte: from };
    }
    if (to && !Number.isNaN(to.getTime())) {
      query.createdAt = { ...query.createdAt, $lte: to };
    }

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .populate("items.product", "title price images sku")
      .populate("soldBy", "name email");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayQuery = { ...query, createdAt: { $gte: startOfDay } };

    const [totalRevenueAgg, todayRevenueAgg] = await Promise.all([
      Sale.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Sale.aggregate([
        { $match: todayQuery },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const stats = {
      totalCount: sales.length,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      todayCount: todayRevenueAgg.length ? sales.filter((sale) => sale.createdAt >= startOfDay).length : 0,
      todayRevenue: todayRevenueAgg[0]?.total || 0,
    };

    res.status(200).json({
      success: true,
      count: sales.length,
      stats,
      sales,
      data: sales,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    const updates = req.body || {};

    if (updates.customerName !== undefined) {
      sale.customerName = String(updates.customerName || "").trim() || "Walk-in Customer";
    }
    if (updates.customerPhone !== undefined) {
      sale.customerPhone = String(updates.customerPhone || "").trim();
    }
    if (updates.paymentMethod !== undefined && PAYMENT_METHODS.includes(updates.paymentMethod)) {
      sale.paymentMethod = updates.paymentMethod;
    }
    if (updates.paymentStatus !== undefined && PAYMENT_STATUSES.includes(updates.paymentStatus)) {
      sale.paymentStatus = updates.paymentStatus;
    }
    if (updates.amountPaid !== undefined) {
      sale.amountPaid = normalizeNumber(updates.amountPaid);
    }
    if (updates.changeReturned !== undefined) {
      sale.changeReturned = normalizeNumber(updates.changeReturned);
    }

    if (updates.items !== undefined) {
      const items = normalizeItems(updates.items);
      if (items.length > 0) {
        sale.items = items;
        const totals = computeTotals(items, updates.discount ?? sale.discount, updates.tax ?? sale.tax);
        sale.subtotal = normalizeNumber(updates.subtotal, totals.subtotal);
        sale.total = normalizeNumber(updates.total, totals.total);
      }
    }
    if (updates.discount !== undefined) {
      sale.discount = normalizeNumber(updates.discount);
    }
    if (updates.tax !== undefined) {
      sale.tax = normalizeNumber(updates.tax);
    }

    await sale.save();
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }
    res.status(200).json({ success: true, message: "Sale deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};