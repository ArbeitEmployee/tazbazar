// banner/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/bannerCore.service.js");

const { createBanner, getBanners, getActiveBanners, getBanner, updateBanner, deleteBanner, toggleBannerActive } = service;

module.exports = { createBanner, getBanners, getActiveBanners, getBanner, updateBanner, deleteBanner, toggleBannerActive };
