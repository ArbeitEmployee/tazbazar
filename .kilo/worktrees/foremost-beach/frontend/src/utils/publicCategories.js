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

// Shared, deduped + cached public categories fetch.
// Navbar, CategoryGrid and CategoryLogoMarquee all hit this instead of
// firing 3 separate /categories/public requests on homepage mount.
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
