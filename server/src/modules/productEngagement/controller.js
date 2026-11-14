// productEngagement/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/productEngagementCore.service.js");

const { getProductReviews, getMyProductReview, createOrUpdateProductReview, getAdminProductReviews, updateProductReviewStatus, deleteMyProductReview } = service;

module.exports = { getProductReviews, getMyProductReview, createOrUpdateProductReview, getAdminProductReviews, updateProductReviewStatus, deleteMyProductReview };
