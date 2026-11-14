// abandonedOrder/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/abandonedOrderCore.service.js");

const { captureAbandonedOrder, getAbandonedOrders, updateAbandonedOrder, convertAbandonedOrder, deleteAbandonedOrder } = service;

module.exports = { captureAbandonedOrder, getAbandonedOrders, updateAbandonedOrder, convertAbandonedOrder, deleteAbandonedOrder };
