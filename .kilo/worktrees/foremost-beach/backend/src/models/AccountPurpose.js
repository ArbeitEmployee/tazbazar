const mongoose = require("mongoose");

const accountPurposeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Purpose name is required"],
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ["income", "expense", "both"],
      default: "both",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const AccountPurpose = mongoose.model("AccountPurpose", accountPurposeSchema);

module.exports = AccountPurpose;
