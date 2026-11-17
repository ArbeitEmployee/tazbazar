require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../src/models/Product");
const { slugifyText } = require("../src/utils/slugUtils");

const migrateProductSlugs = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGODB_URI not found in .env file!");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log(" Connected to MongoDB.");

    const products = await Product.find({}).sort({ createdAt: 1 });
    console.log(`🔍 Found ${products.length} products to check...`);

    let updatedCount = 0;
    const existingSlugs = new Set();

    for (const prod of products) {
      if (prod.slug && !existingSlugs.has(prod.slug)) {
        existingSlugs.add(prod.slug);
        continue;
      }

      const title = prod.title || prod.name || "product";
      const baseSlug = slugifyText(title) || `product-${prod._id.toString().slice(-6)}`;
      let candidate = baseSlug;
      let suffix = 1;

      while (existingSlugs.has(candidate)) {
        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
      }

      prod.slug = candidate;
      existingSlugs.add(candidate);
      await prod.save();
      updatedCount += 1;
      console.log(`✅ [${updatedCount}] Product "${title}" -> slug: "${candidate}"`);
    }

    console.log(`\n🎉 Migration completed! Total products updated with SEO slugs: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
};

migrateProductSlugs();
