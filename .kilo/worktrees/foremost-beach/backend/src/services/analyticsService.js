const safeString = (value) => String(value || "").trim();

// `base` carries the top-level admin settings so dashboard "Marketing" tab
// values (metaPixelId, googleAnalyticsId, gtmId, tiktokPixelId) are exposed
// to the public storefront through the normalized integrations payload.
const normalizeAnalyticsSettings = (value = {}, base = {}) => ({
  facebookPixelId: safeString(
    value?.facebookPixelId ||
      value?.metaPixelId ||
      value?.pixelId ||
      base?.metaPixelId ||
      base?.facebookPixelId ||
      "",
  ),
  ga4MeasurementId: safeString(
    value?.ga4MeasurementId ||
      value?.googleAnalyticsId ||
      base?.googleAnalyticsId ||
      base?.ga4MeasurementId ||
      "",
  ),
  googleAnalyticsId: safeString(
    value?.googleAnalyticsId ||
      value?.ga4MeasurementId ||
      base?.googleAnalyticsId ||
      base?.googleAnalyticsId ||
      "",
  ),
  gtmId: safeString(value?.gtmId || base?.gtmId || ""),
  tiktokPixelId: safeString(
    value?.tiktokPixelId || base?.tiktokPixelId || "",
  ),
  customTrackingCode: safeString(value?.customTrackingCode || ""),
  enableDataLayer:
    value?.enableDataLayer === undefined
      ? true
      : Boolean(value.enableDataLayer),
  enableGoogleLogin: Boolean(value?.enableGoogleLogin),
  enableFacebookLogin: Boolean(value?.enableFacebookLogin),
});

module.exports = {
  normalizeAnalyticsSettings,
};
