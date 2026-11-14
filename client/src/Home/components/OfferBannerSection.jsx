"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "@/lib/routing";
import { FiArrowUpRight } from "react-icons/fi";
import usePublicSettings from "../../hooks/usePublicSettings";
import { toPublicAssetUrl } from "../../utils/publicSettings";
import { getFullImageUrl } from "../../utils/cloudinary";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

// Compact Full-Image Offer Card with clear overlay & proper aspect ratio
const CompactOfferCard = ({ banner, className = "" }) => {
  if (!banner) return null;

  const category = banner?.category;
  const targetLink = category?._id
    ? `/shop?category=${category._id}`
    : category?.name
    ? `/shop?category=${encodeURIComponent(category.name)}`
    : banner?.buttonLink || "/shop";

  return (
    <Link
      to={targetLink}
      className={`group relative flex w-full items-center justify-between overflow-hidden rounded-xl sm:rounded-2xl bg-slate-900 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 border border-slate-200/90 h-[75px] xs:h-[86px] sm:h-[105px] md:h-[125px] lg:h-[135px] ${className}`}
    >
      {/* 100% Full Background Image */}
      {banner.image ? (
        <img
          src={getFullImageUrl(banner.image, 800)}
          alt={banner.title || "Offer"}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106"
        />
      ) : null}

      {/* Scrim Gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent w-[80%] sm:w-[65%]" />

      {/* Content: Title & Shop Now */}
      <div className="relative z-10 max-w-[70%] sm:max-w-[62%] flex flex-col justify-center h-full pl-2.5 xs:pl-3.5 sm:pl-4 md:pl-5 pr-1">
        <h4 className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-black tracking-tight text-slate-900 leading-tight line-clamp-2">
          {banner.title || "Special Deal"}
        </h4>
        <div className="mt-1 xs:mt-1.5 sm:mt-2">
          <span className="inline-flex items-center gap-0.5 xs:gap-1 rounded-full bg-slate-950 px-2 py-0.5 xs:px-2.5 xs:py-0.5 sm:px-3 sm:py-1 text-[8px] xs:text-[9px] sm:text-xs font-bold text-white shadow-xs transition-all duration-200 group-hover:bg-slate-800">
            <span>Shop Now</span>
            <FiArrowUpRight className="h-2 w-2 xs:h-2.5 xs:w-2.5 sm:h-3 sm:w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

// Reusable Highlighted Central Hub Component
const CentralHub = ({ logo, brandName, brandLogoText }) => (
  <div className="relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl bg-white px-3.5 py-3 xs:px-4 xs:py-3.5 sm:px-6 sm:py-4.5 md:px-8 md:py-5 shadow-2xl ring-2 ring-amber-500/30 text-center min-w-[130px] xs:min-w-[150px] sm:min-w-[185px] md:min-w-[220px]">
    {/* Ambient Glow Light Behind Hub */}
    <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500 opacity-20 blur-md pointer-events-none -z-10" />

    {/* Brand Logo Container */}
    <div className="relative mb-1 flex items-center justify-center">
      {logo ? (
        <img
          src={logo}
          alt={brandName}
          className="h-6 xs:h-7.5 sm:h-9 md:h-11 w-auto max-w-[95px] xs:max-w-[115px] sm:max-w-[145px] md:max-w-[170px] object-contain drop-shadow-sm"
        />
      ) : (
        <span className="text-xs xs:text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900">
          {brandLogoText}
        </span>
      )}
    </div>

    {/* Special Offer Title with Gradient Accent */}
    <h3 className="text-[11px] xs:text-xs sm:text-sm md:text-base font-black tracking-tight bg-gradient-to-r from-slate-950 via-slate-900 to-amber-700 bg-clip-text text-transparent uppercase leading-tight">
      Special Offer
    </h3>

    {/* Handpicked Deals Subtitle */}
    <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 tracking-wide">
      Handpicked Deals For You
    </p>
  </div>
);

const OfferBannerSection = () => {
  const [offerBanners, setOfferBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = usePublicSettings();

  const website = settings?.website;
  const storeName = String(website?.storeName || "").trim();
  const brandName = storeName || "Clotya";
  const logoMode =
    String(website?.logoMode || "").trim().toLowerCase() === "text"
      ? "text"
      : "image";
  const logo =
    logoMode === "image" ? toPublicAssetUrl(website?.logoUrl || "") : "";
  const logoText = String(website?.logoText || "").trim();
  const brandLogoText = logoText || brandName;

  useEffect(() => {
    let isMounted = true;
    const fetchOfferBanners = async () => {
      try {
        const res = await axios.get(`${baseUrl}/banners/public?type=promotional`);
        if (isMounted) {
          let list = res.data?.banners || [];
          if (list.length === 0) {
            const fallbackRes = await axios.get(
              `${baseUrl}/banners/public?type=offer`
            );
            list = fallbackRes.data?.banners || [];
          }
          setOfferBanners(list.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load offer banners:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOfferBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || offerBanners.length === 0) {
    return null;
  }

  const count = offerBanners.length;

  return (
    <section className="site-shell my-6 sm:my-10 md:my-14 lg:my-16 overflow-hidden max-w-full">
      {/* =========================================================================
          CASE 1: 4 BANNERS (Central Hub with 4 Directional Arrows Landing on Edges)
         ========================================================================= */}
      {count === 4 && (
        <div className="relative w-full max-w-4xl mx-auto px-1 sm:px-3">
          {/* 2-Row Grid with plenty of vertical gap so Center Hub never touches cards */}
          <div className="grid grid-cols-2 gap-x-3 xs:gap-x-5 sm:gap-x-10 md:gap-x-14 gap-y-28 xs:gap-y-32 sm:gap-y-36 md:gap-y-40 items-stretch">
            {/* Top-Left Banner (1) */}
            <div className="flex">
              <CompactOfferCard banner={offerBanners[0]} />
            </div>

            {/* Top-Right Banner (2) */}
            <div className="flex">
              <CompactOfferCard banner={offerBanners[1]} />
            </div>

            {/* Bottom-Left Banner (3) */}
            <div className="flex">
              <CompactOfferCard banner={offerBanners[2]} />
            </div>

            {/* Bottom-Right Banner (4) */}
            <div className="flex">
              <CompactOfferCard banner={offerBanners[3]} />
            </div>
          </div>

          {/* Dynamic SVG with 4 Arrows Landing cleanly between Hub & Cards */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <marker
                id="arrow-head-4"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b" />
              </marker>
            </defs>

            {/* Arrow to Top-Left Card Bottom Edge */}
            <path
              d="M 425 300 C 365 280, 310 250, 260 210"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#arrow-head-4)"
            />

            {/* Arrow to Top-Right Card Bottom Edge */}
            <path
              d="M 575 300 C 635 280, 690 250, 740 210"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#arrow-head-4)"
            />

            {/* Arrow to Bottom-Left Card Top Edge */}
            <path
              d="M 425 300 C 365 320, 310 350, 260 390"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#arrow-head-4)"
            />

            {/* Arrow to Bottom-Right Card Top Edge */}
            <path
              d="M 575 300 C 635 320, 690 350, 740 390"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#arrow-head-4)"
            />
          </svg>

          {/* Central Logo & Special Offer Node (Highlighted and Larger on Mobile) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <CentralHub
              logo={logo}
              brandName={brandName}
              brandLogoText={brandLogoText}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          CASE 2: 3 BANNERS (Central Hub with 3 Directional Arrows)
         ========================================================================= */}
      {count === 3 && (
        <div className="relative w-full max-w-4xl mx-auto px-1 sm:px-3">
          <div className="grid grid-cols-2 gap-x-3 xs:gap-x-5 sm:gap-x-10 md:gap-x-14 gap-y-28 xs:gap-y-32 sm:gap-y-36 md:gap-y-40 items-stretch">
            {/* Top-Left Banner */}
            <div className="flex">
              <CompactOfferCard banner={offerBanners[0]} />
            </div>

            {/* Top-Right Banner */}
            <div className="flex">
              <CompactOfferCard banner={offerBanners[1]} />
            </div>

            {/* Bottom Centered Banner */}
            <div className="col-span-2 flex justify-center">
              <div className="w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md">
                <CompactOfferCard banner={offerBanners[2]} />
              </div>
            </div>
          </div>

          {/* Dynamic SVG with 3 Arrows Pointing to Edges */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <marker
                id="arrow-head-3"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b" />
              </marker>
            </defs>

            {/* Arrow to Top-Left Edge */}
            <path
              d="M 425 300 C 365 280, 310 250, 260 210"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#arrow-head-3)"
            />

            {/* Arrow to Top-Right Edge */}
            <path
              d="M 575 300 C 635 280, 690 250, 740 210"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#arrow-head-3)"
            />

            {/* Arrow to Bottom Center Top Edge */}
            <path
              d="M 500 330 L 500 390"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#arrow-head-3)"
            />
          </svg>

          {/* Central Logo & Special Offer Node */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <CentralHub
              logo={logo}
              brandName={brandName}
              brandLogoText={brandLogoText}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          CASE 3: 2 BANNERS (Central Hub with 2 Directional Arrows)
         ========================================================================= */}
      {count === 2 && (
        <div className="relative w-full max-w-3xl mx-auto px-2">
          <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 items-center">
            {/* Left Banner */}
            <div className="flex">
              <CompactOfferCard banner={offerBanners[0]} />
            </div>

            {/* Right Banner */}
            <div className="flex">
              <CompactOfferCard banner={offerBanners[1]} />
            </div>
          </div>

          {/* Horizontal Arrows & Center Hub */}
          <div className="relative my-6 flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
              viewBox="0 0 600 80"
              fill="none"
            >
              <defs>
                <marker
                  id="arrow-head-2"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b" />
                </marker>
              </defs>

              {/* Arrow Left */}
              <path
                d="M 230 40 L 90 40"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeDasharray="5 5"
                markerEnd="url(#arrow-head-2)"
              />

              {/* Arrow Right */}
              <path
                d="M 370 40 L 510 40"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeDasharray="5 5"
                markerEnd="url(#arrow-head-2)"
              />
            </svg>

            {/* Central Node */}
            <div className="relative z-10">
              <CentralHub
                logo={logo}
                brandName={brandName}
                brandLogoText={brandLogoText}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CASE 4: 1 BANNER
         ========================================================================= */}
      {count === 1 && (
        <div className="flex flex-col items-center gap-3 w-full max-w-sm sm:max-w-md mx-auto">
          <div className="w-full flex justify-center">
            <CentralHub
              logo={logo}
              brandName={brandName}
              brandLogoText={brandLogoText}
            />
          </div>
          <div className="w-full">
            <CompactOfferCard banner={offerBanners[0]} />
          </div>
        </div>
      )}
    </section>
  );
};

export default OfferBannerSection;
