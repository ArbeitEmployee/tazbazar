// sms/controller.js
const { sendSms, fetchSmsConfig } = require("../../services/smsService");
const { isAdmin } = require("../../utils/marketplaceAccess");

const requireAdmin = (req, res) => {
  if (!isAdmin(req.user)) {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return false;
  }
  return true;
};

const getSmsConfig = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const config = await fetchSmsConfig();

    return res.json({
      success: true,
      config: {
        provider: config.provider,
        senderId: config.senderId,
        phoneSid: config.phoneSid,
        apiBaseUrl: config.apiBaseUrl,
        adminPhone: config.adminPhone,
        storeName: config.storeName,
        hasApiKey: Boolean(config.apiKey),
      },
    });
  } catch (error) {
    console.error("Get SMS config error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load SMS configuration",
    });
  }
};

const testSms = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { to = "", message = "", includeAdmin = true } = req.body || {};
    const target = String(to || "").trim();

    if (!includeAdmin && !target) {
      return res.status(400).json({
        success: false,
        message: "Recipient phone number is required",
      });
    }

    const config = await fetchSmsConfig();
    const results = [];

    if (target) {
      const sentToTarget = await sendSms(
        {
          smsProvider: config.provider,
          smsApiKey: config.apiKey,
          smsSenderId: config.senderId,
          smsPhoneNumber: config.phoneSid,
          smsApiBaseUrl: config.apiBaseUrl,
        },
        {
          to: target,
          message: String(
            message || `Test SMS from ${config.storeName}. If you receive this, your SMS API is configured correctly.`,
          ).slice(0, 160),
        },
      );
      results.push({ recipient: target, ...sentToTarget });
    }

    if (includeAdmin && config.adminPhone) {
      const sentToAdmin = await sendSms(
        {
          smsProvider: config.provider,
          smsApiKey: config.apiKey,
          smsSenderId: config.senderId,
          smsPhoneNumber: config.phoneSid,
          smsApiBaseUrl: config.apiBaseUrl,
        },
        {
          to: config.adminPhone,
          message: String(
            message || `SMS API test: ${config.storeName} is connected successfully.`,
          ).slice(0, 160),
        },
      );
      results.push({ recipient: config.adminPhone, ...sentToAdmin });
    }

    const anySent = results.some((entry) => entry.sent === true);
    const firstFailure = results.find((entry) => entry.sent === false);

    return res.status(anySent ? 200 : 502).json({
      success: anySent,
      message: anySent
        ? results.map((entry) => `SMS sent to ${entry.recipient}`).join(". ")
        : (firstFailure?.error || "SMS could not be sent"),
      results,
    });
  } catch (error) {
    console.error("Test SMS error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send test SMS",
    });
  }
};

module.exports = { getSmsConfig, testSms };