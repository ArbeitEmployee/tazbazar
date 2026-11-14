// purchase/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/purchaseCore.service.js");

const { createPurchase, getPurchases, addPurchasePayment } = service;

module.exports = { createPurchase, getPurchases, addPurchasePayment };
