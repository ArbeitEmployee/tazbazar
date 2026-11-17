"use client";
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "@/lib/routing";
import {
  FiArrowRight,
  FiChevronDown,
  FiChevronRight,
  FiShoppingBag,
} from "react-icons/fi";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";
import { fetchPublicCategories } from "../../utils/publicCategories";
import { dedupeRequest } from "../../utils/requestDedupe";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

const normalizeLink = (link) => {
  const normalized = String(link || "").trim();
  if (!normalized || normalized === "#") return "/shop";
  return normalized;
};

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80";
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return optimizeCloudinaryUrl(imagePath, 1600);
  }
  if (imagePath.startsWith("/")) {
    return baseUrl ? `${baseUrl}${imagePath}` : imagePath;
  }
  return baseUrl
    ? `${baseUrl}/uploads/banners/${imagePath}`
    : `/uploads/banners/${imagePath}`;
};

const getBadgeForCategory = (cat) => {
  const type = (cat?.type || "").toLowerCase();
  const name = (cat?.name || "").toLowerCase();

  if (type === "hot deals" || name.includes("hot")) {
    return { text: "HOT", color: "bg-emerald-500" };
  }
  if (type === "latest" || name.includes("new")) {
    return { text: "NEW", color: "bg-amber-500" };
  }
  if (type === "best selling" || type === "popular") {
    return { text: "POPULAR", color: "bg-blue-500" };
  }
  return null;
};

const Banner = () => {
  const [heroBanners, setHeroBanners] = useState([]);
  const [promoBanners, setPromoBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLeftIndex, setActiveLeftIndex] = useState(0);
  const [activeRightIndex, setActiveRightIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to custom event from navbar "All Categories" button
  useEffect(() => {
    const handleToggle = (e) => {
      if (typeof e?.detail?.open === "boolean") {
        setDropdownOpen(e.detail.open);
      } else {
        setDropdownOpen((prev) => !prev);
      }
    };
    window.addEventListener("toggleCategoriesSidebar", handleToggle);
    return () => window.removeEventListener("toggleCategoriesSidebar", handleToggle);
  }, []);

  const fetchBannersAndCategories = useCallback(async (signal) => {
    try {
      setLoading(true);
      const [allBannersRes, catData] = await Promise.allSettled([
        dedupeRequest("banners:public:home", async () => {
          const response = await fetch(`${baseUrl}/banners/public?page=home`);
          return response.json();
        }),
        fetchPublicCategories(),
      ]);

      if (signal?.aborted) return;

      let allBanners = [];
      if (allBannersRes.status === "fulfilled") {
        const data = allBannersRes.value;
        if (data?.success && Array.isArray(data.banners)) allBanners = data.banners;
        else if (Array.isArray(data)) allBanners = data;
      }

      const activeBanners = allBanners.filter((b) => b?.isActive !== false);

      // Separate hero and promotional banners
      const heroes = activeBanners.filter((b) => b.type === "hero");
      const promos = activeBanners.filter((b) => b.type === "promotional");

      // Left split (Hero collection or first half)
      if (heroes.length > 0) {
        setHeroBanners(heroes);
      } else {
        setHeroBanners([
          {
            title: "Street Fashion not only for the street",
            buttonLink: "/shop",
            image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
          },
          {
            title: "Embrace Sustainable Apparel",
            buttonLink: "/shop",
            image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
          },
        ]);
      }

      // Right split (Promotional collection or second half)
      if (promos.length > 0) {
        setPromoBanners(promos);
      } else if (heroes.length > 1) {
        setPromoBanners(heroes.slice(1));
      } else {
        setPromoBanners([
          {
            title: "New Season Handcrafted Essentials",
            buttonLink: "/shop",
            image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80",
          },
          {
            title: "Super Flash Sale Collection",
            buttonLink: "/shop",
            image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
          },
        ]);
      }

      if (catData.status === "fulfilled" && Array.isArray(catData.value)) {
        setCategories(catData.value);
      }
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Error loading home banner:", err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // StrictMode runs effects twice in dev; abort the first request so only
    // one banner/category request actually completes.
    const controller = new AbortController();
    fetchBannersAndCategories(controller.signal);
    return () => controller.abort();
  }, [fetchBannersAndCategories]);

  // Autoplay for left slider
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveLeftIndex((prev) => (prev === heroBanners.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  // Autoplay for right slider
  useEffect(() => {
    if (promoBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveRightIndex((prev) => (prev === promoBanners.length - 1 ? 0 : prev + 1));
    }, 6500);
    return () => clearInterval(interval);
  }, [promoBanners.length]);

  const currentLeft = heroBanners[activeLeftIndex] || heroBanners[0];
  const currentRight = promoBanners[activeRightIndex] || promoBanners[0];

  const visibleCategories = categories.filter(
    (cat) => (cat?.type || "").toLowerCase() !== "package"
  );

  return (
    <section className="w-full bg-white pb-6 pt-1">
      <div className="site-shell max-w-7xl mx-auto px-4 relative">
        
        {/* =========================================================================
            FLOATING "ALL CATEGORIES" OVERLAY DROPDOWN (Positioned on top of Banner)
           ========================================================================= */}
        {dropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-4 top-0 z-[100] w-[270px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-200"
              style={{ maxHeight: "490px" }}
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Categories ({visibleCategories.length})
                </span>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="text-gray-400 hover:text-black text-xs font-semibold"
                >
                  Close ✕
                </button>
              </div>

              {/* Category Links List */}
              <div className="py-2 overflow-y-auto max-h-[430px] custom-scrollbar divide-y divide-gray-50">
                {visibleCategories.map((cat) => {
                  const badge = getBadgeForCategory(cat);
                  const hasSub = Array.isArray(cat?.subcategories) && cat.subcategories.length > 0;
                  const targetParam = cat?.slug || cat?._id;

                  return (
                    <Link
                      key={cat._id || cat.name}
                      to={`/shop?category=${encodeURIComponent(targetParam)}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black transition group"
                    >
                      <span className="font-medium truncate pr-2 group-hover:translate-x-1 transition-transform">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {badge && (
                          <span className={`text-[9px] font-bold text-white px-2 py-0.5 rounded-full ${badge.color}`}>
                            {badge.text}
                          </span>
                        )}
                        {hasSub && (
                          <FiChevronRight className="h-3 w-3 text-gray-400 group-hover:text-black" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
        )}

        {/* =========================================================================
            DIVIDED 2-PART BANNER SECTION (50% / 50% Two-Column Full-Width Grid)
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 w-full">
          
          {/* --- LEFT BANNER (50%) --- */}
          <div className="relative w-full h-[240px] sm:h-[320px] md:h-[400px] lg:h-[460px] overflow-hidden rounded-2xl bg-gray-100 shadow-sm group">
            {currentLeft && (
              <>
                {/* Plain <img> keeps DOM ownership with React; framer-motion's
                    exit animation used to leave detached nodes behind and
                    crash React on route change. */}
                <img
                  key={`left-${activeLeftIndex}`}
                  src={getFullImageUrl(currentLeft.image)}
                  alt={currentLeft.title || "Banner Left"}
                  className="w-full h-full object-cover object-center select-none transition-transform duration-700 group-hover:scale-103"
                />

                {/* Clickable Overlay Link */}
                <Link
                  to={normalizeLink(currentLeft.buttonLink || currentLeft.link || "/shop")}
                  className="absolute inset-0 z-10 block"
                  aria-label={currentLeft.title || "Shop Left Offer"}
                />

                {/* Left Banner Title / Action Pill if provided */}
                {currentLeft.title && (
                  <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-black/60 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-xl max-w-[80%]">
                    <p className="text-xs sm:text-sm font-bold truncate">{currentLeft.title}</p>
                  </div>
                )}

                {/* Left Dots Pagination */}
                {heroBanners.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full">
                    {heroBanners.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveLeftIndex(idx);
                        }}
                        aria-label={`Slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === activeLeftIndex ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* --- RIGHT BANNER (50%) --- */}
          <div className="relative w-full h-[240px] sm:h-[320px] md:h-[400px] lg:h-[460px] overflow-hidden rounded-2xl bg-gray-100 shadow-sm group">
            {currentRight && (
              <>
                <img
                  key={`right-${activeRightIndex}`}
                  src={getFullImageUrl(currentRight.image)}
                  alt={currentRight.title || "Banner Right"}
                  className="w-full h-full object-cover object-center select-none transition-transform duration-700 group-hover:scale-103"
                />

                {/* Clickable Overlay Link */}
                <Link
                  to={normalizeLink(currentRight.buttonLink || currentRight.link || "/shop")}
                  className="absolute inset-0 z-10 block"
                  aria-label={currentRight.title || "Shop Right Offer"}
                />

                {/* Right Banner Title / Action Pill if provided */}
                {currentRight.title && (
                  <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-black/60 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-xl max-w-[80%]">
                    <p className="text-xs sm:text-sm font-bold truncate">{currentRight.title}</p>
                  </div>
                )}

                {/* Right Dots Pagination */}
                {promoBanners.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full">
                    {promoBanners.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveRightIndex(idx);
                        }}
                        aria-label={`Slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === activeRightIndex ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Banner;
