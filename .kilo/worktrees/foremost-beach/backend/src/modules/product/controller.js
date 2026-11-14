// product/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const mongoose = require("mongoose");
const Product = require("../../models/Product");
const service = require("./services/productCore.service.js");

const { searchProducts, createProduct, getProducts, getActiveProducts, getProductsByType, getHomeCatalog, getProduct, updateProduct, deleteProduct, toggleProductActive, duplicateProduct, updateProductApprovalStatus, getSearchSuggestions } = service;

// Public view tracking for Product View Report
const trackProductView = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true, select: "_id title viewCount" },
    ).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({
      success: true,
      productId: product._id,
      viewCount: Number(product.viewCount || 0),
    });
  } catch (error) {
    console.error("Track product view error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { searchProducts, createProduct, getProducts, getActiveProducts, getProductsByType, getHomeCatalog, getProduct, updateProduct, deleteProduct, toggleProductActive, duplicateProduct, updateProductApprovalStatus, getSearchSuggestions, trackProductView };

