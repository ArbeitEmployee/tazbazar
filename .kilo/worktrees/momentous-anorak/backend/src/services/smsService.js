// smsService.js
// Real SMS sending backed by the dashboard "SMS API" settings.
// Supports BongoSDK-style gateways (default), any custom HTTP gateway via
// smsApiBaseUrl, and Twilio. Failures are logged, never thrown, so an SMS
// outage can never break order placement.
const axios = require("axios");
const User = require("../models/User");

const safeString = (value) => String(value || "").trim();

const DEFAULT_BONGO_ENDPOINT = "https://bongobd.com/smsapi";

const normalizeSmsConfig = (settings = {}) => {
  const integrations =
    settings?.integrations && typeof settings.integrations === "object"
      ? settings.integrations
      : {};
  const topLevel = settings && typeof settings === "object" ? settings : {};

  const pick = (keys) => {
    for (const key of keys) {
      const value = safeString(topLevel[key] || integrations[key]);
      if (value) return value;
    }
    return "";
  };

  return {
    provider: pick(["smsProvider", "smsProviderName"]) || "bongo",
    apiKey: pick(["smsApiKey", "smsKey", "apiKey"]),
    senderId: pick(["smsSenderId", "senderId", "sender"]),
    phoneSid: pick(["smsPhoneNumber", "accountSid", "smsSid"]),
    apiBaseUrl: pick(["smsApiBaseUrl", "smsSmsUrl"]),
    adminPhone: safeString(settings?.contact?.phone1 || settings?.contact?.phone2),
    storeName: safeString(
      settings?.website?.storeName ||
        topLevel.companyName ||
        settings?.companyName ||
        "Our Store",
    ),
  };
};

const buildParamsUrl = (
  baseUrl,
  { apiKey = "", senderId = "", phoneSid = "" } = {},
  { to = "", message = "" } = {},
) => {
  const url = String(baseUrl || "").trim();
  if (!url) return "";

  const paramsMap = {
    "{to}": encodeURIComponent(to),
    "{contacts}": encodeURIComponent(to),
    "{phone}": encodeURIComponent(to),
    "{message}": encodeURIComponent(message),
    "{msg}": encodeURIComponent(message),
    "{text}": encodeURIComponent(message),
    "{sender}": encodeURIComponent(senderId),
    "{senderid}": encodeURIComponent(senderId),
    "{apikey}": encodeURIComponent(apiKey),
    "{api_key}": encodeURIComponent(apiKey),
    "{sid}": encodeURIComponent(phoneSid),
  };

  const hasPlaceholders = Object.keys(paramsMap).some((token) =>
    url.includes(token),
  );

  if (!hasPlaceholders) {
    const separator = url.includes("?") ? "&" : "?";
    const query = {
      api_key: apiKey,
      type: "text",
      contacts: to,
      senderid: senderId,
      msg: message,
    };
    const queryString = Object.entries(query)
      .filter(([, value]) => safeString(value))
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
    return `${url}${separator}${queryString}`;
  }

  let resolved = url;
  Object.entries(paramsMap).forEach(([token, value]) => {
    resolved = resolved.split(token).join(value);
  });
  return resolved;
};

const sendViaBongo = async ({ config }, { to = "", message = "" }) => {
  const endpoint = config.apiBaseUrl
    ? buildParamsUrl(
        config.apiBaseUrl,
        { apiKey: config.apiKey, senderId: config.senderId },
        { to, message },
      )
    : buildParamsUrl(
        DEFAULT_BONGO_ENDPOINT,
        { apiKey: config.apiKey, senderId: config.senderId },
        { to, message },
      );

  const response = await axios.get(endpoint, {
    timeout: 15000,
    params: config.apiBaseUrl ? undefined : { format: "json" },
  });

  const body =
    typeof response.data === "object" ? response.data : { raw: response.data };
  const status = String(
    body.status || body.msg || body.message || response.status || "",
  ).trim();

  return {
    sent: true,
    provider: "bongo",
    status: status.slice(0, 120) || "accepted",
  };
};

const sendViaTwilio = async ({ config }, { to = "", message = "" }) => {
  const accountSid = config.phoneSid;
  if (!accountSid) {
    return { sent: false, provider: "twilio", error: "Twilio Account SID is missing" };
  }

  const response = await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    new URLSearchParams({
      From: config.senderId,
      To: to,
      Body: message,
    }).toString(),
    {
      timeout: 15000,
      auth: {
        username: accountSid,
        password: config.apiKey,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );

  const sid = String(response.data?.sid || "").trim();
  return {
    sent: true,
    provider: "twilio",
    status: sid ? `queued (${sid.slice(0, 8)}...)` : "queued",
  };
};

const sendViaCustom = async ({ config }, { to = "", message = "" }) => {
  const url = buildParamsUrl(
    config.apiBaseUrl,
    { apiKey: config.apiKey, senderId: config.senderId, phoneSid: config.phoneSid },
    { to, message },
  );
  if (!url) {
    return { sent: false, provider: "custom", error: "No SMS API base URL configured" };
  }

  const response = await axios.post(
    url,
    {
      to,
      contacts: to,
      message,
      msg: message,
      sender: config.senderId,
      senderid: config.senderId,
      api_key: config.apiKey,
      apiKey: config.apiKey,
    },
    {
      timeout: 15000,
      headers: { "Content-Type": "application/json" },
    },
  );

  const body =
    typeof response.data === "object" ? response.data : { raw: response.data };
  return {
    sent: true,
    provider: "custom",
    status: String(body.status || body.message || "accepted").slice(0, 120),
  };
};

const sendSms = async (
  rawSettings,
  { to = "", message = "" },
) => {
  const config = normalizeSmsConfig(rawSettings);
  const target = safeString(to);
  const text = safeString(message);

  if (!target || !text) {
    return { sent: false, error: "Recipient and message are required" };
  }
  if (!config.apiKey) {
    return {
      sent: false,
      error: "SMS API key is not configured (SMS API settings)",
    };
  }

  const provider = String(config.provider || "").toLowerCase();
  const payload = { config, to: target, message: text };

  try {
    let result;
    if (provider === "twilio") {
      result = await sendViaTwilio(payload);
    } else if (provider === "custom" || provider === "http" || provider === "generic") {
      result = await sendViaCustom(payload);
    } else {
      result = await sendViaBongo(payload);
    }
    if (result?.sent === false) {
      console.warn("SMS not sent:", result?.error || result);
    }
    return result;
  } catch (error) {
    const detail =
      error?.response?.data || error?.response?.status || error?.message;
    console.error("SMS send error:", error?.message || error);
    return {
      sent: false,
      provider,
      error:
        typeof detail === "string"
          ? detail.slice(0, 200)
          : error?.message || "SMS gateway request failed",
    };
  }
};

const fetchRawAdminSettings = async () => {
  const primaryAdmin = await User.findOne({ userType: "admin" })
    .sort({ createdAt: 1, _id: 1 })
    .select("adminSettings")
    .lean();
  return primaryAdmin?.adminSettings || {};
};

const fetchSmsConfig = async () => {
  const raw = await fetchRawAdminSettings();
  return normalizeSmsConfig(raw);
};

const notifyOrderSms = async (order = {}) => {
  const rawSettings = await fetchRawAdminSettings();
  const config = normalizeSmsConfig(rawSettings);
  const shipping = order?.shippingAddress || {};
  const customerPhone = safeString(shipping.phone);
  const customerName =
    safeString(shipping.firstName) +
    (shipping.lastName ? ` ${safeString(shipping.lastName)}` : "");
  const total = Number(order?.total || 0);
  const orderNumber = safeString(order?.orderNumber);

  if (customerPhone) {
    const message = `Dear ${customerName || "Customer"}, your order ${orderNumber} has been placed successfully. Total: BDT ${total.toFixed(2)}. Thank you for shopping with ${config.storeName}.`;
    await sendSms(rawSettings, { to: customerPhone, message }).catch((error) => {
      console.error("Customer order SMS error:", error);
    });
  }

  if (config.adminPhone) {
    const message = `New order ${orderNumber} placed on ${config.storeName}. Amount: BDT ${total.toFixed(2)}. Customer: ${customerName || "Walk-in"} (${customerPhone || "no phone"}).`;
    await sendSms(rawSettings, { to: config.adminPhone, message }).catch((error) => {
      console.error("Admin order SMS error:", error);
    });
  }

  return { sent: true };
};

module.exports = {
  normalizeSmsConfig,
  sendSms,
  fetchSmsConfig,
  notifyOrderSms,
};