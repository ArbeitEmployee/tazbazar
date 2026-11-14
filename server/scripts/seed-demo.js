/* Demo seed: categories, brands, products, banners, coupons, campaign,
   shipping zones, payment methods, order sources. Idempotent. */
require("dotenv").config();
const mongoose = require("mongoose");

const Category = require("../src/models/Category");
const Brand = require("../src/models/Brand");
const Product = require("../src/models/Product");
const Banner = require("../src/models/Banner");
const Coupon = require("../src/models/Coupon");
const Campaign = require("../src/models/Campaign");
const ShippingZone = require("../src/models/ShippingZone");
const PaymentMethod = require("../src/models/PaymentMethod");
const OrderSource = require("../src/models/OrderSource");
const User = require("../src/models/User");

const img = (seed, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("connected");

  const admin =
    (await User.findOne({ email: "admin@gmail.com" })) ||
    (await User.findOne({ userType: "admin" }));
  if (!admin) throw new Error("No admin user found. Create admin first.");
  console.log("admin:", admin.email);

  // ---------- Categories ----------
  const catDefs = [
    { name: "Electronics", type: "Popular", description: "Gadgets & devices" },
    { name: "Fashion", type: "Popular", description: "Clothing & apparel" },
    { name: "Groceries", type: "General", description: "Daily essentials" },
    { name: "Beauty", type: "Best Selling", description: "Cosmetics & care" },
    { name: "Home & Living", type: "General", description: "Home essentials" },
    { name: "Sports", type: "Latest", description: "Sports & fitness" },
    { name: "Baby & Kids", type: "General", description: "Kids items" },
    { name: "Flash Sale", type: "Hot deals", description: "Limited deals" },
  ];
  const cats = {};
  for (const c of catDefs) {
    let doc = await Category.findOne({ name: c.name });
    if (!doc) {
      doc = await Category.create({
        ...c,
        image: img("cat-" + c.name.replace(/\s+/g, "-").toLowerCase(), 600, 400),
      });
      console.log("category created:", c.name);
    }
    cats[c.name] = doc;
  }

  // ---------- Brands ----------
  const brandNames = ["Apex", "FreshLine", "TechPro", "Glamour", "HomePlus"];
  for (const n of brandNames) {
    const slug = n.toLowerCase();
    const exists = await Brand.findOne({ slug });
    if (!exists) {
      await Brand.create({
        name: n,
        slug,
        description: `${n} official brand`,
        logoUrl: img("brand-" + slug, 300, 300),
        createdBy: admin._id,
      });
      console.log("brand created:", n);
    }
  }

  // ---------- Products ----------
  const prodDefs = [
    { t: "Wireless Bluetooth Headphones", c: "Electronics", p: 2500, s: 1990, type: "Best Selling", b: "TechPro", stock: 50 },
    { t: "Smart Watch Series 7", c: "Electronics", p: 4500, s: 3790, type: "Popular", b: "TechPro", stock: 30 },
    { t: "Men's Casual T-Shirt", c: "Fashion", p: 550, s: null, type: "Popular", b: "Apex", stock: 200 },
    { t: "Women's Summer Dress", c: "Fashion", p: 1450, s: 1190, type: "Latest", b: "Apex", stock: 80 },
    { t: "Organic Honey 500g", c: "Groceries", p: 480, s: null, type: "General", b: "FreshLine", stock: 150 },
    { t: "Face Wash Brightening 100ml", c: "Beauty", p: 350, s: 299, type: "Best Selling", b: "Glamour", stock: 120 },
    { t: "Ceramic Dinner Set 24pcs", c: "Home & Living", p: 3200, s: null, type: "General", b: "HomePlus", stock: 40 },
    { t: "Football Size 5", c: "Sports", p: 950, s: 799, type: "Latest", b: "Apex", stock: 60 },
    { t: "Baby Diapers Pack (50pcs)", c: "Baby & Kids", p: 1100, s: null, type: "General", b: "FreshLine", stock: 100 },
    { t: "LED Desk Lamp", c: "Home & Living", p: 1250, s: 990, type: "Hot deals", b: "TechPro", stock: 70 },
    { t: "Running Shoes Pro", c: "Sports", p: 2800, s: 2290, type: "Hot deals", b: "Apex", stock: 45 },
    { t: "Lipstick Matte Set (6pcs)", c: "Beauty", p: 850, s: null, type: "Popular", b: "Glamour", stock: 90 },
  ];
  const createdProducts = [];
  for (let i = 0; i < prodDefs.length; i++) {
    const d = prodDefs[i];
    let doc = await Product.findOne({ title: d.t });
    if (!doc) {
      const seed = "prod-" + i + "-" + d.t.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const payload = {
        title: d.t,
        description: `${d.t} - premium quality demo product. Cash on delivery available all over Bangladesh.`,
        price: d.p,
        priceType: d.s ? "best" : "single",
        category: cats[d.c]._id,
        productType: d.type,
        brand: d.b,
        stock: d.stock,
        sku: "DEMO-" + String(i + 1).padStart(4, "0"),
        features: ["Premium quality", "Cash on delivery", "Easy 7-day return"],
        images: [{ url: img(seed), publicId: "", mimeType: "image/jpeg" }],
        isActive: true,
        publicationStatus: "published",
        approvalStatus: "approved",
        ratingAverage: 4 + (i % 2) * 0.5,
        ratingCount: 5 + i * 3,
        viewCount: 50 + i * 20,
      };
      if (d.s) payload.salePrice = d.s;
      doc = await Product.create(payload);
      console.log("product created:", d.t);
    }
    createdProducts.push(doc);
  }

  // ---------- Banners ----------
  const bannerDefs = [
    { title: "Mega Sale Up To 50% Off", description: "Best deals on electronics & fashion", buttonLabel: "Shop Now", buttonLink: "/shop" },
    { title: "New Fashion Collection", description: "Latest trends just arrived", buttonLabel: "Explore", buttonLink: "/shop" },
    { title: "Free Delivery Inside Dhaka", description: "On orders over 1000 BDT", buttonLabel: "Order Now", buttonLink: "/shop" },
  ];
  for (let i = 0; i < bannerDefs.length; i++) {
    const b = bannerDefs[i];
    const exists = await Banner.findOne({ title: b.title });
    if (!exists) {
      await Banner.create({ ...b, image: img("banner-" + i, 1200, 400) });
      console.log("banner created:", b.title);
    }
  }

  // ---------- Coupons ----------
  const couponDefs = [
    { code: "WELCOME10", discountType: "percentage", discountValue: 10, maxDiscount: 200, minPurchase: 500 },
    { code: "FLAT100", discountType: "fixed", discountValue: 100, minPurchase: 1000 },
    { code: "FREESHIP", discountType: "fixed", offerType: "free_shipping", discountValue: 60, minPurchase: 800 },
  ];
  for (const c of couponDefs) {
    const exists = await Coupon.findOne({ code: c.code });
    if (!exists) {
      await Coupon.create({
        ...c,
        validUntil: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        usageLimit: 1000,
        createdBy: admin._id,
      });
      console.log("coupon created:", c.code);
    }
  }

  // ---------- Campaign ----------
  const campExists = await Campaign.findOne({ slug: "eid-mega-sale" });
  if (!campExists) {
    await Campaign.create({
      title: "Eid Mega Sale",
      slug: "eid-mega-sale",
      description: "Eid special discounts on all top products",
      bannerImage: img("campaign-eid", 1200, 400),
      products: createdProducts.slice(0, 6).map((p) => p._id),
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      isActive: true,
      createdBy: admin._id,
    });
    console.log("campaign created: Eid Mega Sale");
  }

  // ---------- Shipping zones ----------
  const zoneExists = await ShippingZone.findOne({ name: "Bangladesh Standard" });
  if (!zoneExists) {
    await ShippingZone.create({
      name: "Bangladesh Standard",
      isActive: true,
      rules: [
        { districts: ["Dhaka"], shippingFee: 60, estimatedMinDays: 1, estimatedMaxDays: 2 },
        { districts: ["Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh"], shippingFee: 120, estimatedMinDays: 2, estimatedMaxDays: 4 },
      ],
      createdBy: admin._id,
    });
    console.log("shipping zone created");
  }

  // ---------- Payment methods ----------
  const pmDefs = [
    { code: "cash-on-delivery", type: "Cash on Delivery", channelType: "cod", instructions: "Pay in cash when you receive the product." },
    { code: "bkash-manual", type: "bKash", channelType: "manual", accountNo: "01XXXXXXXXX (Merchant)", instructions: "Send Money to the number and submit TrxID." },
    { code: "nagad-manual", type: "Nagad", channelType: "manual", accountNo: "01XXXXXXXXX (Merchant)", instructions: "Send Money to the number and submit TrxID." },
  ];
  for (const pm of pmDefs) {
    const exists = await PaymentMethod.findOne({ code: pm.code });
    if (!exists) {
      await PaymentMethod.create({ ...pm, isActive: true, createdBy: admin._id });
      console.log("payment method created:", pm.code);
    }
  }

  // ---------- Order sources ----------
  for (const n of ["Website", "Facebook", "Phone", "WhatsApp"]) {
    const exists = await OrderSource.findOne({ name: n });
    if (!exists) {
      await OrderSource.create({ name: n });
      console.log("order source created:", n);
    }
  }

  const counts = {
    categories: await Category.countDocuments(),
    brands: await Brand.countDocuments(),
    products: await Product.countDocuments(),
    banners: await Banner.countDocuments(),
    coupons: await Coupon.countDocuments(),
    campaigns: await Campaign.countDocuments(),
    shippingZones: await ShippingZone.countDocuments(),
    paymentMethods: await PaymentMethod.countDocuments(),
    orderSources: await OrderSource.countDocuments(),
  };
  console.log("DONE:", JSON.stringify(counts, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("SEED FAILED:", e.message);
  process.exit(1);
});
