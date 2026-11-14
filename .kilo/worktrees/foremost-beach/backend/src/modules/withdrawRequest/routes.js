const express = require("express");
const auth = require("../../middlewares/auth");
const {
  createWithdrawRequest,
  getWithdrawRequests,
  updateWithdrawRequestStatus,
} = require("./controller");

const router = express.Router();

router.use(auth);

router.post("/", createWithdrawRequest);
router.get("/", getWithdrawRequests);
router.patch("/:id/status", updateWithdrawRequestStatus);

module.exports = router;
