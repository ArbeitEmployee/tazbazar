// wishlist/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/wishlistCore.service.js");

const { getWishlist, checkWishlistItem, addWishlistItem, removeWishlistItem, clearWishlist } = service;

module.exports = { getWishlist, checkWishlistItem, addWishlistItem, removeWishlistItem, clearWishlist };
