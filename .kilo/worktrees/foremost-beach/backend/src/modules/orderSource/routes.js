const express = require("express");
const auth = require("../../middlewares/auth");
const {
  createOrderSource,
  getAllOrderSources,
  updateOrderSource,
  deleteOrderSource
} = require("./controller");

const router = express.Router();

router.use(auth);

router.post("/", createOrderSource);
router.get("/", getAllOrderSources);
router.put("/:id", updateOrderSource);
router.delete("/:id", deleteOrderSource);

module.exports = router;
