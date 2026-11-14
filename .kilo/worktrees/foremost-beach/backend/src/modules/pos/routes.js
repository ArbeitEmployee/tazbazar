const express = require("express");
const router = express.Router();
const posController = require("./controllers");
const auth = require("../../middlewares/auth");

const isAdmin = (req, res, next) => {
  if (req.user && req.user.userType === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin only." });
  }
};

router.post("/", auth, isAdmin, posController.createSale);
router.get("/", auth, isAdmin, posController.getSales);
router.put("/:id", auth, isAdmin, posController.updateSale);
router.delete("/:id", auth, isAdmin, posController.deleteSale);

module.exports = router;