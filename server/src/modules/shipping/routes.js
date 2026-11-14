const express = require("express");
const auth = require("../../middlewares/auth");
const {
  estimateShipping,
  getPublicShippingZones,
  getAdminShippingZones,
  createAdminShippingZone,
  updateAdminShippingZone,
  deleteAdminShippingZone,
} = require("./controller");

const router = express.Router();

// Public
router.get("/zones", getPublicShippingZones);
router.post("/estimate", estimateShipping);

// Admin
router.get("/admin/zones", auth, getAdminShippingZones);
router.post("/admin/zones", auth, createAdminShippingZone);
router.put("/admin/zones/:id", auth, updateAdminShippingZone);
router.delete("/admin/zones/:id", auth, deleteAdminShippingZone);

module.exports = router;
