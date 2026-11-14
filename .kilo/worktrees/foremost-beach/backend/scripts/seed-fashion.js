/* Clear all catalog/demo data, seed fashion-only (kapor chupor) data. */
require("dotenv").config();
const mongoose = require("mongoose");

const Category = require("../src/models/Category");
const Brand = require("../src/models/Brand");
const Product = require("../src/models/Product");
const Banner = require("../src/models/Banner");
const Coupon = require("../src/models/Coupon");
const Campaign = require("../src/models/Campaign");
const User = require("../src/models/User");

const img = (seed, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("connected");

  const admin =
    (await User.findOne({ email: "admin@gmail.com" })) ||
    (await User.findOne({ userType: "admin" }));
  if (!admin) throw new Error("No admin user found.");
  console.log("admin:", admin.email);

  // ---------- REMOVE all old data ----------
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Brand.deleteMany({});
  await Banner.deleteMany({});
  await Coupon.deleteMany({});
  await Campaign.deleteMany({});
  console.log("old data removed");

  // ---------- Categories (fashion only) ----------
  const catDefs = [
    { name: "Saree", type: "Popular", description: "Jamdani, silk, cotton & georgette saree" },
    { name: "Three-Piece & Salwar", type: "Popular", description: "Ladies three-piece & salwar kameez" },
    { name: "Kurti & Tops", type: "Best Selling", description: "Stylish kurti & tops for women" },
    { name: "Panjabi", type: "Popular", description: "Men's panjabi for eid & occasions" },
    { name: "T-Shirt & Polo", type: "General", description: "Casual t-shirt & polo for men" },
    { name: "Shirt", type: "General", description: "Formal & casual shirts" },
    { name: "Hijab & Borka", type: "Best Selling", description: "Hijab, abaya & borka collection" },
    { name: "Kids Fashion", type: "Latest", description: "Baby & kids dresses" },
    { name: "Lehenga & Gown", type: "Hot deals", description: "Party lehenga & gowns" },
    { name: "Jeans & Pants", type: "General", description: "Denim jeans & pants" },
  ];
  const cats = {};
  for (const c of catDefs) {
    const doc = await Category.create({
      ...c,
      image: img("fashion-cat-" + c.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase(), 600, 400),
    });
    cats[c.name] = doc;
  }
  console.log("categories:", Object.keys(cats).length);

  // ---------- Brands ----------
  const brandNames = ["DeshiStyle", "RangLila", "UrbanThread", "EthnicQueen", "KidsWear"];
  for (const n of brandNames) {
    await Brand.create({
      name: n,
      slug: n.toLowerCase(),
      description: `${n} fashion brand`,
      logoUrl: img("fashion-brand-" + n.toLowerCase(), 300, 300),
      createdBy: admin._id,
    });
  }
  console.log("brands:", brandNames.length);

  // ---------- Products (all kapor chupor) ----------
  const prodDefs = [
    { t: "Jamdani Saree - Red & Golden", c: "Saree", p: 3500, s: 2890, type: "Best Selling", b: "DeshiStyle", stock: 25 },
    { t: "Silk Katan Saree - Maroon", c: "Saree", p: 5200, s: null, type: "Popular", b: "RangLila", stock: 15 },
    { t: "Cotton Block Print Saree", c: "Saree", p: 1450, s: 1190, type: "Popular", b: "DeshiStyle", stock: 40 },
    { t: "Georgette Party Saree with Blouse", c: "Saree", p: 2800, s: null, type: "Latest", b: "EthnicQueen", stock: 20 },
    { t: "Ladies Cotton Three-Piece", c: "Three-Piece & Salwar", p: 1250, s: 990, type: "Best Selling", b: "RangLila", stock: 60 },
    { t: "Embroidered Georgette Three-Piece", c: "Three-Piece & Salwar", p: 2200, s: null, type: "Popular", b: "EthnicQueen", stock: 35 },
    { t: "Lawn Printed Salwar Kameez", c: "Three-Piece & Salwar", p: 1650, s: 1390, type: "Latest", b: "DeshiStyle", stock: 50 },
    { t: "Long Kurti - Floral Print", c: "Kurti & Tops", p: 950, s: 799, type: "Best Selling", b: "RangLila", stock: 70 },
    { t: "Short Kurti for Girls", c: "Kurti & Tops", p: 750, s: null, type: "Popular", b: "UrbanThread", stock: 80 },
    { t: "Men's Premium Panjabi - White", c: "Panjabi", p: 1850, s: 1490, type: "Best Selling", b: "UrbanThread", stock: 45 },
    { t: "Slim Fit Panjabi - Navy Blue", c: "Panjabi", p: 1650, s: null, type: "Popular", b: "DeshiStyle", stock: 40 },
    { t: "Men's Cotton T-Shirt (3pcs Combo)", c: "T-Shirt & Polo", p: 900, s: 749, type: "Hot deals", b: "UrbanThread", stock: 100 },
    { t: "Men's Polo T-Shirt Premium", c: "T-Shirt & Polo", p: 650, s: null, type: "General", b: "UrbanThread", stock: 120 },
    { t: "Men's Formal Shirt - Sky Blue", c: "Shirt", p: 1100, s: 890, type: "General", b: "UrbanThread", stock: 55 },
    { t: "Premium Cherry Hijab", c: "Hijab & Borka", p: 450, s: 380, type: "Best Selling", b: "EthnicQueen", stock: 150 },
    { t: "Black Abaya Borka with Hijab", c: "Hijab & Borka", p: 1950, s: null, type: "Popular", b: "EthnicQueen", stock: 30 },
    { t: "Baby Girl Party Dress", c: "Kids Fashion", p: 1250, s: 990, type: "Latest", b: "KidsWear", stock: 35 },
    { t: "Boys Eid Panjabi Set", c: "Kids Fashion", p: 1350, s: null, type: "Popular", b: "KidsWear", stock: 40 },
    { t: "Bridal Lehenga - Red", c: "Lehenga & Gown", p: 8500, s: 7490, type: "Hot deals", b: "EthnicQueen", stock: 8 },
    { t: "Men's Stretch Denim Jeans", c: "Jeans & Pants", p: 1350, s: 1090, type: "General", b: "UrbanThread", stock: 65 },
  ];
  const createdProducts = [];
  for (let i = 0; i < prodDefs.length; i++) {
    const d = prodDefs[i];
    const seed = "fashion-" + i + "-" + d.t.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const payload = {
      title: d.t,
      description: `${d.t} - premium quality fashion item. Cash on delivery available all over Bangladesh. Easy 7-day exchange.`,
      price: d.p,
      priceType: d.s ? "best" : "single",
      category: cats[d.c]._id,
      productType: d.type,
      brand: d.b,
      stock: d.stock,
      sku: "FSH-" + String(i + 1).padStart(4, "0"),
      features: ["Premium fabric", "Cash on delivery", "Easy 7-day exchange"],
      images: [{ url: img(seed), publicId: "", mimeType: "image/jpeg" }],
      isActive: true,
      publicationStatus: "published",
      approvalStatus: "approved",
      ratingAverage: 4 + ((i % 3) * 0.5 > 5 ? 0 : (i % 2) * 0.5),
      ratingCount: 8 + i * 4,
      viewCount: 60 + i * 25,
    };
    if (d.s) payload.salePrice = d.s;
    const doc = await Product.create(payload);
    createdProducts.push(doc);
  }
  console.log("products:", createdProducts.length);

  // ---------- Banners ----------
  const bannerDefs = [
    { title: "Eid Fashion Collection 2026", description: "Saree, Panjabi & Three-Piece new arrival", buttonLabel: "Shop Now", buttonLink: "/shop" },
    { title: "Saree Fest - Up To 30% Off", description: "Jamdani, silk & cotton saree", buttonLabel: "Explore Saree", buttonLink: "/shop" },
    { title: "Men's Panjabi Collection", description: "Premium panjabi for every occasion", buttonLabel: "Shop Panjabi", buttonLink: "/shop" },
  ];
  for (let i = 0; i < bannerDefs.length; i++) {
    await Banner.create({ ...bannerDefs[i], image: img("fashion-banner-" + i, 1200, 400) });
  }
  console.log("banners:", bannerDefs.length);

  // ---------- Coupons ----------
  const couponDefs = [
    { code: "FASHION10", discountType: "percentage", discountValue: 10, maxDiscount: 300, minPurchase: 500 },
    { code: "EID200", discountType: "fixed", discountValue: 200, minPurchase: 2000 },
    { code: "FREESHIP", discountType: "fixed", offerType: "free_shipping", discountValue: 60, minPurchase: 800 },
  ];
  for (const c of couponDefs) {
    await Coupon.create({
      ...c,
      validUntil: new Date(Date.now() + 90 * 24 * 3600 * 1000),
      usageLimit: 1000,
      createdBy: admin._id,
    });
  }
  console.log("coupons:", couponDefs.length);

  // ---------- Campaign ----------
  await Campaign.create({
    title: "Eid Fashion Sale",
    slug: "eid-fashion-sale",
    description: "Eid special discount on saree, panjabi & three-piece",
    bannerImage: img("fashion-campaign-eid", 1200, 400),
    products: createdProducts.slice(0, 8).map((p) => p._id),
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    isActive: true,
    createdBy: admin._id,
  });
  console.log("campaign: Eid Fashion Sale");

  const counts = {
    categories: await Category.countDocuments(),
    brands: await Brand.countDocuments(),
    products: await Product.countDocuments(),
    banners: await Banner.countDocuments(),
    coupons: await Coupon.countDocuments(),
    campaigns: await Campaign.countDocuments(),
  };
  console.log("DONE:", JSON.stringify(counts, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("SEED FAILED:", e.message);
  process.exit(1);
});
