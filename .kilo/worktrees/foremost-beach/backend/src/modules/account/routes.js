const express = require("express");
const mongoose = require("mongoose");
const auth = require("../../middlewares/auth");
const {
  getAccountEntries,
  createAccountEntry,
  updateAccountEntry,
  deleteAccountEntry,
  getAccountsSummary,
} = require("./controller");
const AccountPurpose = require("../../models/AccountPurpose");

const router = express.Router();

router.use(auth);

// Account purposes (used across ledger entries)
router.get("/purposes", async (req, res) => {
  try {
    const purposes = await AccountPurpose.find().sort({ name: 1 }).lean();
    return res.json({ success: true, purposes });
  } catch (error) {
    console.error("Get account purposes error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/purposes", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2) {
      return res.status(400).json({ success: false, message: "Purpose name is required" });
    }
    const existing = await AccountPurpose.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (existing) {
      return res.status(400).json({ success: false, message: "Purpose already exists" });
    }
    const purpose = await AccountPurpose.create({
      name,
      type: ["income", "expense", "both"].includes(req.body?.type) ? req.body.type : "both",
      isActive: req.body?.isActive === undefined ? true : Boolean(req.body.isActive),
      createdBy: req.user?._id || null,
    });
    return res.status(201).json({ success: true, message: "Purpose created", purpose });
  } catch (error) {
    console.error("Create account purpose error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/purposes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid purpose id" });
    }
    const purpose = await AccountPurpose.findByIdAndDelete(id);
    if (!purpose) {
      return res.status(404).json({ success: false, message: "Purpose not found" });
    }
    return res.json({ success: true, message: "Purpose deleted" });
  } catch (error) {
    console.error("Delete account purpose error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/summary", getAccountsSummary);
router.get("/entries", getAccountEntries);
router.post("/entries", createAccountEntry);
router.patch("/entries/:id", updateAccountEntry);
router.delete("/entries/:id", deleteAccountEntry);

module.exports = router;
