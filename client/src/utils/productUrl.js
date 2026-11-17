/**
 * Helper to get the canonical SEO-friendly product link.
 * Prefers slug, falls back to _id or id.
 */
export const getProductLink = (product) => {
  if (!product) return "/";
  if (typeof product === "string") {
    return `/product/${encodeURIComponent(product)}`;
  }
  const identifier = product.slug || product.productId || product._id || product.id;
  return identifier ? `/product/${encodeURIComponent(identifier)}` : "/";
};

export default getProductLink;
