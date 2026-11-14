const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    saleId: {
      type: String,
      required: true,
      unique: true,
    },
    saleType: {
      type: String,
      enum: ["office", "company", "reseller", "pos", "exchange"],
      default: "pos",
    },
    customerName: { type: String, default: "Walk-in Customer" },
    customerPhone: { type: String },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "mobile_banking"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "due", "partial"],
      default: "paid",
    },
    amountPaid: { type: Number, required: true },
    changeReturned: { type: Number, default: 0 },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Sale", saleSchema);
