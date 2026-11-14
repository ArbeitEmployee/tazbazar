import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const CACHE_KEY = "publicCategoriesCache";
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

let inMemoryCategories = null;
let inMemoryTimestamp = 0;
let pendingRequest = null;

const isFresh = (timestamp) =>
  Number.isFinite(timestamp) && Date.now() - timestamp < CACHE_MAX_AGE_MS;

const normalizeCategories = (rows) =>
  Array.isArray(rows) ? rows.filter(Boolean) : [];

const readCache = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isFresh(Number(parsed?.timestamp))) return null;

    return normalizeCategories(parsed?.items);
  } catch {
    return null;
  }
};

const writeCache = (items) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), items }),
    );
  } catch {
    // ignore cache write issues
  }
};

/**
 * Builds a hierarchical nested tree from flat category list:
 * Root Categories -> Sub Categories -> Sub Sub Categories
 */
export const buildCategoryTree = (flatCategories = []) => {
  if (!Array.isArray(flatCategories) || flatCategories.length === 0) return [];

  const categoryMap = new Map();
  const roots = [];

  // Clone items and initialize children arrays
  flatCategories.forEach((cat) => {
    if (!cat?._id) return;
    categoryMap.set(String(cat._id), {
      ...cat,
      children: [],
      subcategories: [], // Keep for backwards compatibility
    });
  });

  // Wire parent-child relationships
  categoryMap.forEach((node) => {
    const parentId = node.parent ? String(node.parent?._id || node.parent) : null;
    if (parentId && categoryMap.has(parentId)) {
      const parentNode = categoryMap.get(parentId);
      parentNode.children.push(node);
      parentNode.subcategories.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

/**
 * Gets all descendant category IDs (self + all sub + sub-sub IDs)
 * Robustly matches by _id, slug, or name case-insensitively.
 */
export const getCategoryDescendantIds = (categoryId, allCategories = []) => {
  const target = String(categoryId || "").trim();
  if (!target || target === "all") return [];

  // 1. Find the target category by _id, slug, or name
  const matched = (allCategories || []).find((cat) => {
    if (!cat) return false;
    const cId = String(cat._id || "").trim();
    const cSlug = String(cat.slug || "").trim().toLowerCase();
    const cName = String(cat.name || "").trim().toLowerCase();
    const lowTarget = target.toLowerCase();
    return cId === target || cSlug === lowTarget || cName === lowTarget;
  });

  const rootId = matched ? String(matched._id) : target;
  const result = new Set([rootId, target]);
  if (matched?.slug) result.add(matched.slug);
  if (matched?.name) result.add(matched.name);

  let added = true;
  while (added) {
    added = false;
    (allCategories || []).forEach((cat) => {
      if (!cat?._id) return;
      const catId = String(cat._id);
      const parentId = cat.parent ? String(cat.parent?._id || cat.parent) : null;
      if (parentId && result.has(parentId) && !result.has(catId)) {
        result.add(catId);
        if (cat.slug) result.add(cat.slug);
        if (cat.name) result.add(cat.name);
        added = true;
      }
    });
  }

  return Array.from(result);
};

// Shared, deduped + cached public categories fetch.
export const fetchPublicCategories = async ({ force = false } = {}) => {
  if (!force && inMemoryCategories && isFresh(inMemoryTimestamp)) {
    return inMemoryCategories;
  }

  if (!force) {
    const cached = readCache();
    if (cached) {
      inMemoryCategories = cached;
      inMemoryTimestamp = Date.now();
      return cached;
    }
  }

  if (!force && pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = axios
    .get(`${baseUrl}/categories/public`, { timeout: 10000 })
    .then((response) => {
      const rows = Array.isArray(response?.data?.categories)
        ? response.data.categories
        : [];
      const items = normalizeCategories(rows);
      inMemoryCategories = items;
      inMemoryTimestamp = Date.now();
      writeCache(items);
      return items;
    })
    .catch(() => {
      const fallback = inMemoryCategories || readCache() || [];
      inMemoryCategories = fallback;
      inMemoryTimestamp = Date.now();
      return fallback;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
};

export const invalidatePublicCategoriesCache = () => {
  inMemoryCategories = null;
  inMemoryTimestamp = 0;
  pendingRequest = null;

  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore cache reset issues
  }
};
