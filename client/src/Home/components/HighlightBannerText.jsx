"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { HiSparkles } from "react-icons/hi2";
import { useThemeColors } from "../../hooks/useThemeColors";

const HighlightBannerText = () => {
  const [highlight, setHighlight] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const { themeColor } = useThemeColors();

  useEffect(() => {
    let isMounted = true;
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const baseUrl = rawApiUrl.endsWith("/api")
      ? rawApiUrl
      : rawApiUrl.replace(/\/+$/, "") + "/api";

    const fetchHighlight = async () => {
      try {
        const res = await axios.get(`${baseUrl}/banners/public/highlight-text`);
        if (isMounted && res.data?.success && res.data?.data) {
          const item = res.data.data;
          if (item.isActive && item.text && item.text.trim()) {
            setHighlight(item);
          } else {
            setHighlight(null);
          }
        }
      } catch (err) {
        if (isMounted) setHighlight(null);
      } finally {
        if (isMounted) setLoaded(true);
      }
    };

    fetchHighlight();

    return () => {
      isMounted = false;
    };
  }, []);

  // If not loaded or no active highlight text, render nothing (no layout shift)
  if (!loaded || !highlight) {
    return null;
  }

  return (
    <section aria-label="Store Highlight" className="w-full my-3 sm:my-4">
      <div className="site-shell">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-3 sm:px-6 sm:py-3.5 shadow-xs transition-all duration-300 hover:border-slate-300 hover:shadow-sm">
          {/* Subtle side decorative accents */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl sm:rounded-l-2xl opacity-90"
            style={{ backgroundColor: themeColor || "#0f172a" }}
          />

          <div className="flex items-center justify-center gap-2.5 sm:gap-3 text-center">
            {/* Elegant Sparkle Icon */}
            <span
              className="inline-flex shrink-0 items-center justify-center rounded-full p-1 sm:p-1.5 transition-transform duration-300"
              style={{
                backgroundColor: themeColor ? `${themeColor}15` : "#0f172a15",
                color: themeColor || "#0f172a",
              }}
            >
              <HiSparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>

            {/* Highlighted Message */}
            <p className="text-xs sm:text-sm font-semibold text-slate-800 tracking-normal sm:tracking-wide leading-relaxed">
              {highlight.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HighlightBannerText;
