const mongoose = require("mongoose");

const highlightTextSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "home_slider_highlight",
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    badge: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },
    link: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index on key
highlightTextSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model("HighlightText", highlightTextSchema);
