const mongoose = require("mongoose");
const Campaign = require("../../models/Campaign");
const {
  clearResponseCacheByPrefix,
} = require("../../middlewares/responseCache");

const normalizeString = (value, maxLength = 200) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

const normalizeSlug = (value) =>
  normalizeString(value, 220)
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);

const normalizeIdList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || "").trim())
    .filter((entry) => mongoose.Types.ObjectId.isValid(entry));
};

const normalizeImageList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeString(entry, 2000))
    .filter(Boolean)
    .slice(0, 20);
};

const parseDate = (value) => {
  const trimmed = normalizeString(value, 60);
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildCampaignDocument = (body, createdBy) => {
  const title = normalizeString(body.title, 180);
  const slug = normalizeSlug(body.slug || title);

  return {
    title,
    slug,
    description: normalizeString(body.description, 5000),
    bannerImage: normalizeString(body.bannerImage, 2000),
    sliderImages: normalizeImageList(body.sliderImages),
    products: normalizeIdList(body.products),
    startDate: parseDate(body.startDate),
    endDate: parseDate(body.endDate),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    createdBy,
  };
};

const createCampaign = async (req, res) => {
  try {
    const payload = buildCampaignDocument(req.body || {}, req.user?._id);

    if (!payload.title) {
      return res.status(400).json({
        success: false,
        message: "Campaign title is required",
      });
    }

    if (!payload.slug) {
      return res.status(400).json({
        success: false,
        message: "Campaign slug could not be generated",
      });
    }

    const existing = await Campaign.findOne({ slug: payload.slug }).lean();
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A campaign with this slug already exists",
      });
    }

    const campaign = await Campaign.create(payload);

    clearResponseCacheByPrefix("/api/campaigns/public");

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating campaign",
    });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const query = {};
    const status = normalizeString(req.query?.status, 20).toLowerCase();
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const search = normalizeString(req.query?.search, 120);
    if (search) {
      query.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    const campaigns = await Campaign.find(query)
      .populate("products", "title price images slug")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, campaigns });
  } catch (error) {
    console.error("Get campaigns error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching campaigns",
    });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign id" });
    }

    const campaign = await Campaign.findById(id)
      .populate("products", "title price images slug")
      .lean();

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({ success: true, campaign });
  } catch (error) {
    console.error("Get campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching campaign",
    });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign id" });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const body = req.body || {};

    if (body.title !== undefined) campaign.title = normalizeString(body.title, 180) || campaign.title;
    if (body.slug !== undefined) {
      const nextSlug = normalizeSlug(body.slug);
      if (nextSlug && nextSlug !== campaign.slug) {
        const duplicate = await Campaign.findOne({ slug: nextSlug, _id: { $ne: id } }).lean();
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: "A campaign with this slug already exists",
          });
        }
        campaign.slug = nextSlug;
      }
    }
    if (body.description !== undefined) campaign.description = normalizeString(body.description, 5000);
    if (body.bannerImage !== undefined) campaign.bannerImage = normalizeString(body.bannerImage, 2000);
    if (body.sliderImages !== undefined) campaign.sliderImages = normalizeImageList(body.sliderImages);
    if (body.products !== undefined) campaign.products = normalizeIdList(body.products);
    if (body.startDate !== undefined) campaign.startDate = parseDate(body.startDate);
    if (body.endDate !== undefined) campaign.endDate = parseDate(body.endDate);
    if (body.isActive !== undefined) campaign.isActive = Boolean(body.isActive);

    await campaign.save();

    clearResponseCacheByPrefix("/api/campaigns/public");

    return res.json({
      success: true,
      message: "Campaign updated successfully",
      campaign,
    });
  } catch (error) {
    console.error("Update campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating campaign",
    });
  }
};

// Public storefront: only active campaigns inside their date window,
// with safe fields and no auth required.
const getPublicCampaigns = async (req, res) => {
  try {
    const now = new Date();
    const limit = Math.min(
      12,
      Math.max(1, parseInt(req.query?.limit, 10) || 6),
    );

    const campaigns = await Campaign.find({
      isActive: true,
      $and: [
        {
          $or: [{ startDate: null }, { startDate: { $lte: now } }],
        },
        {
          $or: [{ endDate: null }, { endDate: { $gte: now } }],
        },
      ],
    })
      .select("title slug description bannerImage sliderImages startDate endDate")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, campaigns });
  } catch (error) {
    console.error("Get public campaigns error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching campaigns",
    });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign id" });
    }

    const campaign = await Campaign.findByIdAndDelete(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    clearResponseCacheByPrefix("/api/campaigns/public");

    return res.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Delete campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting campaign",
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getPublicCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
};
