/**
 * Seed: Fashion & Gadget categories + products
 * Run: node scripts/seed-fashion-gadget.js
 * Idempotent — skips already-existing docs.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");

const img = (seed, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // ─────────────────────────────────────────────
  // 1. CATEGORIES
  // ─────────────────────────────────────────────
  const categoryDefs = [
    // Parent Categories
    { name: "Fashion",          type: "Popular",      description: "Trendy clothing, shoes & accessories for all styles" },
    { name: "Gadgets",          type: "Popular",      description: "Latest tech gadgets, electronics & smart devices" },

    // Fashion sub-categories
    { name: "Men's Clothing",   type: "General",      description: "T-shirts, shirts, pants, jackets for men",    parentName: "Fashion" },
    { name: "Women's Clothing", type: "Best Selling", description: "Dresses, tops, ethnic wear for women",        parentName: "Fashion" },
    { name: "Footwear",         type: "General",      description: "Sneakers, heels, loafers & sandals",          parentName: "Fashion" },
    { name: "Accessories",      type: "Hot deals",    description: "Bags, belts, sunglasses & watches",           parentName: "Fashion" },

    // Gadget sub-categories
    { name: "Smartphones",      type: "Best Selling", description: "Latest Android & iOS smartphones",            parentName: "Gadgets" },
    { name: "Laptops",          type: "Popular",      description: "Gaming, office & ultrabook laptops",          parentName: "Gadgets" },
    { name: "Smart Watches",    type: "Latest",       description: "Fitness trackers & smartwatches",             parentName: "Gadgets" },
    { name: "Earbuds & Audio",  type: "Hot deals",    description: "TWS earbuds, headphones & speakers",          parentName: "Gadgets" },
  ];

  const catMap = {};

  for (const def of categoryDefs) {
    let parent = null;
    if (def.parentName) {
      parent = catMap[def.parentName]?._id || null;
    }

    let cat = await Category.findOne({ name: def.name });
    if (!cat) {
      cat = await Category.create({
        name:        def.name,
        type:        def.type,
        description: def.description,
        parent:      parent,
        isActive:    true,
        image:       img(def.name.replace(/\s+/g, "-").toLowerCase()),
      });
      console.log(`  ✅ Created category: ${def.name}`);
    } else {
      console.log(`  ⏭  Skipped category (exists): ${def.name}`);
    }
    catMap[def.name] = cat;
  }

  // ─────────────────────────────────────────────
  // 2. PRODUCTS
  // ─────────────────────────────────────────────
  const productDefs = [
    // ── Men's Clothing ──────────────────────────
    {
      title: "Classic Slim-Fit Oxford Shirt",
      description: "A timeless slim-fit oxford shirt crafted from 100% breathable cotton. Perfect for office or casual outings.",
      price: 1299,  salePrice: 999,  stock: 120, brand: "TrendWear",
      productType: "Best Selling", category: "Men's Clothing",
      images: [img("oxford-shirt-1"), img("oxford-shirt-2")],
      colors: ["White", "Light Blue", "Charcoal"],
      features: ["Breathable Cotton", "Slim Fit", "Machine Washable", "Button-down Collar"],
      specifications: [{ key: "Material", value: "100% Cotton" }, { key: "Fit", value: "Slim Fit" }],
    },
    {
      title: "Men's Chino Stretch Trousers",
      description: "Comfortable stretch chino trousers with a modern tapered fit. Available in versatile neutral tones.",
      price: 1799,  salePrice: 1399, stock: 85,  brand: "FitZone",
      productType: "Popular", category: "Men's Clothing",
      images: [img("chino-trousers-1"), img("chino-trousers-2")],
      colors: ["Khaki", "Navy", "Olive", "Beige"],
      features: ["Stretch Fabric", "Tapered Fit", "Side Pockets", "Zip Fly"],
      specifications: [{ key: "Material", value: "98% Cotton, 2% Spandex" }, { key: "Fit", value: "Tapered" }],
    },
    {
      title: "Graphic Oversized T-Shirt",
      description: "Trendy oversized graphic tee with premium cotton blend. Streetwear-inspired design for everyday wear.",
      price: 799,   salePrice: 599,  stock: 200, brand: "UrbanCo",
      productType: "Hot deals", category: "Men's Clothing",
      images: [img("graphic-tshirt-1"), img("graphic-tshirt-2")],
      colors: ["Black", "White", "Grey"],
      features: ["Oversized Fit", "Premium Cotton", "Unique Print"],
      specifications: [{ key: "Material", value: "100% Cotton" }],
    },

    // ── Women's Clothing ─────────────────────────
    {
      title: "Floral Wrap Midi Dress",
      description: "Elegant floral wrap midi dress with a flattering silhouette. Perfect for brunches, parties or beach outings.",
      price: 2299,  salePrice: 1799, stock: 60,  brand: "Bloom Fashion",
      productType: "Best Selling", category: "Women's Clothing",
      images: [img("floral-dress-1"), img("floral-dress-2")],
      colors: ["Rose Floral", "Blue Floral", "Yellow Floral"],
      features: ["Wrap Design", "Midi Length", "Side Tie Closure", "Lined"],
      specifications: [{ key: "Material", value: "Viscose" }, { key: "Length", value: "Midi" }],
    },
    {
      title: "Women's Linen Co-ord Set",
      description: "Stylish linen co-ord set with wide-leg trousers and a crop top. Ideal for summer and festive occasions.",
      price: 2799,  salePrice: 2199, stock: 45,  brand: "LinenLux",
      productType: "Latest", category: "Women's Clothing",
      images: [img("linen-coord-1"), img("linen-coord-2")],
      colors: ["Ivory", "Sage Green", "Dusty Pink"],
      features: ["Premium Linen", "Matching Set", "Relaxed Fit"],
      specifications: [{ key: "Material", value: "100% Linen" }],
    },

    // ── Footwear ─────────────────────────────────
    {
      title: "Men's Chunky Sole Sneakers",
      description: "Bold chunky-sole sneakers with cushioned insoles for all-day comfort. Elevate any streetwear look.",
      price: 3499,  salePrice: 2799, stock: 75,  brand: "StepUp",
      productType: "Popular", category: "Footwear",
      images: [img("chunky-sneakers-1"), img("chunky-sneakers-2")],
      colors: ["White/Grey", "Black", "Beige"],
      features: ["Chunky Sole", "Cushioned Insole", "Durable Rubber Outsole"],
      specifications: [{ key: "Sole", value: "Rubber" }, { key: "Closure", value: "Lace-up" }],
    },
    {
      title: "Women's Block Heel Sandals",
      description: "Classy block heel sandals with ankle strap for extra support. Goes perfectly with dresses or jeans.",
      price: 2199,  salePrice: 1699, stock: 55,  brand: "HeelHeaven",
      productType: "Hot deals", category: "Footwear",
      images: [img("block-heel-1"), img("block-heel-2")],
      colors: ["Nude", "Black", "Red"],
      features: ["Block Heel", "Ankle Strap", "Non-Slip Sole"],
      specifications: [{ key: "Heel Height", value: "5cm" }, { key: "Material", value: "Faux Leather" }],
    },

    // ── Accessories ───────────────────────────────
    {
      title: "Crossbody Leather Sling Bag",
      description: "Compact yet spacious faux leather crossbody sling bag with adjustable strap and multiple pockets.",
      price: 1599,  salePrice: 1199, stock: 90,  brand: "CarryOn",
      productType: "Best Selling", category: "Accessories",
      images: [img("sling-bag-1"), img("sling-bag-2")],
      colors: ["Camel", "Black", "Tan"],
      features: ["Adjustable Strap", "Zip Closure", "Multiple Pockets"],
      specifications: [{ key: "Material", value: "Faux Leather" }],
    },
    {
      title: "Polarized Aviator Sunglasses",
      description: "UV400 polarized aviator sunglasses with metal frame. Protects eyes while keeping you stylish.",
      price: 999,   salePrice: 699,  stock: 150, brand: "ShadeKing",
      productType: "Hot deals", category: "Accessories",
      images: [img("aviator-sunglasses-1"), img("aviator-sunglasses-2")],
      colors: ["Gold/Brown", "Silver/Grey", "Black/Green"],
      features: ["UV400 Protection", "Polarized Lens", "Metal Frame", "Lightweight"],
      specifications: [{ key: "Lens", value: "Polarized Glass" }, { key: "Frame", value: "Metal Alloy" }],
    },

    // ── Smartphones ───────────────────────────────
    {
      title: "ProMax X12 Smartphone",
      description: "Flagship-grade smartphone with 6.7\" AMOLED display, 108MP triple camera, 5000mAh battery & 5G support.",
      price: 52000, salePrice: 47999, stock: 30, brand: "ProMax",
      productType: "Best Selling", category: "Smartphones",
      images: [img("smartphone-promax-1"), img("smartphone-promax-2")],
      colors: ["Midnight Black", "Ocean Blue", "Titan Silver"],
      features: ["6.7\" AMOLED", "108MP Camera", "5G Ready", "5000mAh Battery", "120Hz Refresh Rate"],
      specifications: [
        { key: "Display", value: "6.7\" AMOLED 120Hz" },
        { key: "RAM", value: "12GB" },
        { key: "Storage", value: "256GB" },
        { key: "Battery", value: "5000mAh" },
        { key: "Camera", value: "108MP + 12MP + 5MP" },
      ],
    },
    {
      title: "BudgetPro G5 4G Smartphone",
      description: "Reliable budget smartphone with 6.5\" IPS display, 50MP camera, 5000mAh battery and face unlock.",
      price: 18999, salePrice: 15999, stock: 75, brand: "BudgetPro",
      productType: "Hot deals", category: "Smartphones",
      images: [img("smartphone-budget-1"), img("smartphone-budget-2")],
      colors: ["Gradient Blue", "Space Black"],
      features: ["6.5\" IPS Display", "50MP Camera", "5000mAh Battery", "Face Unlock", "4G LTE"],
      specifications: [
        { key: "Display", value: "6.5\" IPS" },
        { key: "RAM", value: "6GB" },
        { key: "Storage", value: "128GB" },
        { key: "Battery", value: "5000mAh" },
      ],
    },

    // ── Laptops ───────────────────────────────────
    {
      title: "SlimBook Pro 14 Ultrabook",
      description: "Ultra-thin business laptop with Intel Core i7, 16GB RAM, 512GB SSD, 14\" FHD display & 12hr battery.",
      price: 89999, salePrice: 79999, stock: 20, brand: "SlimBook",
      productType: "Popular", category: "Laptops",
      images: [img("laptop-slimbook-1"), img("laptop-slimbook-2")],
      colors: ["Space Grey", "Silver"],
      features: ["Intel Core i7", "16GB RAM", "512GB SSD", "14\" FHD IPS", "12hr Battery", "Backlit Keyboard"],
      specifications: [
        { key: "Processor", value: "Intel Core i7-1255U" },
        { key: "RAM", value: "16GB DDR5" },
        { key: "Storage", value: "512GB NVMe SSD" },
        { key: "Display", value: "14\" FHD IPS 1920×1080" },
        { key: "Battery", value: "65Wh" },
        { key: "Weight", value: "1.4 kg" },
      ],
    },
    {
      title: "GameBeast RX Gaming Laptop",
      description: "High-performance gaming laptop with RTX 4060, AMD Ryzen 7, 32GB RAM, 1TB SSD and 144Hz display.",
      price: 139999, salePrice: 124999, stock: 15, brand: "GameBeast",
      productType: "Latest", category: "Laptops",
      images: [img("laptop-gaming-1"), img("laptop-gaming-2")],
      colors: ["Stealth Black"],
      features: ["RTX 4060 GPU", "AMD Ryzen 7", "144Hz Display", "32GB RAM", "RGB Keyboard"],
      specifications: [
        { key: "Processor", value: "AMD Ryzen 7 7745HX" },
        { key: "GPU", value: "NVIDIA RTX 4060 8GB" },
        { key: "RAM", value: "32GB DDR5" },
        { key: "Storage", value: "1TB NVMe SSD" },
        { key: "Display", value: "15.6\" FHD 144Hz" },
      ],
    },

    // ── Smart Watches ─────────────────────────────
    {
      title: "FitPro Ultra Smart Watch",
      description: "Premium smartwatch with AMOLED display, blood oxygen, heart rate, GPS, 7-day battery & IP68 waterproof.",
      price: 12999, salePrice: 9999, stock: 60, brand: "FitPro",
      productType: "Best Selling", category: "Smart Watches",
      images: [img("smartwatch-fitpro-1"), img("smartwatch-fitpro-2")],
      colors: ["Midnight Black", "Rose Gold", "Silver"],
      features: ["AMOLED Display", "Blood Oxygen Monitor", "Heart Rate", "GPS", "IP68 Waterproof", "7-Day Battery"],
      specifications: [
        { key: "Display", value: "1.43\" AMOLED" },
        { key: "Battery", value: "7 days" },
        { key: "Water Resistance", value: "IP68" },
        { key: "Sensors", value: "HR, SpO2, Accelerometer, GPS" },
      ],
    },
    {
      title: "ZenBand Smart Fitness Tracker",
      description: "Lightweight fitness band with step count, sleep tracker, notifications and 14-day battery life.",
      price: 3499, salePrice: 2799, stock: 120, brand: "ZenFit",
      productType: "Hot deals", category: "Smart Watches",
      images: [img("fitness-band-1"), img("fitness-band-2")],
      colors: ["Black", "Blue", "Green"],
      features: ["Step Counter", "Sleep Monitor", "Smart Notifications", "14-Day Battery"],
      specifications: [
        { key: "Display", value: "0.96\" OLED" },
        { key: "Battery", value: "14 days" },
        { key: "Compatibility", value: "Android & iOS" },
      ],
    },

    // ── Earbuds & Audio ──────────────────────────
    {
      title: "SoundDrop Pro TWS Earbuds",
      description: "Premium TWS earbuds with ANC, 30hr total playtime, Hi-Fi audio and IPX5 water resistance.",
      price: 8999,  salePrice: 6999, stock: 80, brand: "SoundDrop",
      productType: "Best Selling", category: "Earbuds & Audio",
      images: [img("earbuds-sounddrop-1"), img("earbuds-sounddrop-2")],
      colors: ["Pearl White", "Matte Black"],
      features: ["Active Noise Cancellation", "30hr Playtime", "Hi-Fi Audio", "IPX5 Water Resistant", "Touch Controls"],
      specifications: [
        { key: "Driver", value: "11mm Dynamic" },
        { key: "Battery", value: "8hr (bud) + 22hr (case)" },
        { key: "Connectivity", value: "Bluetooth 5.3" },
        { key: "ANC", value: "Yes, up to -35dB" },
      ],
    },
    {
      title: "BassMax Over-Ear Headphones",
      description: "Studio-grade over-ear headphones with 40mm driver, foldable design and wired/wireless dual mode.",
      price: 5999,  salePrice: 4499, stock: 55, brand: "BassMax",
      productType: "Popular", category: "Earbuds & Audio",
      images: [img("headphones-bassmax-1"), img("headphones-bassmax-2")],
      colors: ["Black/Red", "Black/Gold"],
      features: ["40mm Driver", "Foldable", "Wired & Wireless", "40hr Battery", "Built-in Mic"],
      specifications: [
        { key: "Driver", value: "40mm" },
        { key: "Battery", value: "40hr" },
        { key: "Connectivity", value: "Bluetooth 5.0 + 3.5mm Jack" },
        { key: "Frequency", value: "20Hz - 20kHz" },
      ],
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const def of productDefs) {
    const exists = await Product.findOne({ title: def.title });
    if (exists) {
      console.log(`  ⏭  Skipped product (exists): ${def.title}`);
      skipped++;
      continue;
    }

    const catDoc = catMap[def.category];
    if (!catDoc) {
      console.log(`  ❌ Category not found for: ${def.title} — ${def.category}`);
      continue;
    }

    await Product.create({
      title:             def.title,
      description:       def.description,
      price:             def.price,
      salePrice:         def.salePrice ?? null,
      priceType:         def.salePrice ? "best" : "single",
      stock:             def.stock,
      brand:             def.brand,
      productType:       def.productType,
      category:          catDoc._id,
      images:            def.images || [],
      colors:            def.colors || [],
      features:          def.features || [],
      specifications:    def.specifications || [],
      isActive:          true,
      approvalStatus:    "approved",
      publicationStatus: "published",
      marketplaceType:   "simple",
      deliveryMinDays:   3,
      deliveryMaxDays:   7,
    });

    console.log(`  ✅ Created product: ${def.title}`);
    created++;
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`📦 Categories: ${Object.keys(catMap).length} total`);
  console.log(`🛍  Products: ${created} created, ${skipped} skipped`);
  console.log("─────────────────────────────────────────");
  await mongoose.disconnect();
  console.log("✅ Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
