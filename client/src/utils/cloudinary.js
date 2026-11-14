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

export const resolveImageSource = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = resolveImageSource(item);
      if (resolved) return resolved;
    }
    return "";
  }
  if (typeof value === "object") {
    return resolveImageSource(
      value.url ||
      value.secure_url ||
      value.src ||
      value.data ||
      value.path ||
      ""
    );
  }
  return "";
};

export const getFullImageUrl = (
  imagePath,
  width = 800,
  baseUrl = process.env.NEXT_PUBLIC_API_URL,
) => {
  const raw = resolveImageSource(imagePath);
  if (!raw) return null;

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return optimizeCloudinaryUrl(raw, width);
  }

  if (raw.startsWith("/")) {
    return baseUrl ? `${baseUrl}${raw}` : raw;
  }

  return baseUrl
    ? `${baseUrl}/uploads/products/${raw}`
    : `/uploads/products/${raw}`;
};
