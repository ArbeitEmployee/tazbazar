const mongoose = require("mongoose");

const damageProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    variationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    variationLabel: {
      type: String,
      default: "",
      trim: true,
      maxlength: 180,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: [true, "Damage reason is required"],
      trim: true,
      maxlength: 300,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    damageDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

damageProductSchema.index({ product: 1, damageDate: -1 });

const DamageProduct = mongoose.model("DamageProduct", damageProductSchema);

module.exports = DamageProduct;
