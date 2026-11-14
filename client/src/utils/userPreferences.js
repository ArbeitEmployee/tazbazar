"use client";

/**
 * userPreferences.js
 * Tracks user behavior (views, wishlist, category clicks) in localStorage
 * and computes a preference score to power "Just for You" recommendations.
 */

const PREF_KEY = "userPreferences";
const MAX_VIEWED_PRODUCTS = 30;

const defaultPrefs = () => ({
  categoryScores: {}, // { categoryId: score }
  viewedProductIds: [], // last N product IDs viewed
  wishlistCategoryIds: [], // category IDs from wishlisted products
});

const loadPrefs = () => {
  if (typeof window === "undefined") return defaultPrefs();
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw);
    return {
      categoryScores: parsed.categoryScores || {},
      viewedProductIds: Array.isArray(parsed.viewedProductIds) ? parsed.viewedProductIds : [],
      wishlistCategoryIds: Array.isArray(parsed.wishlistCategoryIds) ? parsed.wishlistCategoryIds : [],
    };
  } catch {
    return defaultPrefs();
  }
};

const savePrefs = (prefs) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
};

/**
 * Call this when a user views a product detail page.
 * @param {Object} product - product object with _id, category
 */
export const trackProductView = (product) => {
  if (!product?._id) return;
  const prefs = loadPrefs();

  // Track viewed product IDs (deduped, newest first)
  prefs.viewedProductIds = [
    String(product._id),
    ...prefs.viewedProductIds.filter((id) => id !== String(product._id)),
  ].slice(0, MAX_VIEWED_PRODUCTS);

  // Boost category score for the viewed product's category
  const catId = String(product?.category?._id || product?.category || "");
  if (catId) {
    prefs.categoryScores[catId] = (prefs.categoryScores[catId] || 0) + 1;
  }

  savePrefs(prefs);
};

/**
 * Call this when a user adds a product to wishlist.
 * @param {Object} product - product object with category
 */
export const trackWishlistAdd = (product) => {
  if (!product) return;
  const prefs = loadPrefs();

  const catId = String(product?.category?._id || product?.category || "");
  if (catId) {
    // Wishlist = stronger signal, boost by 3
    prefs.categoryScores[catId] = (prefs.categoryScores[catId] || 0) + 3;
    if (!prefs.wishlistCategoryIds.includes(catId)) {
      prefs.wishlistCategoryIds.push(catId);
    }
  }

  savePrefs(prefs);
};

/**
 * Returns the top N category IDs by score.
 * @param {number} n
 * @returns {string[]}
 */
export const getTopCategoryIds = (n = 3) => {
  const prefs = loadPrefs();
  return Object.entries(prefs.categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);
};

/**
 * Returns recently viewed product IDs (to exclude from "just for you").
 * @returns {string[]}
 */
export const getViewedProductIds = () => {
  return loadPrefs().viewedProductIds;
};

/**
 * Returns true if the user has any recorded preferences.
 */
export const hasPreferences = () => {
  const prefs = loadPrefs();
  return Object.keys(prefs.categoryScores).length > 0;
};
