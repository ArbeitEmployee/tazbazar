/**
 * SEO-friendly slug generator with Bengali and Unicode support.
 */
const slugifyText = (value) => {
  if (!value) return "";
  return String(value)
    .trim()
    .toLowerCase()
    // Replace whitespace with hyphens
    .replace(/\s+/g, "-")
    // Remove unwanted punctuation/symbols but keep English, Bengali, numbers, hyphens
    .replace(/[^\u0980-\u09FFa-z0-9-]/g, "")
    // Remove consecutive hyphens
    .replace(/-+/g, "-")
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
};

const buildUniqueProductSlug = async (ProductModel, title, excludeId = null) => {
  const baseSlug = slugifyText(title) || `product-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await ProductModel.findOne(query).select("_id").lean();
    if (!existing) {
      return slug;
    }
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
};

module.exports = {
  slugifyText,
  buildUniqueProductSlug,
};
