// supportTicket/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/supportTicketCore.service.js");

const { createTicket, getTickets, getTicketById, replyTicket, updateTicketStatus } = service;

module.exports = { createTicket, getTickets, getTicketById, replyTicket, updateTicketStatus };
