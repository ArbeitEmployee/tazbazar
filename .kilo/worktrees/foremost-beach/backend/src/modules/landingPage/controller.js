// landingPage/controller.js
// Thin HTTP layer: delegates each handler to the service layer.
const service = require("./services/landingPageCore.service.js");

const { createLandingPage, getLandingPages, getLandingPageById, updateLandingPage, deleteLandingPage, getPublicLandingPage, trackLandingPageView, getLandingPageStats } = service;

module.exports = { createLandingPage, getLandingPages, getLandingPageById, updateLandingPage, deleteLandingPage, getPublicLandingPage, trackLandingPageView, getLandingPageStats };
