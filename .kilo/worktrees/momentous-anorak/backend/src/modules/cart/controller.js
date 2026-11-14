// cart/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/cartCore.service.js");

const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = service;

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
