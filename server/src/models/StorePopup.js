const mongoose = require("mongoose");

const storePopupSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "home_store_popup",
      trim: true,
    },
    // Left column content
    badgeText: {
      type: String,
      trim: true,
      default: "Member Welcome Privilege",
      maxlength: 80,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    imagePublicId: {
      type: String,
      trim: true,
      default: "",
    },
    quoteHeading: {
      type: String,
      trim: true,
      default: "TAZBAZAR ATELIER",
      maxlength: 120,
    },
    quoteText: {
      type: String,
      trim: true,
      default: '"Simplicity is the ultimate sophistication in daily living."',
      maxlength: 300,
    },
    trustPills: {
      type: [String],
      default: ["100% Genuine", "Direct Warranty"],
    },

    // Right column content
    eyebrow: {
      type: String,
      trim: true,
      default: "A SPECIAL WELCOME TO TAZBAZAR",
      maxlength: 120,
    },
    title: {
      type: String,
      trim: true,
      default: "Grateful to have you with us.",
      maxlength: 200,
    },
    message: {
      type: String,
      trim: true,
      default:
        "We started TazBazar to bring authentic lifestyle & tech essentials right to your doorstep. As a small token of gratitude, enjoy 15% off your very first order.",
      maxlength: 2000,
    },

    // Promo Code box
    promoLabel: {
      type: String,
      trim: true,
      default: "YOUR FIRST ORDER PROMO CODE",
      maxlength: 100,
    },
    promoCode: {
      type: String,
      trim: true,
      default: "WELCOME15",
      maxlength: 50,
    },
    promoTerms: {
      type: String,
      trim: true,
      default: "Valid on orders over ৳1,200",
      maxlength: 120,
    },
    promoSavings: {
      type: String,
      trim: true,
      default: "Instant 15% Savings",
      maxlength: 80,
    },

    // Input & CTA
    inputPlaceholder: {
      type: String,
      trim: true,
      default: "Enter your email or mobile (e.g. 017...)",
      maxlength: 120,
    },
    buttonText: {
      type: String,
      trim: true,
      default: "Unlock 15% Off My Order",
      maxlength: 80,
    },
    buttonLink: {
      type: String,
      trim: true,
      default: "/shop",
      maxlength: 500,
    },
    footerDismissText: {
      type: String,
      trim: true,
      default: "Continue browsing without offer",
      maxlength: 100,
    },
    footerPrivacyText: {
      type: String,
      trim: true,
      default: "We value your privacy. No spam, ever.",
      maxlength: 100,
    },

    // General options
    isActive: {
      type: Boolean,
      default: true,
    },
    showOncePerSession: {
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

storePopupSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model("StorePopup", storePopupSchema);
