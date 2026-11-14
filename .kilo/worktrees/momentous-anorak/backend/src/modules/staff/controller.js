// staff/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/staffCore.service.js");

const { getStaffPermissions, getVendorStaff, createStaffMember, updateStaffMember, deleteStaffMember } = service;

module.exports = { getStaffPermissions, getVendorStaff, createStaffMember, updateStaffMember, deleteStaffMember };
