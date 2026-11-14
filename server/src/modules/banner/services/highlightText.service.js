const HighlightText = require("../../../models/HighlightText");
const { clearResponseCacheByPrefix } = require("../../../middlewares/responseCache");

const HIGHLIGHT_KEY = "home_slider_highlight";

// Public: Get active highlight text
const getPublicHighlightText = async (req, res) => {
  try {
    const record = await HighlightText.findOne({
      key: HIGHLIGHT_KEY,
      isActive: true,
    }).lean();

    return res.status(200).json({
      success: true,
      data: record || null,
    });
  } catch (error) {
    console.error("Error fetching public highlight text:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch highlight text",
      error: error.message,
    });
  }
};

// Admin: Get current highlight text (active or inactive)
const getAdminHighlightText = async (req, res) => {
  try {
    const record = await HighlightText.findOne({ key: HIGHLIGHT_KEY }).lean();

    return res.status(200).json({
      success: true,
      data: record || null,
    });
  } catch (error) {
    console.error("Error fetching admin highlight text:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch highlight text",
      error: error.message,
    });
  }
};

// Admin: Upsert highlight text (only text and isActive)
const upsertHighlightText = async (req, res) => {
  try {
    const { text, isActive } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Highlight text is required",
      });
    }

    const updatePayload = {
      text: text.trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      updatedBy: req.user?._id,
    };

    const updated = await HighlightText.findOneAndUpdate(
      { key: HIGHLIGHT_KEY },
      { $set: updatePayload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    clearResponseCacheByPrefix("/api/banners/public");

    return res.status(200).json({
      success: true,
      message: "Highlight text saved successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error saving highlight text:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save highlight text",
      error: error.message,
    });
  }
};

// Admin: Delete/Clear highlight text
const deleteHighlightText = async (req, res) => {
  try {
    await HighlightText.findOneAndDelete({ key: HIGHLIGHT_KEY });

    clearResponseCacheByPrefix("/api/banners/public");

    return res.status(200).json({
      success: true,
      message: "Highlight text removed successfully",
    });
  } catch (error) {
    console.error("Error deleting highlight text:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove highlight text",
      error: error.message,
    });
  }
};

module.exports = {
  getPublicHighlightText,
  getAdminHighlightText,
  upsertHighlightText,
  deleteHighlightText,
};
