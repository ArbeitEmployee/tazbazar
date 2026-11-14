// vendorEngagement/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/vendorEngagementCore.service.js");

const { getVendorReviews, createVendorReview, deleteMyVendorReview, createVendorContactMessage, getMyVendorMessages, getAdminVendorReviews, updateMyVendorMessageStatus, updateVendorReviewStatus } = service;

module.exports = { getVendorReviews, createVendorReview, deleteMyVendorReview, createVendorContactMessage, getMyVendorMessages, getAdminVendorReviews, updateMyVendorMessageStatus, updateVendorReviewStatus };
