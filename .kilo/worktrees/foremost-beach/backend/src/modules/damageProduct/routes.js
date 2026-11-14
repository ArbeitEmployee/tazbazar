const express = require("express");
const auth = require("../../middlewares/auth");
const {
  createDamageProduct,
  getDamageProducts,
  deleteDamageProduct,
} = require("./controller");

const router = express.Router();

router.use(auth);

router.post("/", createDamageProduct);
router.get("/", getDamageProducts);
router.delete("/:id", deleteDamageProduct);

module.exports = router;
