const express = require("express");
const {
  createBanner,
  getBanners,
  getBanner,
  updateBanner,
  deleteBanner,
  getActiveBanners,
  toggleBannerActive,
  getPublicHighlightText,
  getAdminHighlightText,
  upsertHighlightText,
  deleteHighlightText,
  getPublicStorePopup,
  getAdminStorePopup,
  upsertStorePopup,
  toggleStorePopupActive,
} = require("./controller");
const auth = require("../../middlewares/auth.js");
const { isAdmin } = require("../../utils/marketplaceAccess");
const { upload, handleMulterError } = require("../../middlewares/bannerUpload.js");
const responseCache = require("../../middlewares/responseCache");

// Banner/popup/highlight edits are storewide admin operations. `auth` alone
// allowed any logged-in customer to change what every shopper sees.
const adminOnly = (req, res, next) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  return next();
};

const router = express.Router();

// Public routes
router.get("/public", responseCache(120000), getActiveBanners); // Get active banners for public view
router.get("/public/highlight-text", responseCache(120000), getPublicHighlightText); // Public highlight text
router.get("/public/store-popup", getPublicStorePopup); // Public store popup (real-time, no stale cache)
router.get("/public/:id", responseCache(120000), getBanner); // Get single banner (public)

// Protected popup routes
router.get("/store-popup", auth, getAdminStorePopup);
router.post(
  "/store-popup",
  auth,
  adminOnly,
  upload.fields([{ name: "image", maxCount: 1 }]),
  handleMulterError,
  upsertStorePopup
);
router.patch("/store-popup/toggle-active", auth, adminOnly, toggleStorePopupActive);

// Protected highlight text routes
router.get("/highlight-text", auth, getAdminHighlightText);
router.post("/highlight-text", auth, adminOnly, upsertHighlightText);
router.delete("/highlight-text", auth, adminOnly, deleteHighlightText);

// Protected routes
router.post(
  "/",
  auth,
  adminOnly,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]),
  handleMulterError,
  createBanner
);
router.get("/", auth, getBanners);
router.get("/:id", auth, getBanner);
router.put(
  "/:id",
  auth,
  adminOnly,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]),
  handleMulterError,
  updateBanner
);
router.delete("/:id", auth, adminOnly, deleteBanner);
router.patch("/:id/toggle-active", auth, adminOnly, toggleBannerActive);

module.exports = router;
