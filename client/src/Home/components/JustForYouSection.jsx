"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "@/lib/routing";
import { FiStar, FiArrowRight, FiRefreshCw, FiHeart } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  getTopCategoryIds,
  getViewedProductIds,
  hasPreferences,
} from "../../utils/userPreferences";
import { getProductPricingDisplay } from "../../utils/productPricing";
import { useThemeColors } from "../../hooks/useThemeColors";
import LandingSectionProductCard from "./LandingSectionProductCard";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fetchPersonalizedProducts = async (categoryIds = [], excludeIds = [], isManualRefresh = false) => {
  try {
    const baseParams = { limit: 12, page: 1 };
    if (isManualRefresh) baseParams._t = Date.now();

    if (categoryIds.length > 0) {
      // Fetch products from preferred categories
      const promises = categoryIds.map((catId) =>
        axios
          .get(`${baseUrl}/products/public`, {
            params: { ...baseParams, category: catId },
          })
          .then((r) => r.data?.products || [])
          .catch(() => [])
      );
      const results = await Promise.all(promises);
      const merged = results.flat();

      // Remove duplicates and already-viewed products
      const seen = new Set(excludeIds.map(String));
      const unique = [];
      for (const p of merged) {
        const id = String(p._id);
        if (!seen.has(id)) {
          seen.add(id);
          unique.push(p);
        }
      }
      if (unique.length >= 4) return { products: shuffle(unique), isPersonalized: true };
    }

    // Fallback: popular products
    const res = await axios.get(`${baseUrl}/products/public`, {
      params: baseParams,
    });
    return { products: shuffle(res.data?.products || []), isPersonalized: false };
  } catch {
    return { products: [], isPersonalized: false };
  }
};

const INITIAL_SHOW = 8;

const JustForYouSection = () => {
  const [products, setProducts] = useState([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { themeColor, buttonTextColor } = useThemeColors();

  // Listen to wishlist so we can refresh if items are added
  const wishlistItems = useSelector((state) => state.wishlist.items || []);

  const load = useCallback(async () => {
    setLoading(true);
    const topCats = getTopCategoryIds(3);
    const viewedIds = getViewedProductIds();
    const { products: fetched, isPersonalized: personalized } =
      await fetchPersonalizedProducts(topCats, viewedIds);
    setProducts(fetched);
    setIsPersonalized(personalized);
    setLoading(false);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const topCats = getTopCategoryIds(3);
      const viewedIds = getViewedProductIds();
      const { products: fetched, isPersonalized: personalized } =
        await fetchPersonalizedProducts(topCats, viewedIds, true);

      if (fetched.length > 0) {
        setProducts(fetched);
        setIsPersonalized(personalized);
        toast.success("Recommendations refreshed!");
      } else {
        toast("No products found.");
      }
    } catch (_err) {
      toast.error("Failed to refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  // Re-compute when wishlist changes (new category preference signal)
  useEffect(() => {
    if (wishlistItems.length > 0) {
      load();
    }
  }, [wishlistItems.length, load]);

  const visibleProducts = products.slice(0, INITIAL_SHOW);

  // Don't render if no products at all
  if (!loading && products.length === 0) return null;

  return (
    <section className="w-full bg-slate-50/50 py-8 sm:py-12 border-b border-slate-100/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Clean Header: Title & Controls */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/70 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
              Recommended for You
            </h2>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Refresh button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-40 cursor-pointer"
              title="Refresh recommendations"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin text-slate-900" : ""}`} />
              <span>Refresh</span>
            </button>

            {/* View All button */}
            <button
              type="button"
              onClick={() => navigate("/shop")}
              style={{
                backgroundColor: themeColor || "#0f172a",
                color: buttonTextColor || "#ffffff",
              }}
              className="group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95 cursor-pointer"
            >
              <span>View All</span>
              <FiArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Product Grid - 4 cards per row, taller layout */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {visibleProducts.map((product) => (
                <LandingSectionProductCard
                  key={product._id}
                  product={product}
                  badgeText={isPersonalized ? "For You" : "Pick"}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default JustForYouSection;
