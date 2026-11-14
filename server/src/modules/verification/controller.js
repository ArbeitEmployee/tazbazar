// verification/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/verificationCore.service.js");

const { getMyVerification, submitMyVerification, getAdminVerifications, reviewVerification } = service;

module.exports = { getMyVerification, submitMyVerification, getAdminVerifications, reviewVerification };
