/**
 * Seed Banners: Hero sliders and Promotional cards
 * Run: node scripts/seed-banners.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Banner = require("../src/models/Banner");

const bannersToSeed = [
  // ── Hero Banners (Main Sliders) ────────────────────────
  {
    title: "Upgrade to Next-Gen Gadgets",
    description: "Experience premium sound, flagship smartphones & pro laptops with up to 35% OFF.",
    buttonLabel: "Shop Gadgets",
    buttonLink: "/shop?category=Gadgets",
    type: "hero",
    page: "home",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
    isActive: true,
  },
  {
    title: "New Season Fashion Drop 2026",
    description: "Discover the newest trendy styles in men's and women's apparel at unbelievable prices.",
    buttonLabel: "Explore Fashion",
    buttonLink: "/shop?category=Fashion",
    type: "hero",
    page: "home",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
    isActive: true,
  },
  {
    title: "Smartwatches & Wearables Collection",
    description: "Track your fitness in style. AMOLED displays, 7-day battery life, and smart health metrics.",
    buttonLabel: "View Smartwatches",
    buttonLink: "/shop",
    type: "hero",
    page: "home",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    isActive: true,
  },

  // ── Promotional Cards (Side Promo Banners) ──────────────
  {
    title: "Hot Deals: Audio & Earbuds",
    description: "Active Noise Cancellation TWS Earbuds at special limited discount.",
    buttonLabel: "Grab Now",
    buttonLink: "/shop?badge=hot",
    type: "promotional",
    page: "home",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80",
    isActive: true,
  },
  {
    title: "Trending Footwear Collection",
    description: "Step into comfort with chunky sneakers & casual shoes.",
    buttonLabel: "Shop Shoes",
    buttonLink: "/shop",
    type: "promotional",
    page: "home",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
    isActive: true,
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Update existing banners to have type: hero and page: home if not set
  await Banner.updateMany({ type: { $exists: false } }, { $set: { type: "hero", page: "home" } });

  let added = 0;
  for (const b of bannersToSeed) {
    const exists = await Banner.findOne({ title: b.title });
    if (!exists) {
      await Banner.create(b);
      console.log(`  Created banner: "${b.title}" (${b.type})`);
      added++;
    } else {
      console.log(`  Skipped (exists): "${b.title}"`);
    }
  }

  const allBanners = await Banner.find({ isActive: true });
  console.log(`\n Total active banners in DB: ${allBanners.length}`);
  await mongoose.disconnect();
  console.log(" Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error(" Error:", err.message);
  process.exit(1);
});
