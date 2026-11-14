const mongoose = require("mongoose");
const DamageProduct = require("../../models/DamageProduct");
const Product = require("../../models/Product");

const normalizeString = (value, maxLength = 200) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

const adjustProductStock = async (product, variationId, delta) => {
  if (!product) return;
  if (variationId && Array.isArray(product.variations)) {
    const variation = product.variations.id(variationId);
    if (variation) {
      variation.stock = Math.max(0, Number(variation.stock || 0) + delta);
      await product.save();
      return;
    }
  }
  product.stock = Math.max(0, Number(product.stock || 0) + delta);
  await product.save();
};

const createDamageProduct = async (req, res) => {
  try {
    const body = req.body || {};
    const productId = normalizeString(body.product || body.productId, 60);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid product is required",
      });
    }

    const quantity = Math.max(1, Number(body.quantity || 0));
    const reason = normalizeString(body.reason, 300);

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Damage reason is required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let variationId = null;
    if (body.variationId && mongoose.Types.ObjectId.isValid(body.variationId)) {
      variationId = body.variationId;
    }

    const variation = variationId && Array.isArray(product.variations)
      ? product.variations.id(variationId)
      : null;

    const damageDate = body.damageDate ? new Date(body.damageDate) : new Date();

    const damageProduct = await DamageProduct.create({
      product: product._id,
      title: normalizeString(body.title, 220) || product.title || "",
      sku: normalizeString(body.sku, 120) || product.sku || "",
      variationId: variation ? variation._id : null,
      variationLabel: normalizeString(body.variationLabel, 180) || (variation?.label ?? ""),
      quantity,
      reason,
      note: normalizeString(body.note, 2000),
      damageDate: Number.isNaN(damageDate.getTime()) ? new Date() : damageDate,
      createdBy: req.user?._id,
    });

    // Reduce stock for the damaged quantity
    await adjustProductStock(product, variation?._id || null, -quantity);

    return res.status(201).json({
      success: true,
      message: "Damage product recorded and stock adjusted",
      damageProduct,
    });
  } catch (error) {
    console.error("Create damage product error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while recording damage product",
    });
  }
};

const getDamageProducts = async (req, res) => {
  try {
    const query = {};
    const search = normalizeString(req.query?.search, 160);
    if (search) {
      query.$or = [
        { title: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { sku: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      ];
    }

    const damageProducts = await DamageProduct.find(query)
      .populate("product", "title sku stock images")
      .sort({ damageDate: -1, createdAt: -1 })
      .lean();

    const totalQuantity = damageProducts.reduce(
      (sum, entry) => sum + Number(entry.quantity || 0),
      0,
    );

    return res.json({
      success: true,
      damageProducts,
      summary: {
        count: damageProducts.length,
        totalQuantity,
      },
    });
  } catch (error) {
    console.error("Get damage products error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching damage products",
    });
  }
};

const deleteDamageProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid damage entry id" });
    }

    const damageProduct = await DamageProduct.findById(id);
    if (!damageProduct) {
      return res.status(404).json({ success: false, message: "Damage entry not found" });
    }

    // Restore stock when the damage entry is removed
    const product = await Product.findById(damageProduct.product);
    await adjustProductStock(
      product,
      damageProduct.variationId || null,
      Number(damageProduct.quantity || 0),
    );

    await DamageProduct.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Damage entry deleted and stock restored",
    });
  } catch (error) {
    console.error("Delete damage product error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting damage entry",
    });
  }
};

module.exports = {
  createDamageProduct,
  getDamageProducts,
  deleteDamageProduct,
};
