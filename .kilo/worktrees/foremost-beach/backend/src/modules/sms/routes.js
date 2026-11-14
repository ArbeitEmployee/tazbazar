// sms/routes.js
const express = require("express");
const router = express.Router();
const smsController = require("./controller");
const auth = require("../../middlewares/auth");

router.get("/config", auth, smsController.getSmsConfig);
router.post("/test", auth, smsController.testSms);

module.exports = router;