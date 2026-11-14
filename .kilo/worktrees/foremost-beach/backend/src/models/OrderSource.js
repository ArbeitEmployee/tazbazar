const mongoose = require("mongoose");

const orderSourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Order source name is required"],
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderSource", orderSourceSchema);
