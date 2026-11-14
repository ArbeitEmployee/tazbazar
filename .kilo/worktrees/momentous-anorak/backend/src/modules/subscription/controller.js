// subscription/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/subscriptionCore.service.js");

const { getPublicPlans, getAdminPlans, createPlan, updatePlan, deletePlan, subscribeToPlan, getMySubscription, getAdminSubscriptions, updateSubscriptionStatus, getMyRecurringSubscriptions, getVendorRecurringSubscriptions, getAdminRecurringSubscriptions, updateRecurringSubscriptionStatus, runRecurringRenewalCycle } = service;

module.exports = { getPublicPlans, getAdminPlans, createPlan, updatePlan, deletePlan, subscribeToPlan, getMySubscription, getAdminSubscriptions, updateSubscriptionStatus, getMyRecurringSubscriptions, getVendorRecurringSubscriptions, getAdminRecurringSubscriptions, updateRecurringSubscriptionStatus, runRecurringRenewalCycle };
