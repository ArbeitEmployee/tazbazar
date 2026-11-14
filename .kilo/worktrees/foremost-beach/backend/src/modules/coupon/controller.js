// coupon/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/couponCore.service.js");

const { applyCoupon, createCoupon, getCoupons, updateCoupon, deleteCoupon } = service;

module.exports = { applyCoupon, createCoupon, getCoupons, updateCoupon, deleteCoupon };
