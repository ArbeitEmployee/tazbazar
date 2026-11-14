// banner/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/bannerCore.service.js");
const highlightService = require("./services/highlightText.service.js");
const popupService = require("./services/storePopup.service.js");

const { createBanner, getBanners, getActiveBanners, getBanner, updateBanner, deleteBanner, toggleBannerActive } = service;

module.exports = {
  createBanner,
  getBanners,
  getActiveBanners,
  getBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  getPublicHighlightText: highlightService.getPublicHighlightText,
  getAdminHighlightText: highlightService.getAdminHighlightText,
  upsertHighlightText: highlightService.upsertHighlightText,
  deleteHighlightText: highlightService.deleteHighlightText,
  getPublicStorePopup: popupService.getPublicStorePopup,
  getAdminStorePopup: popupService.getAdminStorePopup,
  upsertStorePopup: popupService.upsertStorePopup,
  toggleStorePopupActive: popupService.toggleStorePopupActive,
};

