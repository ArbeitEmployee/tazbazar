"use client";
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, NavLink, useLocation, useNavigate } from "@/lib/routing";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowRight,
  FiChevronDown,
  FiChevronRight,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiRepeat,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
  FiInstagram,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import usePublicSettings from "../../hooks/usePublicSettings";
import { toPublicAssetUrl } from "../../utils/publicSettings";
import { fetchPublicCategories } from "../../utils/publicCategories";
import AuthModal from "../../components/AuthModal";
import { useLanguage } from "../../context/LanguageContext";
import { useThemeColors } from "../../hooks/useThemeColors";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const CATEGORY_CACHE_KEY = "publicNavbarCategories";
const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;

const readCachedCategories = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CATEGORY_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    if (!timestamp || Date.now() - timestamp > CATEGORY_CACHE_TTL_MS) {
      return [];
    }
    return items;
  } catch {
    return [];
  }
};

const writeCachedCategories = (items = []) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CATEGORY_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        items: Array.isArray(items) ? items : [],
      }),
    );
  } catch {
    // Ignore cache write failures.
  }
};

const normalizeOrderLookup = (value) =>
  String(value || "")
    .trim()
    .replace(/^order\s*#?\s*/i, "")
    .replace(/^#/, "")
    .trim();

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = usePublicSettings();
  const { themeColor, buttonTextColor } = useThemeColors();
  const { cartCount, getCartSubtotal } = useCart();
  const wishlistCount = useSelector(
    (state) => state.wishlist.items?.length || 0,
  );
  const compareCount = useSelector(
    (state) => state.compare.items?.length || 0,
  );
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState("login");

  const openLoginModal = () => {
    setAuthModalView("login");
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const openRegisterModal = () => {
    setAuthModalView("register");
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  // Sync categoriesOpen state changes globally so Banner or other components can respond
  const handleToggleCategories = () => {
    setCategoriesOpen((prev) => {
      const nextState = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("clotya_categories_open", nextState ? "1" : "0");
        window.dispatchEvent(
          new CustomEvent("toggleCategoriesSidebar", { detail: { open: nextState } })
        );
      }
      return nextState;
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clotya_categories_open");
      if (saved !== null) {
        setCategoriesOpen(saved === "1");
      }
    }
  }, []);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const timeoutRef = useRef(null);

  // The first client render must be identical to the server render. Public
  // settings (logo URL / store name) are applied only after mount so React
  // never sees <span> on the server and <img> on the client.
  const [settingsReady, setSettingsReady] = useState(false);
  useEffect(() => {
    setSettingsReady(true);
  }, []);

  const { language, toggleLanguage, isBengali } = useLanguage();
  const website = settings?.website || {};
  const storeName = String(website?.storeName || "").trim();
  const brandName = storeName || "Clotya";
  const logoMode = String(website?.logoMode || "").trim().toLowerCase() === "text" ? "text" : "image";
  const logo = logoMode === "image" ? toPublicAssetUrl(website?.logoUrl || "") : "";
  const logoText = String(website?.logoText || "").trim();
  const brandLogoText = logoText || brandName;

  // Defaults match getDefaultPublicSettings() so SSR and hydration agree.
  const hydratedBrandName = settingsReady ? brandName : "E-Commerce";
  const hydratedLogo = settingsReady ? logo : "";
  const hydratedLogoText = settingsReady ? brandLogoText : "E-Commerce";
  // Language is read from cookies/localStorage in an effect, so keep the
  // first client render identical to the server ("en") to avoid hydration
  // mismatches on the toggle's title/classes.
  const hydratedIsBengali = settingsReady && isBengali;

  // Cart/wishlist/compare counts come from persisted client storage. Render
  // zero on the server and first client pass, then show real counts after
  // mount so hydration markup matches.
  const safeCartCount = settingsReady
    ? Number.isFinite(cartCount)
      ? cartCount
      : Number.parseInt(cartCount, 10) || 0
    : 0;
  const safeWishlistCount = settingsReady
    ? Number.isFinite(wishlistCount)
      ? wishlistCount
      : Number.parseInt(wishlistCount, 10) || 0
    : 0;
  const safeCompareCount = settingsReady
    ? Number.isFinite(compareCount)
      ? compareCount
      : Number.parseInt(compareCount, 10) || 0
    : 0;

  const cartTotalAmount =
    settingsReady && typeof getCartSubtotal === "function" ? getCartSubtotal() : 0;

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) => (category?.type || "").toLowerCase() !== "package",
      ),
    [categories],
  );

  useEffect(() => {
    const syncUser = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      setLoggedIn(Boolean(token));
      if (!userData) {
        setUserName("");
        return;
      }
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || user.email?.split("@")[0] || "User");
      } catch (_error) {
        setUserName("User");
      }
    };

    syncUser();
    window.addEventListener("userLoggedIn", syncUser);
    window.addEventListener("userLoggedOut", syncUser);
    return () => {
      window.removeEventListener("userLoggedIn", syncUser);
      window.removeEventListener("userLoggedOut", syncUser);
    };
  }, []);

  useEffect(() => {
    const cachedCategories = readCachedCategories();
    if (cachedCategories.length > 0) {
      setCategories(cachedCategories);
      setLoading(false);
    }

    let active = true;

    const loadCategories = async () => {
      if (cachedCategories.length === 0 && active) {
        setLoading(true);
      }
      try {
        const nextCategories = await fetchPublicCategories();
        if (!active) return;
        setCategories(nextCategories);
        writeCachedCategories(nextCategories);
      } catch (_error) {
        if (!active && cachedCategories.length > 0) return;
        if (active && cachedCategories.length === 0) {
          setCategories([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSuggestions(false);
    setUserMenuOpen(false);
    setCategoryDropdownOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setCategoryDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  };

  const [searchLoading, setSearchLoading] = useState(false);

  const loadSuggestions = async (searchTerm) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);
      const normalizedOrderQuery = normalizeOrderLookup(trimmed);
      const params = { query: trimmed };
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      // 1. Call public suggestions endpoint which searches title, description, brand, category, etc.
      const productPromise = axios.get(`${baseUrl}/products/public/suggestions`, { params });
      
      // 2. Call order lookup only if looks like order query
      const orderPromise =
        normalizedOrderQuery.length >= 3
          ? axios.get(`${baseUrl}/orders/search`, {
              params: { query: normalizedOrderQuery },
            })
          : Promise.resolve({ data: { suggestions: [] } });

      const [productResponse, orderResponse] = await Promise.allSettled([
        productPromise,
        orderPromise,
      ]);

      const productPayload =
        productResponse.status === "fulfilled" ? productResponse.value.data : {};
      const orderPayload =
        orderResponse.status === "fulfilled" ? orderResponse.value.data : {};

      const rawProducts = Array.isArray(productPayload?.suggestions?.products)
        ? productPayload.suggestions.products
        : [];
      const products = rawProducts.map((item) => ({
        ...item,
        resultType: "product",
      }));

      const rawCategories = Array.isArray(productPayload?.suggestions?.categories)
        ? productPayload.suggestions.categories
        : [];
      const nextCategories = rawCategories.map((item) => ({
        ...item,
        resultType: "category",
      }));

      const orders = Array.isArray(orderPayload?.suggestions)
        ? orderPayload.suggestions.map((item) => ({
            ...item,
            resultType: "order",
          }))
        : [];

      const prioritizeOrders = /^ord-/i.test(normalizedOrderQuery);
      setSuggestions(
        prioritizeOrders
          ? [...orders, ...products, ...nextCategories]
          : [...products, ...nextCategories, ...orders],
      );
    } catch (_error) {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setShowSuggestions(true);
    timeoutRef.current = setTimeout(() => loadSuggestions(value), 180);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    let url = `/shop?search=${encodeURIComponent(trimmed || "")}`;
    if (selectedCategory && selectedCategory !== "all") {
      url += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    navigate(url);
    setQuery("");
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    scrollToTop();
  };

  const handleSuggestionClick = (item) => {
    navigate(
      item.resultType === "product"
        ? `/product/${encodeURIComponent(item.slug || item._id)}`
        : item.resultType === "order"
          ? `/track-order/${encodeURIComponent(item.orderNumber)}`
          : `/shop?category=${item._id}`,
    );
    setQuery("");
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    scrollToTop();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
    navigate("/");
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header className="w-full bg-white font-sans border-b border-gray-100 sticky top-0 z-[120000] shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
      {/* 1. MAIN HEADER BAR */}
      <div className="py-4 md:py-5 border-b border-gray-100 bg-white">
        <div className="site-shell max-w-7xl mx-auto px-4 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Brand Logo & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-gray-800 hover:bg-gray-100 lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <FiMenu className="h-6 w-6" />
            </button>
            <Link
              to="/"
              onClick={scrollToTop}
              className="flex items-center gap-1 shrink-0 py-1"
            >
              {hydratedLogo ? (
                <img
                  src={hydratedLogo}
                  alt={hydratedBrandName}
                  className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto max-w-[260px] object-contain transition-transform duration-200 hover:scale-102 drop-shadow-2xs"
                />
              ) : (
                <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-black flex items-center">
                  {hydratedLogoText}
                  <span className="text-xs font-normal align-super text-gray-400 ml-0.5">®</span>
                </span>
              )}
            </Link>
          </div>

          {/* Center Search Bar - Modern Elegant Design */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative hidden sm:block">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full rounded-full bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-900/10 border border-gray-200/80 focus-within:border-gray-900 transition-all duration-200 shadow-xs px-1"
            >
              {/* Elegant Custom Category Selector Popover */}
              <div className="relative pl-3 pr-2 border-r border-gray-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryDropdownOpen((prev) => !prev);
                    setShowSuggestions(false);
                  }}
                  className="flex items-center gap-1.5 py-2 px-1 text-xs font-semibold text-gray-700 hover:text-black focus:outline-none cursor-pointer max-w-[140px]"
                >
                  <span className="truncate">
                    {selectedCategory === "all"
                      ? "All Categories"
                      : visibleCategories.find((c) => c._id === selectedCategory)?.name || "All Categories"}
                  </span>
                  <FiChevronDown
                    className={`h-3 w-3 text-gray-400 shrink-0 transition-transform duration-200 ${
                      categoryDropdownOpen ? "rotate-180 text-black" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {categoryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-[calc(100%+8px)] z-[130000] w-64 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-2xl custom-scrollbar"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory("all");
                          setCategoryDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition cursor-pointer ${
                          selectedCategory === "all"
                            ? "bg-gray-100 text-black font-bold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-black"
                        }`}
                      >
                        <span>All Categories</span>
                        {selectedCategory === "all" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-black" />
                        )}
                      </button>

                      <div className="my-1 border-t border-gray-100" />

                      {visibleCategories.map((c) => {
                        const isSelected = selectedCategory === c._id;
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(c._id);
                              setCategoryDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition cursor-pointer ${
                              isSelected
                                ? "bg-gray-100 text-black font-bold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-black"
                            }`}
                          >
                            <span className="truncate pr-2">{c.name}</span>
                            {isSelected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                onFocus={() => query.trim() && setShowSuggestions(true)}
                placeholder="Search products, brands and more..."
                className="w-full bg-transparent px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />

              <button
                type="submit"
                style={{
                  backgroundColor: themeColor || "#000000",
                  color: buttonTextColor || "#ffffff",
                }}
                className="my-1 mr-1 flex items-center justify-center h-8 w-8 rounded-full transition-opacity hover:opacity-90 cursor-pointer shrink-0"
                aria-label="Submit search"
              >
                <FiSearch className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Suggestions Dropdown with Rich Preview */}
            {showSuggestions && query.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[125000] rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-md py-2 shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                    <span>Searching products & brands...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {suggestions.map((item) => (
                      <button
                        key={`${item.resultType}-${item._id || item.orderNumber}`}
                        type="button"
                        onClick={() => handleSuggestionClick(item)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50/80 transition group cursor-pointer"
                      >
                        {item.resultType === "product" ? (
                          <>
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-10 w-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                                <FiShoppingBag className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 group-hover:text-black truncate text-xs sm:text-sm">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                {item.brand && (
                                  <span className="font-semibold text-gray-600">
                                    {item.brand}
                                  </span>
                                )}
                                {item.category && <span>• {item.category}</span>}
                              </div>
                            </div>
                            {item.price !== undefined && (
                              <span className="text-xs sm:text-sm font-bold text-gray-900 shrink-0">
                                ৳{item.price}
                              </span>
                            )}
                          </>
                        ) : item.resultType === "order" ? (
                          <div className="flex-1">
                            <p className="font-bold text-xs text-gray-900">
                              Order #{item.orderNumber}
                            </p>
                            <p className="text-[11px] text-gray-500">{item.customerName}</p>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-xs">
                              Category: {item.name}
                            </p>
                          </div>
                        )}
                      </button>
                    ))}
                    <div className="p-2 bg-gray-50/50 text-center">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="text-xs font-semibold text-gray-700 hover:text-black hover:underline cursor-pointer"
                      >
                        See all results for &quot;{query}&quot; →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No products or brands found for &quot;{query}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* User Account */}
            {loggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="p-1 text-gray-700 hover:text-black cursor-pointer flex items-center"
                  aria-label="Account"
                >
                  <FiUser className="h-5.5 w-5.5" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-[calc(100%+8px)] z-[125000] w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                      </div>
                      <a
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        Dashboard
                      </a>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="p-1 text-gray-700 hover:text-black cursor-pointer focus:outline-none"
                aria-label="Sign in"
              >
                <FiUser className="h-5.5 w-5.5" />
              </button>
            )}

            {/* Language Switcher Button (BN / EN) */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="notranslate inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 hover:border-black bg-gray-50 hover:bg-white text-xs font-extrabold text-gray-800 transition cursor-pointer shadow-2xs"
              title={hydratedIsBengali ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
              aria-label="Toggle language"
            >
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${!hydratedIsBengali ? "bg-black text-white" : "text-gray-500"}`}>
                EN
              </span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${hydratedIsBengali ? "bg-emerald-600 text-white font-bold" : "text-gray-500"}`}>
                বাং
              </span>
            </button>

            {/* Wishlist Icon */}
            <Link to="/wishlist" className="relative p-1 text-gray-700 hover:text-black cursor-pointer" aria-label="Wishlist" title="Wishlist">
              <FiHeart className="h-5.5 w-5.5" />
              {safeWishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1 shadow-xs">
                  {safeWishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon and Total Price (Swapped position: Bag icon first, then ৳ amount) */}
            <Link to="/cart" className="flex items-center gap-2 group cursor-pointer" aria-label="Cart">
              <div className="relative p-1 text-gray-700 group-hover:text-black">
                <FiShoppingBag className="h-5.5 w-5.5" />
                {safeCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1">
                    {safeCartCount}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 hidden sm:inline">
                ৳{Number(cartTotalAmount || 0).toFixed(2)}
              </span>
            </Link>
          </div>

        </div>

        {/* Mobile Search Bar (Clean and minimal under header) */}
        <div className="px-4 pb-3 sm:hidden border-t border-gray-50 pt-2.5 relative">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center w-full rounded-full bg-gray-100/90 border border-gray-200/80 px-1 py-0.5 focus-within:bg-white focus-within:border-black transition-all"
          >
            <div className="pl-3 pr-1 text-gray-400">
              <FiSearch className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              onFocus={() => query.trim() && setShowSuggestions(true)}
              placeholder="Search products, brands..."
              className="w-full bg-transparent px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none"
            />
            <button
              type="submit"
              style={{
                backgroundColor: themeColor || "#000000",
                color: buttonTextColor || "#ffffff",
              }}
              className="my-0.5 mr-0.5 flex items-center justify-center h-7 w-7 rounded-full hover:opacity-90 transition-opacity shrink-0 text-xs"
              aria-label="Search"
            >
              <FiSearch className="h-3 w-3" />
            </button>
          </form>

          {/* Mobile Search Suggestions Dropdown */}
          {showSuggestions && query.trim() && (
            <div className="absolute left-4 right-4 top-[calc(100%+4px)] z-[125000] rounded-xl border border-gray-200 bg-white py-2 shadow-2xl overflow-hidden max-h-[50vh] overflow-y-auto custom-scrollbar">
              {searchLoading ? (
                <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                  <span>Searching...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {suggestions.slice(0, 6).map((item) => (
                    <button
                      key={`mob-${item.resultType}-${item._id || item.orderNumber}`}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-gray-50 transition cursor-pointer"
                    >
                      {item.resultType === "product" ? (
                        <>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-8 w-8 rounded-lg object-cover bg-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                              <FiShoppingBag className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate text-xs">
                              {item.title}
                            </p>
                            {item.price !== undefined && (
                              <span className="text-xs font-bold text-gray-900">
                                ৳{item.price}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="font-medium text-gray-800 truncate text-xs">
                          {item.name || item.orderNumber}
                        </p>
                      )}
                    </button>
                  ))}
                  <div className="p-2 bg-gray-50 text-center">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="text-xs font-semibold text-gray-700 hover:text-black hover:underline cursor-pointer"
                    >
                      See all results for &quot;{query}&quot; →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-gray-400">
                  No products found for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. LOWER NAVIGATION BAR */}
      <div className="border-b border-gray-100 bg-white hidden lg:block">
        <div className="site-shell max-w-7xl mx-auto px-4 flex items-center justify-between">
          
          {/* Left All Categories Pill Bar Button (Toggles sidebar categories on/off, visible only on Home page) */}
          {location.pathname === "/" ? (
            <button
              type="button"
              onClick={handleToggleCategories}
              className="w-[260px] flex items-center justify-between py-3.5 pr-6 border-r border-gray-100 cursor-pointer text-left focus:outline-none select-none group"
              title={categoriesOpen ? "Hide categories" : "Show categories"}
            >
              <div className="flex items-center gap-2.5 font-bold text-sm text-gray-900 group-hover:text-black">
                <span>All Categories</span>
                <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
                  {visibleCategories.length || 72}
                </span>
              </div>
              <FiChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  categoriesOpen ? "rotate-180 text-black" : ""
                }`}
              />
            </button>
          ) : null}

          {/* Horizontal Top Menu Links (Only HOME, SHOP, CONTACT - Clean without dropdowns) */}
          <nav
            className={`flex-1 flex items-center gap-8 text-xs font-bold tracking-wider uppercase text-gray-700 ${
              location.pathname === "/" ? "pl-8" : "pl-0 py-3.5"
            }`}
          >
            <Link
              to="/"
              style={
                location.pathname === "/"
                  ? { borderBottomColor: themeColor || "#000000", color: themeColor || "#000000" }
                  : {}
              }
              className={`transition hover:text-black py-1 border-b-2 ${
                location.pathname === "/"
                  ? "font-extrabold"
                  : "text-gray-600 border-transparent"
              }`}
            >
              HOME
            </Link>
            <Link
              to="/shop"
              style={
                location.pathname === "/shop"
                  ? { borderBottomColor: themeColor || "#000000", color: themeColor || "#000000" }
                  : {}
              }
              className={`transition hover:text-black py-1 border-b-2 ${
                location.pathname === "/shop"
                  ? "font-extrabold"
                  : "text-gray-600 border-transparent"
              }`}
            >
              SHOP
            </Link>
            <Link
              to="/contact"
              style={
                location.pathname === "/contact"
                  ? { borderBottomColor: themeColor || "#000000", color: themeColor || "#000000" }
                  : {}
              }
              className={`transition hover:text-black py-1 border-b-2 ${
                location.pathname === "/contact"
                  ? "font-extrabold"
                  : "text-gray-600 border-transparent"
              }`}
            >
              CONTACT
            </Link>
            <Link
              to="/compare"
              style={
                location.pathname === "/compare"
                  ? { borderBottomColor: themeColor || "#000000", color: themeColor || "#000000" }
                  : {}
              }
              className={`transition hover:text-black py-1 border-b-2 flex items-center gap-1.5 ${
                location.pathname === "/compare"
                  ? "font-extrabold"
                  : "text-gray-600 border-transparent"
              }`}
            >
              COMPARE
              {safeCompareCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white px-1">
                  {safeCompareCount}
                </span>
              )}
            </Link>
          </nav>

        </div>
      </div>

      {/* 4. MOBILE DRAWER MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[129000] bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-[130000] w-80 max-w-[85vw] bg-white p-5 flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <span className="text-xl font-black text-black">{hydratedLogoText}</span>
                  <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-500 hover:text-black">
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <form onSubmit={handleSearchSubmit} className="flex items-center rounded-lg bg-gray-100 px-3 py-2">
                    <FiSearch className="h-4 w-4 text-gray-400 mr-2" />
                    <input
                      type="text"
                      value={query}
                      onChange={handleSearchChange}
                      placeholder="Search products..."
                      className="bg-transparent text-xs text-gray-800 outline-none w-full"
                    />
                  </form>
                </div>

                <nav className="mt-6 flex flex-col gap-3 text-sm font-semibold text-gray-700">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-black py-1">HOME</Link>
                  <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="hover:text-black py-1">SHOP</Link>
                  <Link to="/compare" onClick={() => setMobileMenuOpen(false)} className="hover:text-black py-1 flex items-center justify-between">
                    <span>COMPARE</span>
                    {safeCompareCount > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white px-1">
                        {safeCompareCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-black py-1">CONTACT</Link>
                </nav>

                {/* Mobile Categories Section in Sidebar */}
                {visibleCategories && visibleCategories.length > 0 && (
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        All Categories ({visibleCategories.length})
                      </span>
                      <Link
                        to="/shop"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="max-h-56 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                      {visibleCategories.map((cat) => (
                        <Link
                          key={cat._id}
                          to={`/shop?category=${encodeURIComponent(cat.slug || cat._id || cat.name)}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition"
                        >
                          <span className="truncate">{cat.name}</span>
                          <FiChevronRight className="h-3 w-3 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                {loggedIn ? (
                  <button type="button" onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-semibold cursor-pointer">
                    <FiLogOut className="h-4 w-4" /> Logout
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="flex items-center gap-2 text-sm text-gray-800 font-semibold cursor-pointer w-full text-left"
                  >
                    <FiUser className="h-4 w-4" /> Sign in / Register
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. POPUP AUTH MODAL (Sign In & Sign Up in One Modal) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
      />
    </header>
  );
};

export default Navbar;
