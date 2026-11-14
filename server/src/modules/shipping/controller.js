// shipping/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/shippingCore.service.js");

const {
  estimateShipping,
  getPublicShippingZones,
  getAdminShippingZones,
  createAdminShippingZone,
  updateAdminShippingZone,
  deleteAdminShippingZone,
} = service;

module.exports = {
  estimateShipping,
  getPublicShippingZones,
  getAdminShippingZones,
  createAdminShippingZone,
  updateAdminShippingZone,
  deleteAdminShippingZone,
};
