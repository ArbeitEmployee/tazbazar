// brand/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/brandCore.service.js");

const { createBrand, getBrands, updateBrand, deleteBrand, getPublicBrands, uploadBrandLogo } = service;

module.exports = { createBrand, getBrands, updateBrand, deleteBrand, getPublicBrands, uploadBrandLogo };
