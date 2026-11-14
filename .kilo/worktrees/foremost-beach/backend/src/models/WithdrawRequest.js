const mongoose = require("mongoose");

const WITHDRAW_STATUSES = ["pending", "approved", "rejected", "paid"];

const withdrawRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    method: {
      type: String,
      default: "bKash",
      trim: true,
      maxlength: 60,
    },
    accountNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: WITHDRAW_STATUSES,
      default: "pending",
      index: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

withdrawRequestSchema.index({ status: 1, createdAt: -1 });

const WithdrawRequest = mongoose.model("WithdrawRequest", withdrawRequestSchema);

module.exports = { WithdrawRequest, WITHDRAW_STATUSES };
