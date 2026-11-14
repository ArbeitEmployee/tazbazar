const express = require("express");
const router = express.Router();
const supplierController = require("./controllers");
const auth = require("../../middlewares/auth");

router.use(auth);

router.post("/", supplierController.createSupplier);
router.get("/", supplierController.getSuppliers);

module.exports = router;
