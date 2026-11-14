// vendor/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/vendorCore.service.js");

const { registerVendor, getMyVendorProfile, updateMyVendorProfile, uploadMyVendorAsset, getPublicVendors, getNearbyVendors, getVendorStore, getAdminVendors, updateVendorStatus, updateVendorCommission, getVendorDashboardStats, getVendorOrders, getAdminVendorReports } = service;

module.exports = { registerVendor, getMyVendorProfile, updateMyVendorProfile, uploadMyVendorAsset, getPublicVendors, getNearbyVendors, getVendorStore, getAdminVendors, updateVendorStatus, updateVendorCommission, getVendorDashboardStats, getVendorOrders, getAdminVendorReports };
