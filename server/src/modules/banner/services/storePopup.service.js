const StorePopup = require("../../../models/StorePopup");
const { uploadImageBuffer, deleteImage } = require("../../../config/cloudinary");
const { clearResponseCacheByPrefix } = require("../../../middlewares/responseCache");

const POPUP_KEY = "home_store_popup";

const POPUP_IMAGE_OPTIONS = {
  folder: "ecommerce/popups",
  resource_type: "image",
};

// Public: Get active store popup
const getPublicStorePopup = async (req, res) => {
  try {
    const record = await StorePopup.findOne({
      key: POPUP_KEY,
      isActive: true,
    }).lean();

    return res.status(200).json({
      success: true,
      data: record || null,
    });
  } catch (error) {
    console.error("Error fetching public store popup:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popup",
      error: error.message,
    });
  }
};

// Admin: Get current store popup configuration
const getAdminStorePopup = async (req, res) => {
  try {
    let record = await StorePopup.findOne({ key: POPUP_KEY }).lean();

    if (!record) {
      record = {
        key: POPUP_KEY,
        badgeText: "Member Welcome Privilege",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
        quoteHeading: "TAZBAZAR ATELIER",
        quoteText: '"Simplicity is the ultimate sophistication in daily living."',
        trustPills: ["100% Genuine", "Direct Warranty"],
        eyebrow: "A SPECIAL WELCOME TO TAZBAZAR",
        title: "Grateful to have you with us.",
        message:
          "We started TazBazar to bring authentic lifestyle & tech essentials right to your doorstep. As a small token of gratitude, enjoy 15% off your very first order.",
        promoLabel: "YOUR FIRST ORDER PROMO CODE",
        promoCode: "WELCOME15",
        promoTerms: "Valid on orders over ৳1,200",
        promoSavings: "Instant 15% Savings",
        inputPlaceholder: "Enter your email or mobile (e.g. 017...)",
        buttonText: "Unlock 15% Off My Order",
        buttonLink: "/shop",
        footerDismissText: "Continue browsing without offer",
        footerPrivacyText: "We value your privacy. No spam, ever.",
        isActive: true,
        showOncePerSession: true,
      };
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Error fetching admin store popup:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popup",
      error: error.message,
    });
  }
};

// Admin: Save or update store popup (with image upload support)
const upsertStorePopup = async (req, res) => {
  try {
    const existing = await StorePopup.findOne({ key: POPUP_KEY });

    let image = req.body.image !== undefined ? req.body.image : (existing?.image || "");
    let imagePublicId = existing?.imagePublicId || "";

    // Handle new uploaded image file
    if (req.files?.image?.[0]) {
      const file = req.files.image[0];
      const uploaded = await uploadImageBuffer(file.buffer, POPUP_IMAGE_OPTIONS);
      if (uploaded?.secure_url) {
        // Delete old image if exists
        if (imagePublicId && imagePublicId !== uploaded.public_id) {
          try {
            await deleteImage(imagePublicId);
          } catch (delErr) {
            console.warn("Could not delete old popup image:", delErr.message);
          }
        }
        image = uploaded.secure_url;
        imagePublicId = uploaded.public_id;
      }
    }

    let trustPills = [];
    if (req.body.trustPills) {
      if (Array.isArray(req.body.trustPills)) {
        trustPills = req.body.trustPills;
      } else if (typeof req.body.trustPills === "string") {
        try {
          trustPills = JSON.parse(req.body.trustPills);
        } catch {
          trustPills = req.body.trustPills.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
    } else if (existing?.trustPills) {
      trustPills = existing.trustPills;
    }

    const updateData = {
      badgeText: req.body.badgeText !== undefined ? String(req.body.badgeText).trim() : existing?.badgeText || "",
      image,
      imagePublicId,
      quoteHeading: req.body.quoteHeading !== undefined ? String(req.body.quoteHeading).trim() : existing?.quoteHeading || "",
      quoteText: req.body.quoteText !== undefined ? String(req.body.quoteText).trim() : existing?.quoteText || "",
      trustPills,
      eyebrow: req.body.eyebrow !== undefined ? String(req.body.eyebrow).trim() : existing?.eyebrow || "",
      title: req.body.title !== undefined ? String(req.body.title).trim() : existing?.title || "",
      message: req.body.message !== undefined ? String(req.body.message).trim() : existing?.message || "",
      promoLabel: req.body.promoLabel !== undefined ? String(req.body.promoLabel).trim() : existing?.promoLabel || "",
      promoCode: req.body.promoCode !== undefined ? String(req.body.promoCode).trim() : existing?.promoCode || "",
      promoTerms: req.body.promoTerms !== undefined ? String(req.body.promoTerms).trim() : existing?.promoTerms || "",
      promoSavings: req.body.promoSavings !== undefined ? String(req.body.promoSavings).trim() : existing?.promoSavings || "",
      inputPlaceholder: req.body.inputPlaceholder !== undefined ? String(req.body.inputPlaceholder).trim() : existing?.inputPlaceholder || "",
      buttonText: req.body.buttonText !== undefined ? String(req.body.buttonText).trim() : existing?.buttonText || "",
      buttonLink: req.body.buttonLink !== undefined ? String(req.body.buttonLink).trim() : existing?.buttonLink || "",
      footerDismissText: req.body.footerDismissText !== undefined ? String(req.body.footerDismissText).trim() : existing?.footerDismissText || "",
      footerPrivacyText: req.body.footerPrivacyText !== undefined ? String(req.body.footerPrivacyText).trim() : existing?.footerPrivacyText || "",
      isActive: req.body.isActive !== undefined ? (req.body.isActive === "true" || req.body.isActive === true) : (existing?.isActive !== undefined ? existing.isActive : true),
      showOncePerSession: req.body.showOncePerSession !== undefined ? (req.body.showOncePerSession === "true" || req.body.showOncePerSession === true) : true,
      updatedBy: req.user?._id || req.user?.id,
    };

    const doc = await StorePopup.findOneAndUpdate(
      { key: POPUP_KEY },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    try {
      clearResponseCacheByPrefix("/api/banners");
    } catch (cacheErr) {
      console.warn("Failed to clear response cache for banners:", cacheErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Store popup updated successfully",
      data: doc,
    });
  } catch (error) {
    console.error("Error upserting store popup:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update store popup",
      error: error.message,
    });
  }
};

// Admin: Toggle active state directly
const toggleStorePopupActive = async (req, res) => {
  try {
    let doc = await StorePopup.findOne({ key: POPUP_KEY });
    if (!doc) {
      doc = new StorePopup({ key: POPUP_KEY, isActive: true });
    } else {
      doc.isActive = !doc.isActive;
    }
    doc.updatedBy = req.user?._id || req.user?.id;
    await doc.save();

    try {
      clearResponseCacheByPrefix("/api/banners");
    } catch (cacheErr) {
      console.warn("Failed to clear cache:", cacheErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Store popup is now ${doc.isActive ? "active" : "deactivated"}`,
      data: doc,
    });
  } catch (error) {
    console.error("Error toggling popup status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle status",
      error: error.message,
    });
  }
};

module.exports = {
  getPublicStorePopup,
  getAdminStorePopup,
  upsertStorePopup,
  toggleStorePopupActive,
};
