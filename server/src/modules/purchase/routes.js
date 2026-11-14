const express = require("express");
const auth = require("../../middlewares/auth");
const {
  createPurchase,
  getPurchases,
  addPurchasePayment,
  updatePurchase,
  deletePurchase,
} = require("./controller");

const router = express.Router();

router.use(auth);

router.post("/", createPurchase);
router.get("/", getPurchases);
router.patch("/:id/payment", addPurchasePayment);
router.put("/:id", updatePurchase);
router.patch("/:id", updatePurchase);
router.delete("/:id", deletePurchase);

module.exports = router;
