// payment/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/paymentCore.service.js");

const { getPaymentMethods, getAllPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = service;

module.exports = { getPaymentMethods, getAllPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod };
