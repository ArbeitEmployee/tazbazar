require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Product = require("../src/models/Product");
const ProductImage = require("../src/models/ProductImage");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function syncImagesToCloudinary() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is required");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);

    const urlCache = new Map();
    let updatedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.images || product.images.length === 0) continue;

      let hasChanges = false;
      const newImages = [];

      for (const imgItem of product.images) {
        let rawUrl = "";
        let existingPublicId = "";

        if (typeof imgItem === "string") {
          rawUrl = imgItem;
        } else if (imgItem && typeof imgItem === "object") {
          rawUrl = imgItem.url || imgItem.data || imgItem.secure_url || "";
          existingPublicId = imgItem.publicId || "";
        }

        if (!rawUrl) continue;

        // If already on Cloudinary, keep it
        if (rawUrl.includes("res.cloudinary.com")) {
          newImages.push(
            typeof imgItem === "object"
              ? imgItem
              : { url: rawUrl, publicId: existingPublicId, mimeType: "image/jpeg" }
          );
          continue;
        }

        // Upload to Cloudinary
        try {
          let uploadResult;
          if (urlCache.has(rawUrl)) {
            uploadResult = urlCache.get(rawUrl);
            console.log(`[${i + 1}/${products.length}] Reusing Cloudinary upload for: ${product.title}`);
          } else {
            console.log(`[${i + 1}/${products.length}] Uploading to Cloudinary for: ${product.title}...`);
            uploadResult = await cloudinary.uploader.upload(rawUrl, {
              folder: "products",
              resource_type: "image",
            });
            urlCache.set(rawUrl, uploadResult);
          }

          // Create ProductImage doc
          const imageDoc = await ProductImage.create({
            data: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            mimeType: `image/${uploadResult.format || "jpeg"}`,
            size: uploadResult.bytes || 0,
            format: uploadResult.format || "jpg",
            width: uploadResult.width || 800,
            height: uploadResult.height || 800,
            resourceType: "image",
          });

          newImages.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            mimeType: `image/${uploadResult.format || "jpeg"}`,
          });

          hasChanges = true;
        } catch (uploadErr) {
          console.error(`Failed to upload image for "${product.title}":`, uploadErr.message);
          newImages.push(imgItem);
        }
      }

      if (hasChanges) {
        product.images = newImages;
        product.markModified("images");
        await product.save();
        updatedCount++;
      }
    }

    console.log("==========================================");
    console.log(`Sync completed! ${updatedCount} products updated with Cloudinary URLs.`);
    console.log("==========================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Sync error:", error);
    process.exit(1);
  }
}

syncImagesToCloudinary();
