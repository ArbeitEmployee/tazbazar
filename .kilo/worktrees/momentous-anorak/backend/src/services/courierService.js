const COURIER_PROVIDER_DEFINITIONS = {
  steadfast: {
    label: "Steadfast",
    defaultBaseUrl: "https://portal.packzy.com",
    defaultConsignmentPath: "/api/v1/create_order",
    trackingPath: "/api/v1/status_by_cid",
    pingPath: "/api/v1/ping",
  },
  pathao: {
    label: "Pathao",
    defaultBaseUrl: "https://api-hermes.pathao.com",
    defaultConsignmentPath: "/aladdin/api/v1/orders",
    pingPath: "/aladdin/api/v1/cities",
  },
  ecourier: {
    label: "eCourier",
    defaultBaseUrl: "https://staging.ecourier.com.bd",
    defaultConsignmentPath: "/api/order-place",
    pingPath: "/api/city-list",
  },
  carrybee: {
    label: "CarryBee",
    defaultBaseUrl: "https://api.carrybee.com.bd",
    defaultConsignmentPath: "/api/v1/orders",
    pingPath: "/api/v1/ping",
  },
  redx: {
    label: "RedX",
    defaultBaseUrl: "https://openapi.redx.com.bd",
    defaultConsignmentPath: "/v1.0.0/parcels",
    pingPath: "/v1.0.0/areas",
  },
};

const safeString = (value) => String(value || "").trim();

const normalizeCourierConfig = (value = {}, providerMeta = {}) => {
  const meta =
    providerMeta && typeof providerMeta === "object"
      ? providerMeta
      : { label: providerMeta };
  const fallbackLabel = meta.label || "Courier";

  return {
    providerName: safeString(value?.providerName || fallbackLabel),
    // For extra accounts of a built-in provider (e.g. second Steadfast key).
    baseProvider: Object.prototype.hasOwnProperty.call(
      COURIER_PROVIDER_DEFINITIONS,
      safeString(value?.baseProvider || "").toLowerCase(),
    )
      ? safeString(value?.baseProvider || "").toLowerCase()
      : "",
    enabled: value?.enabled === undefined ? false : Boolean(value.enabled),
    apiBaseUrl: safeString(value?.apiBaseUrl || meta.defaultBaseUrl || ""),
    apiToken: safeString(value?.apiToken || value?.token || ""),
    apiKey: safeString(value?.apiKey || ""),
    apiSecret: safeString(value?.apiSecret || ""),
    consignmentPath: safeString(
      value?.consignmentPath || meta.defaultConsignmentPath || "/consignments",
    ),
    trackingPath: safeString(
      value?.trackingPath || meta.defaultTrackingPath || "/track",
    ),
    labelPath: safeString(value?.labelPath || meta.defaultLabelPath || "/label"),
    pingPath: safeString(value?.pingPath || meta.pingPath || "/api/v1/ping"),
    timeoutMs: Math.max(1000, parseInt(value?.timeoutMs, 10) || 12000),
  };
};

const normalizeCourierKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const normalizeCourierMap = (value = {}) => {
  const source = value && typeof value === "object" ? value : {};

  const normalized = Object.fromEntries(
    Object.entries(COURIER_PROVIDER_DEFINITIONS).map(([key, meta]) => [
      key,
      normalizeCourierConfig(source[key] || {}, meta),
    ]),
  );

  // Preserve admin-added custom couriers (built-ins above stay first).
  Object.entries(source).forEach(([rawKey, config]) => {
    if (!config || typeof config !== "object") return;
    const key = normalizeCourierKey(rawKey);
    if (!key || normalized[key]) return;
    const label =
      safeString(config.providerName) || safeString(rawKey) || "Custom Courier";
    normalized[key] = normalizeCourierConfig(config, label);
  });

  return normalized;
};

const getActiveCourierConfigs = (settings = {}) => {
  const couriers = normalizeCourierMap(settings?.couriers || {});

  return Object.entries(couriers)
    .filter(([, config]) => Boolean(config?.enabled))
    .map(([courierKey, courierConfig]) => ({
      courierKey,
      ...courierConfig,
      couriers,
    }));
};

const resolvePrimaryCourierConfig = (settings = {}) => {
  const couriers = normalizeCourierMap(settings?.couriers || {});
  const activeEntry = getActiveCourierConfigs(settings)[0];

  if (activeEntry) {
    return activeEntry;
  }

  const legacyCourier = normalizeCourierConfig(
    settings?.courier || {},
    settings?.courier?.providerName || "Courier",
  );

  return {
    courierKey: "legacy",
    ...legacyCourier,
    couriers,
  };
};

const resolveCourierConfigByKey = (settings = {}, courierKey = "") => {
  const normalizedKey = safeString(courierKey).toLowerCase();

  if (!normalizedKey) {
    return resolvePrimaryCourierConfig(settings);
  }

  const couriers = normalizeCourierMap(settings?.couriers || {});
  const selectedCourier = couriers[normalizedKey];

  if (selectedCourier) {
    return {
      courierKey: normalizedKey,
      ...selectedCourier,
      couriers,
    };
  }

  return null;
};

module.exports = {
  COURIER_PROVIDER_DEFINITIONS,
  normalizeCourierConfig,
  normalizeCourierKey,
  normalizeCourierMap,
  getActiveCourierConfigs,
  resolvePrimaryCourierConfig,
  resolveCourierConfigByKey,
};
