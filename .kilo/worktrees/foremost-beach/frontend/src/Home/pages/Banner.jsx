/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "@/lib/routing";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiZap,
  FiTrendingUp,
  FiShield,
  FiTag,
} from "react-icons/fi";
import { stripHtml } from "../../utils/richText";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

const normalizeLink = (link) => {
  const normalized = String(link || "").trim();
  if (!normalized || normalized === "#") return "";
  return normalized;
};

const isExternalLink = (link) =>
  /^https?:\/\//i.test(link) ||
  String(link || "").startsWith("mailto:") ||
  String(link || "").startsWith("tel:");

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
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

const FallbackImage = ({ className, alt }) => (
  <div className={`${className} relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950`}>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
          <FiShoppingBag className="w-7 h-7 text-blue-400" />
        </div>
        <p className="text-white/90 text-sm font-semibold">{alt || "Featured Collection"}</p>
      </div>
    </div>
  </div>
);

const HeroImage = ({ src, fullSrc, alt, className, onClick }) => {
  const [imgSrc, setImgSrc] = useState(getFullImageUrl(src || fullSrc));
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initial = getFullImageUrl(src || fullSrc);
    setImgSrc(initial);
    setHasError(false);
    setIsLoading(true);

    if (fullSrc && src !== fullSrc) {
      const fullUrl = getFullImageUrl(fullSrc);
      if (fullUrl && fullUrl !== initial) {
        const preload = new Image();
        preload.onload = () => {
          setImgSrc(fullUrl);
          setIsLoading(false);
        };
        preload.src = fullUrl;
      }
    }
  }, [src, fullSrc]);

  if (hasError || !imgSrc) {
    return (
      <div onClick={onClick} className="h-full w-full cursor-pointer">
        <FallbackImage className={className} alt={alt} />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div
          className={`${className} absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center`}
        >
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} cursor-pointer transition-all duration-700`}
        onClick={onClick}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        crossOrigin={
          imgSrc?.startsWith("http://") || imgSrc?.startsWith("https://")
            ? "anonymous"
            : undefined
        }
        loading="eager"
      />
    </div>
  );
};

const Banner = () => {
  const [heroBanners, setHeroBanners] = useState([]);
  const [promoBanners, setPromoBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressKey, setProgressKey] = useState(Date.now());
  const slideDurationMs = 5000;
  const navigate = useNavigate();

  const openLink = useCallback(
    (link) => {
      const target = normalizeLink(link);
      if (!target) return;

      if (isExternalLink(target)) {
        window.location.href = target;
      } else {
        navigate(target);
      }
    },
    [navigate],
  );

  const fetchAllBanners = useCallback(async () => {
    try {
      setLoading(true);
      const [heroRes, promoRes] = await Promise.allSettled([
        fetch(`${baseUrl}/banners/public?type=hero&page=home`),
        fetch(`${baseUrl}/banners/public?type=promotional&page=home`),
      ]);

      let heroList = [];
      if (heroRes.status === "fulfilled") {
        const data = await heroRes.value.json();
        if (data.success && Array.isArray(data.banners)) heroList = data.banners;
        else if (Array.isArray(data)) heroList = data;
        else if (data?.data && Array.isArray(data.data)) heroList = data.data;
      }

      let promoList = [];
      if (promoRes.status === "fulfilled") {
        const data = await promoRes.value.json();
        if (data.success && Array.isArray(data.banners)) promoList = data.banners;
        else if (Array.isArray(data)) promoList = data;
        else if (data?.data && Array.isArray(data.data)) promoList = data.data;
      }

      const activeHero = heroList.filter((b) => b?.isActive !== false);
      const activePromo = promoList.filter((b) => b?.isActive !== false);

      setHeroBanners(activeHero);
      setPromoBanners(activePromo);
      if (activeHero.length > 0) setActiveIndex(0);
    } catch (err) {
      console.error("Error fetching banners:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBanners();
    const handleUpdate = () => fetchAllBanners();
    window.addEventListener("bannerCreated", handleUpdate);
    window.addEventListener("bannerUpdated", handleUpdate);
    return () => {
      window.removeEventListener("bannerCreated", handleUpdate);
      window.removeEventListener("bannerUpdated", handleUpdate);
    };
  }, [fetchAllBanners]);

  const handlePrev = useCallback(() => {
    if (isTransitioning || heroBanners.length <= 1) return;
    setIsTransitioning(true);
    setAutoPlay(false);
    setProgressKey(Date.now());

    const nextIndex = activeIndex === 0 ? heroBanners.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);

    setTimeout(() => {
      setIsTransitioning(false);
      setTimeout(() => setAutoPlay(true), 1200);
    }, 500);
  }, [isTransitioning, heroBanners.length, activeIndex]);

  const handleNext = useCallback(() => {
    if (isTransitioning || heroBanners.length <= 1) return;
    setIsTransitioning(true);
    setProgressKey(Date.now());

    const nextIndex = activeIndex === heroBanners.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [isTransitioning, heroBanners.length, activeIndex]);

  useEffect(() => {
    if (!autoPlay || heroBanners.length <= 1) return;
    if (isTransitioning) return;

    const timeout = setTimeout(() => {
      handleNext();
    }, slideDurationMs);

    return () => clearTimeout(timeout);
  }, [autoPlay, heroBanners.length, isTransitioning, activeIndex, handleNext]);

  const handleDotClick = useCallback(
    (index) => {
      if (isTransitioning || index === activeIndex) return;
      setIsTransitioning(true);
      setActiveIndex(index);
      setAutoPlay(false);
      setProgressKey(Date.now());
      setTimeout(() => {
        setIsTransitioning(false);
        setTimeout(() => setAutoPlay(true), 1200);
      }, 500);
    },
    [isTransitioning, activeIndex],
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePrev, handleNext]);

  // Loading skeleton state
  if (loading) {
    return (
      <section className="w-full py-4 sm:py-6">
        <div className="site-shell">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
            <div className="lg:col-span-8 h-[360px] sm:h-[420px] lg:h-[460px] rounded-2xl sm:rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="hidden lg:flex lg:col-span-4 flex-col gap-4">
              <div className="h-[222px] rounded-2xl sm:rounded-3xl bg-slate-100 animate-pulse" />
              <div className="h-[222px] rounded-2xl sm:rounded-3xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback empty state
  if (heroBanners.length === 0) {
    return (
      <section className="w-full py-4 sm:py-6">
        <div className="site-shell">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600/20 backdrop-blur-md border border-blue-500/30 flex items-center justify-center">
              <FiShoppingBag className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              Welcome to Our Store
            </h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
              Discover top quality products, fast nationwide shipping, and exclusive offers.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Start Shopping <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = heroBanners[activeIndex];

  return (
    <section className="w-full pt-3 pb-2 sm:pt-5 sm:pb-3">
      <div className="site-shell">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 xl:gap-5 items-stretch">
          
          {/* =========================================================================
              1. MAIN HERO SLIDER (Left 8 Cols)
             ========================================================================= */}
          <div className="lg:col-span-8 relative h-[360px] sm:h-[420px] lg:h-[460px] xl:h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 bg-slate-950 shadow-md shadow-slate-200/50 group">
            {/* Background Image with Framer Motion */}
            <div className="absolute inset-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`hero-slide-${activeIndex}`}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0"
                >
                  <HeroImage
                    src={currentBanner.thumb || currentBanner.image}
                    fullSrc={currentBanner.image}
                    alt={currentBanner.title || "Hero Banner"}
                    className="w-full h-full object-cover object-center"
                    fetchPriority="high"
                    onClick={() => openLink(currentBanner?.link || currentBanner?.buttonLink)}
                  />
                </motion.div>
              </AnimatePresence>

            </div>

            {/* Navigation Arrows */}
            {heroBanners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isTransitioning}
                  aria-label="Previous Slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 hover:scale-110 hover:bg-blue-600 hover:border-blue-500 active:scale-95 opacity-80 group-hover:opacity-100"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isTransitioning}
                  aria-label="Next Slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 hover:scale-110 hover:bg-blue-600 hover:border-blue-500 active:scale-95 opacity-80 group-hover:opacity-100"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Modern Progress Pill Indicators */}
            {heroBanners.length > 1 && (
              <div className="absolute bottom-4 right-4 sm:right-8 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/15">
                {heroBanners.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    onClick={() => handleDotClick(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className="relative p-0.5"
                  >
                    <div
                      className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                        idx === activeIndex
                          ? "w-7 h-2 bg-slate-700"
                          : "w-2 h-2 bg-white/40 hover:bg-white/70"
                      }`}
                    >
                      {idx === activeIndex && autoPlay && (
                        <motion.div
                          key={`prog-${progressKey}`}
                          className="absolute inset-0 bg-blue-500 rounded-full origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: slideDurationMs / 1000, ease: "linear" }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =========================================================================
              2. SIDE PROMOTIONAL CARDS (Right 4 Cols)
             ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 lg:col-span-4 gap-3.5 lg:gap-4 xl:gap-5 h-full">
            
            {/* Promo Card 1: Hot Deal */}
            {promoBanners[0] ? (
              <div
                onClick={() => openLink(promoBanners[0].link || "/shop?badge=hot")}
                className="group relative h-[175px] sm:h-[190px] lg:h-[222px] xl:h-[232px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 bg-slate-950 shadow-md shadow-slate-200/40 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
              >
                <HeroImage
                  src={promoBanners[0].thumb || promoBanners[0].image}
                  fullSrc={promoBanners[0].image}
                  alt="Hot Deal"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent p-5 sm:p-6 flex items-end justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-md backdrop-blur-xs">
                    <FiTrendingUp className="h-4 w-4 text-amber-300" />
                    Hot Deal
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-600">
                    <FiArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ) : (
              <Link
                to="/shop?badge=hot"
                className="group relative h-[175px] sm:h-[190px] lg:h-[222px] xl:h-[232px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-5 sm:p-6 flex flex-col justify-between shadow-md shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/15"
              >
                {/* Decorative Background Mesh Glows */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-blue-600/25 blur-2xl group-hover:bg-blue-600/40 transition-colors" />
                <div className="pointer-events-none absolute left-4 bottom-0 h-24 w-24 rounded-full bg-cyan-500/20 blur-xl" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-md">
                    <FiTrendingUp className="h-4 w-4 text-amber-300" />
                    Hot Deal
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md transition-transform duration-300 group-hover:rotate-12 group-hover:bg-blue-600">
                    <FiTag className="h-4 w-4" />
                  </span>
                </div>

                <div className="relative z-10 flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                    Explore Deals
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/40 text-white backdrop-blur-md transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-600">
                    <FiArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )}

            {/* Promo Card 2: Featured */}
            {promoBanners[1] ? (
              <div
                onClick={() => openLink(promoBanners[1].link || "/shop")}
                className="group relative h-[175px] sm:h-[190px] lg:h-[222px] xl:h-[232px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 bg-slate-950 shadow-md shadow-slate-200/40 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <HeroImage
                  src={promoBanners[1].thumb || promoBanners[1].image}
                  fullSrc={promoBanners[1].image}
                  alt="Featured"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent p-5 sm:p-6 flex items-end justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-md backdrop-blur-xs">
                    <FiZap className="h-4 w-4 text-amber-300" />
                    Featured
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-600">
                    <FiArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ) : (
              <Link
                to="/shop"
                className="group relative h-[175px] sm:h-[190px] lg:h-[222px] xl:h-[232px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-5 sm:p-6 flex flex-col justify-between shadow-md shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/15"
              >
                {/* Decorative Background Mesh Glows */}
                <div className="pointer-events-none absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-cyan-600/20 blur-2xl group-hover:bg-cyan-600/35 transition-colors" />
                <div className="pointer-events-none absolute right-4 top-2 h-20 w-20 rounded-full bg-blue-500/20 blur-xl" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-md">
                    <FiZap className="h-4 w-4 text-amber-300" />
                    Featured
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-hover:bg-cyan-600">
                    <FiShield className="h-4 w-4" />
                  </span>
                </div>

                <div className="relative z-10 flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                    Explore Collection
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600/40 text-white backdrop-blur-md transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-cyan-600">
                    <FiArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
