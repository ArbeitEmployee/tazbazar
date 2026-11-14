const express = require("express");
const auth = require("../../middlewares/auth");
const responseCache = require("../../middlewares/responseCache");
const { upload, handleMulterError } = require("../../middlewares/upload");
const {
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand,
  getPublicBrands,
  uploadBrandLogo,
} = require("./controller");

const router = express.Router();

router.get("/public", responseCache(120000), getPublicBrands);

router.use(auth);

router.get("/", getBrands);
router.post("/logo-upload", upload.single("logo"), handleMulterError, uploadBrandLogo);
router.post("/", createBrand);
router.patch("/:id", updateBrand);
router.delete("/:id", deleteBrand);

module.exports = router;
