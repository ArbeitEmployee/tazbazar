// Injects lightweight Cloudinary transformations so storefront images
// (hero banners, category circles, campaign art) download resized +
// auto-format/compressed variants instead of full originals.
export const optimizeCloudinaryUrl = (url, width = 1200) => {
  const normalized = String(url || "").trim();
  if (!normalized) return normalized;
  if (!normalized.includes("res.cloudinary.com")) return normalized;
  if (!normalized.includes("/image/upload/")) return normalized;
  // Don't double-transform URLs that already carry transforms.
  if (/\/image\/upload\/[^/]*(f_auto|w_\d+|q_auto)/.test(normalized)) {
    return normalized;
  }

  const w = Math.max(100, Math.min(2000, Number(width) || 1200));
  return normalized.replace(
    "/image/upload/",
    `/image/upload/f_auto,q_auto,w_${w}/`,
  );
};
