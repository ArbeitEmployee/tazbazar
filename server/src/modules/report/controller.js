// report/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/reportCore.service.js");

const { getReportSummary, getModuleReport } = service;

module.exports = { getReportSummary, getModuleReport };
