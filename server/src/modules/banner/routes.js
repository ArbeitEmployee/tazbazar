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
const { upload, handleMulterError } = require("../../middlewares/bannerUpload.js");
const responseCache = require("../../middlewares/responseCache");

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
  upload.fields([{ name: "image", maxCount: 1 }]),
  handleMulterError,
  upsertStorePopup
);
router.patch("/store-popup/toggle-active", auth, toggleStorePopupActive);

// Protected highlight text routes
router.get("/highlight-text", auth, getAdminHighlightText);
router.post("/highlight-text", auth, upsertHighlightText);
router.delete("/highlight-text", auth, deleteHighlightText);

// Protected routes
router.post(
  "/",
  auth,
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
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]),
  handleMulterError,
  updateBanner
);
router.delete("/:id", auth, deleteBanner);
router.patch("/:id/toggle-active", auth, toggleBannerActive);

module.exports = router;
