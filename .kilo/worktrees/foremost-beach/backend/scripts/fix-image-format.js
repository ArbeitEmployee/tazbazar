/* Convert product images from {url} objects to plain URL strings (public API format). */
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../src/models/Product");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const prods = await Product.find().select("images").lean();
  let n = 0;
  for (const p of prods) {
    const urls = (p.images || [])
      .map((img) => (typeof img === "string" ? img : img && (img.url || img.data)))
      .filter(Boolean);
    await Product.updateOne({ _id: p._id }, { $set: { images: urls } });
    n++;
  }
  console.log("fixed:", n);
  await mongoose.disconnect();
})();
