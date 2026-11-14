const mongoose = require("mongoose");
const { WithdrawRequest, WITHDRAW_STATUSES } = require("../../models/WithdrawRequest");

const normalizeString = (value, maxLength = 200) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

const createWithdrawRequest = async (req, res) => {
  try {
    const body = req.body || {};
    const amount = Number(body.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid withdraw amount is required",
      });
    }

    const withdrawRequest = await WithdrawRequest.create({
      user: body.user && mongoose.Types.ObjectId.isValid(body.user) ? body.user : req.user?._id,
      name: normalizeString(body.name, 160),
      phone: normalizeString(body.phone, 40),
      amount,
      method: normalizeString(body.method, 60) || "bKash",
      accountNumber: normalizeString(body.accountNumber, 120),
      note: normalizeString(body.note, 2000),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully",
      withdrawRequest,
    });
  } catch (error) {
    console.error("Create withdraw request error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting withdraw request",
    });
  }
};

const getWithdrawRequests = async (req, res) => {
  try {
    const query = {};
    const status = normalizeString(req.query?.status, 20).toLowerCase();
    if (status && WITHDRAW_STATUSES.includes(status)) {
      query.status = status;
    }

    const requests = await WithdrawRequest.find(query)
      .populate("user", "name email phone userType isReseller")
      .sort({ createdAt: -1 })
      .lean();

    const summary = {
      total: requests.length,
      pending: requests.filter((entry) => entry.status === "pending").length,
      approved: requests.filter((entry) => entry.status === "approved").length,
      paid: requests.filter((entry) => entry.status === "paid").length,
      rejected: requests.filter((entry) => entry.status === "rejected").length,
      totalAmount: requests
        .filter((entry) => entry.status !== "rejected")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    };

    return res.json({ success: true, requests, summary });
  } catch (error) {
    console.error("Get withdraw requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching withdraw requests",
    });
  }
};

const updateWithdrawRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid request id" });
    }

    const status = normalizeString(req.body?.status, 20).toLowerCase();
    if (!WITHDRAW_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const request = await WithdrawRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Withdraw request not found" });
    }

    request.status = status;
    request.note = req.body?.note !== undefined ? normalizeString(req.body.note, 2000) : request.note;
    request.processedBy = req.user?._id || null;
    request.processedAt = new Date();

    await request.save();

    return res.json({
      success: true,
      message: "Withdraw request updated successfully",
      request,
    });
  } catch (error) {
    console.error("Update withdraw request error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating withdraw request",
    });
  }
};

module.exports = {
  createWithdrawRequest,
  getWithdrawRequests,
  updateWithdrawRequestStatus,
};
