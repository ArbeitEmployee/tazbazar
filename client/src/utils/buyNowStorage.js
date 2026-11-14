/**
 * Buy Now Session Storage Helper
 * 
 * Manages transient checkout state for single-product "Buy Now" flow.
 * Uses sessionStorage so the checkout state is isolated to the browser tab/session
 * and does not pollute the persistent regular shopping cart.
 */

const BUY_NOW_STORAGE_KEY = "fnfashion_buy_now_item";

export const setBuyNowItem = (item) => {
  if (typeof window === "undefined") return;
  try {
    if (!item) {
      window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(item));
  } catch (error) {
    console.error("Failed to save buy-now item to sessionStorage:", error);
  }
};

export const getBuyNowItem = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.error("Failed to read buy-now item from sessionStorage:", error);
    return null;
  }
};

export const clearBuyNowItem = () => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear buy-now item from sessionStorage:", error);
  }
};
