const express = require("express");
const router = express.Router();
const {
  createCategory,
  getPublicCategories,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("./controller");
const auth = require("../../middlewares/auth");
const { isAdmin } = require("../../utils/marketplaceAccess");
const { upload, handleMulterError } = require("../../middlewares/upload");
const responseCache = require("../../middlewares/responseCache");

// Write operations must be restricted to admins. Middleware-only auth lets
// any logged-in customer create/update/delete categories.
const adminOnly = (req, res, next) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  return next();
};

// Public
router.get("/public", responseCache(120000), getPublicCategories);

// Protected
router.get("/", auth, getCategories);
router.get("/:id", auth, getCategory);

// Admin
router.post("/", auth, adminOnly, upload.single("image"), handleMulterError, createCategory);
router.put("/:id", auth, adminOnly, upload.single("image"), handleMulterError, updateCategory);
router.delete("/:id", auth, adminOnly, deleteCategory);

module.exports = router;
