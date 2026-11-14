// account/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/accountCore.service.js");

const { getAccountEntries, createAccountEntry, updateAccountEntry, deleteAccountEntry, getAccountsSummary } = service;

module.exports = { getAccountEntries, createAccountEntry, updateAccountEntry, deleteAccountEntry, getAccountsSummary };
