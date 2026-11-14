const express = require("express");
const auth = require("../../middlewares/auth");
const responseCache = require("../../middlewares/responseCache");
const {
  createCampaign,
  getCampaigns,
  getPublicCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} = require("./controller");

const router = express.Router();

// Public storefront (no auth).
router.get("/public", responseCache(120000), getPublicCampaigns);

router.use(auth);

router.post("/", createCampaign);
router.get("/", getCampaigns);
router.get("/:id", getCampaignById);
router.patch("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);

module.exports = router;
