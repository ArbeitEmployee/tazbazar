"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useSelector } from "react-redux";
import { HiOutlineSparkles, HiArrowRight } from "react-icons/hi2";
import { selectPublicSettings } from "../../store/publicSettingsSlice";
import { getFullImageUrl } from "../../utils/cloudinary";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export default function BrandMarqueeSection() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const settings = useSelector(selectPublicSettings);

  const showBrandMarquee = settings?.storefront?.showBrandMarquee !== false;

  useEffect(() => {
    let isMounted = true;

    const fetchBrands = async () => {
      try {
        const res = await axios.get(`${baseUrl}/brands/public`);
        if (isMounted) {
          const fetched = Array.isArray(res.data?.brands)
            ? res.data.brands
            : Array.isArray(res.data?.data?.brands)
            ? res.data.data.brands
            : [];
          setBrands(fetched);
        }
      } catch (err) {
        try {
          const fallbackRes = await axios.get(`${baseUrl}/brands`);
          if (isMounted) {
            const fallbackList = Array.isArray(fallbackRes.data?.brands)
              ? fallbackRes.data.brands
              : Array.isArray(fallbackRes.data?.data?.brands)
              ? fallbackRes.data.data.brands
              : [];
            setBrands(fallbackList);
          }
        } catch (fallbackErr) {
          if (isMounted) setBrands([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!showBrandMarquee || loading || brands.length === 0) {
    return null;
  }

  // Duplicate items for continuous seamless infinite loop
  const displayBrands = brands.length < 8 ? [...brands, ...brands, ...brands, ...brands] : [...brands, ...brands];

  return (
    <section className="relative w-full py-10 md:py-14 bg-white overflow-hidden select-none">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-7 sm:mb-9 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 mb-2">
            <HiOutlineSparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Trusted Partners
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Top Brands & Official Stores
          </h3>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200 group"
        >
          <span>Explore All</span>
          <HiArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 text-slate-500 group-hover:text-slate-900" />
        </Link>
      </div>

      {/* Marquee Track Container with subtle fade edges */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] py-2">
        <div className="brand-marquee-track flex items-center gap-4 sm:gap-6 md:gap-8 w-max">
          {displayBrands.map((brand, index) => {
            const logo = getFullImageUrl(brand?.logoUrl, 320);
            const brandLink = `/shop?brand=${encodeURIComponent(brand?.name || "")}`;

            return (
              <Link
                key={`${brand?._id || brand?.name || index}-${index}`}
                href={brandLink}
                className="group flex-shrink-0 flex items-center justify-center h-20 sm:h-24 min-w-[140px] sm:min-w-[170px] max-w-[200px] px-6 sm:px-8 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-slate-200 hover:-translate-y-1 transition-all duration-300 ease-out"
                title={brand?.name}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={brand?.name || "Brand"}
                    className="max-h-12 sm:max-h-14 w-auto max-w-[120px] sm:max-w-[150px] object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-emerald-600 tracking-wide transition-colors whitespace-nowrap">
                    {brand?.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .brand-marquee-track {
          display: flex;
          animation: marqueeScroll 32s linear infinite;
        }
        .brand-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
