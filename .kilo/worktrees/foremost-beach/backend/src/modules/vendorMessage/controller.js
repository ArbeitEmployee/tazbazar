// vendorMessage/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/vendorMessageCore.service.js");

const { createConversation, getMyConversations, getAdminConversations, getConversation, replyToConversation, updateConversationStatus } = service;

module.exports = { createConversation, getMyConversations, getAdminConversations, getConversation, replyToConversation, updateConversationStatus };
