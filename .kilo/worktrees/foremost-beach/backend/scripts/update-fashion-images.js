/* Replace demo picsum images with verified fashion images. */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Category = require("../src/models/Category");
const Brand = require("../src/models/Brand");
const Product = require("../src/models/Product");
const Banner = require("../src/models/Banner");
const Campaign = require("../src/models/Campaign");

const IMGDIR = "C:\\Users\\USER\\AppData\\Local\\Temp\\opencode\\fashion-img";

function commonsUrl(slot) {
  const fp = path.join(IMGDIR, `c-${slot}.txt`);
  let raw = fs.readFileSync(fp, "utf8");
  if (raw.includes("\u0000")) {
    raw = fs.readFileSync(fp, "utf16le").replace(/^\uFEFF/, "");
  }
  const url = raw.split("||")[1].trim();
  return url;
}
const lf = (kw, lock) => `https://loremflickr.com/800/800/${kw}?lock=${lock}`;

const PRODUCT_IMG = {
  "Jamdani Saree - Red & Golden": commonsUrl("jamdani"),
  "Silk Katan Saree - Maroon": commonsUrl("banarasi"),
  "Cotton Block Print Saree": commonsUrl("cotton-saree"),
  "Georgette Party Saree with Blouse": commonsUrl("georgette-saree"),
  "Ladies Cotton Three-Piece": commonsUrl("salwar1"),
  "Embroidered Georgette Three-Piece": commonsUrl("salwar2"),
  "Lawn Printed Salwar Kameez": commonsUrl("lawn"),
  "Long Kurti - Floral Print": commonsUrl("kurti-long"),
  "Short Kurti for Girls": commonsUrl("kurti-short"),
  "Men's Premium Panjabi - White": commonsUrl("panjabi-white"),
  "Slim Fit Panjabi - Navy Blue": commonsUrl("panjabi-navy"),
  "Men's Cotton T-Shirt (3pcs Combo)": lf("t-shirt", 12),
  "Men's Polo T-Shirt Premium": commonsUrl("polo"),
  "Men's Formal Shirt - Sky Blue": commonsUrl("shirt"),
  "Premium Cherry Hijab": commonsUrl("hijab"),
  "Black Abaya Borka with Hijab": lf("hijab", 15),
  "Baby Girl Party Dress": commonsUrl("baby-dress"),
  "Boys Eid Panjabi Set": commonsUrl("boys-panjabi"),
  "Bridal Lehenga - Red": commonsUrl("lehenga"),
  "Men's Stretch Denim Jeans": lf("jeans", 20),
};

const CATEGORY_IMG = {
  Saree: commonsUrl("jamdani"),
  "Three-Piece & Salwar": commonsUrl("salwar1"),
  "Kurti & Tops": commonsUrl("kurti-long"),
  Panjabi: commonsUrl("panjabi-white"),
  "T-Shirt & Polo": commonsUrl("polo"),
  Shirt: commonsUrl("shirt"),
  "Hijab & Borka": commonsUrl("hijab"),
  "Kids Fashion": commonsUrl("baby-dress"),
  "Lehenga & Gown": commonsUrl("lehenga"),
  "Jeans & Pants": lf("jeans", 20),
};

const BRAND_IMG = {
  DeshiStyle: commonsUrl("jamdani"),
  RangLila: commonsUrl("salwar2"),
  UrbanThread: commonsUrl("polo"),
  EthnicQueen: commonsUrl("lehenga"),
  KidsWear: commonsUrl("baby-dress"),
};

const BANNER_IMG = {
  "Eid Fashion Collection 2026": commonsUrl("banner1"),
  "Saree Fest - Up To 30% Off": commonsUrl("banner3"),
  "Men's Panjabi Collection": commonsUrl("banner2"),
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  let n = 0;
  for (const [title, url] of Object.entries(PRODUCT_IMG)) {
    const r = await Product.updateOne(
      { title },
      { $set: { images: [{ url, publicId: "", mimeType: "image/jpeg" }] } },
    );
    n += r.modifiedCount;
    console.log(`product [${r.modifiedCount}] ${title}`);
  }
  for (const [name, image] of Object.entries(CATEGORY_IMG)) {
    const r = await Category.updateOne({ name }, { $set: { image } });
    console.log(`category [${r.modifiedCount}] ${name}`);
  }
  for (const [name, logoUrl] of Object.entries(BRAND_IMG)) {
    const r = await Brand.updateOne({ name }, { $set: { logoUrl } });
    console.log(`brand [${r.modifiedCount}] ${name}`);
  }
  for (const [title, image] of Object.entries(BANNER_IMG)) {
    const r = await Banner.updateOne({ title }, { $set: { image } });
    console.log(`banner [${r.modifiedCount}] ${title}`);
  }
  const rc = await Campaign.updateOne(
    { slug: "eid-fashion-sale" },
    { $set: { bannerImage: commonsUrl("banner1") } },
  );
  console.log(`campaign [${rc.modifiedCount}] eid-fashion-sale`);
  console.log(`DONE products updated: ${n}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("UPDATE FAILED:", e.message);
  process.exit(1);
});
