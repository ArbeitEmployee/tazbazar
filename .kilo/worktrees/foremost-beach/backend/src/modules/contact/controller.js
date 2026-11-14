// contact/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/contactCore.service.js");

const { createContactSubmission, getContactSubmissions, updateContactSubmission } = service;

module.exports = { createContactSubmission, getContactSubmissions, updateContactSubmission };
