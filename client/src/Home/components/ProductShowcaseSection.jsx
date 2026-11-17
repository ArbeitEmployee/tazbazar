"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "@/lib/routing";
import { getProductLink } from "../../utils/productUrl";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useThemeColors } from "../../hooks/useThemeColors";
import LandingSectionProductCard from "./LandingSectionProductCard";

const INITIAL_VISIBLE_PRODUCTS = 8;
const MAX_PRODUCTS = 8;

const VARIANT_ACCENTS = {
  popular: {
    iconWrap: "bg-black text-white shadow-xs",
  },
  "hot-deals": {
    iconWrap: "bg-black text-white shadow-xs",
  },
  "best-selling": {
    iconWrap: "bg-black text-white shadow-xs",
  },
  featured: {
    iconWrap: "bg-black text-white shadow-xs",
  },
  latest: {
    iconWrap: "bg-black text-white shadow-xs",
  },
};

const getProductCategoryId = (product) => {
  if (!product) return "";
  if (product.category && typeof product.category === "object") {
    return String(product.category._id || product.category.id || "").trim();
  }
  if (typeof product.category === "string") {
    return String(product.category).trim();
  }
  return "";
};

const getProductCategoryName = (product) => {
  if (!product) return "";
  if (product.category && typeof product.category === "object") {
    return String(product.category.name || "").trim();
  }
  if (typeof product.category === "string") {
    return String(product.category).trim();
  }
  return "";
};

const ProductShowcaseSection = ({
  sectionId,
  products = [],
  title,
  badgeText = "",
  containerClassName = "mx-auto max-w-7xl px-4 sm:px-6",
  variant = "popular",
  icon: Icon,
}) => {
  const navigate = useNavigate();
  const { themeColor, buttonTextColor } = useThemeColors();
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const accent = VARIANT_ACCENTS[variant] || {
    iconWrap: "bg-black text-white shadow-xs",
  };

  // Safe product list — hard cap at MAX_PRODUCTS (20)
  const allProducts = useMemo(() => {
    const list = Array.isArray(products) ? products.filter(Boolean) : [];
    return list.slice(0, MAX_PRODUCTS);
  }, [products]);

  // Extract unique categories and counts from the provided products
  const categoryList = useMemo(() => {
    const map = new Map();

    allProducts.forEach((p) => {
      const id = getProductCategoryId(p);
      const name = getProductCategoryName(p);

      if (id && name) {
        if (!map.has(id)) {
          map.set(id, { id, name, count: 0 });
        }
        map.get(id).count += 1;
      }
    });

    const categories = Array.from(map.values());
    // Only show categories tabs if there is more than 1 distinct category
    if (categories.length > 1) {
      return [{ id: "all", name: "All", count: allProducts.length }, ...categories];
    }
    return [];
  }, [allProducts]);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [categoryList]);

  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -280 : 280;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(checkScroll, 320);
  };

  // Filter products by selected category tab — always show all filtered (max 8 total, exactly 2 rows on desktop)
  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (activeCategoryId !== "all") {
      list = allProducts.filter((p) => {
        const pCatId = getProductCategoryId(p);
        const pCatName = getProductCategoryName(p);
        return pCatId === activeCategoryId || pCatName === activeCategoryId;
      });
    }
    return list.slice(0, MAX_PRODUCTS);
  }, [allProducts, activeCategoryId]);

  if (allProducts.length === 0) {
    return null;
  }

  const handleCategoryClick = (catId) => {
    setActiveCategoryId(catId);
  };

  return (
    <section
      id={sectionId}
      className="w-full bg-white py-8 sm:py-12 border-b border-slate-100/90"
    >
      <div className={containerClassName}>
        {/* Section Header: Left has Icon + Title, Right has View All */}
        <div className="mb-5 sm:mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-5">
          {/* Title & Icon */}
          <div className="flex items-center gap-3 sm:gap-3.5">
            {Icon ? (
              <div
                className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl ${accent.iconWrap}`}
              >
                <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
              </div>
            ) : null}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
              {title}
            </h2>
          </div>

          {/* Clean View All Button */}
          <button
            type="button"
            onClick={() => navigate("/shop")}
            onMouseEnter={(e) => {
              if (themeColor) {
                e.currentTarget.style.backgroundColor = themeColor;
                e.currentTarget.style.borderColor = themeColor;
                e.currentTarget.style.color = buttonTextColor || "#ffffff";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "";
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.color = "";
            }}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer shrink-0"
          >
            <span>View All</span>
            <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Organized Horizontal Category Tabs (Single neat row with navigation) */}
        {categoryList.length > 1 ? (
          <div className="relative mb-6 sm:mb-8 flex items-center gap-2">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll("left")}
                aria-label="Scroll categories left"
                className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {categoryList.map((cat) => {
                const isActive = activeCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    style={
                      isActive && themeColor
                        ? {
                            backgroundColor: themeColor,
                            color: buttonTextColor || "#ffffff",
                            borderColor: themeColor,
                          }
                        : {}
                    }
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-2 ${
                      isActive
                        ? "text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScroll("right")}
                aria-label="Scroll categories right"
                className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : null}

        {/* Product Grid - 4 cards per row */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {filteredProducts.map((product) => (
              <LandingSectionProductCard
                key={product?._id || product?.id}
                product={product}
                badgeText={badgeText}
                onViewDetails={(p) => navigate(getProductLink(p))}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-400">
            No products found in this category.
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductShowcaseSection;
