"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { HiSparkles, HiBolt } from "react-icons/hi2";
import { FaShoppingBag } from "react-icons/fa";
import { FaLayerGroup, FaRocket } from "react-icons/fa6";
import Banner from "./Banner";
import usePublicSettings from "../../hooks/usePublicSettings";
import { formatDocumentTitle } from "../../utils/publicSettings";
import { applySeoMetadata } from "../../utils/seoManager";
import { fetchHomeCatalog } from "../../utils/homeCatalog";
import ProductShowcaseSection from "../components/ProductShowcaseSection";
import RecentlyViewedShelf from "../../components/RecentlyViewedShelf";
import JustForYouSection from "../components/JustForYouSection";
import OfferBannerSection from "../components/OfferBannerSection";
import BrandMarqueeSection from "../components/BrandMarqueeSection";
import StorePopupNotice from "../../components/StorePopupNotice";
import {
  applyMarketingTemplate,
  getActiveMarketingEntry,
} from "../../utils/marketingProfiles";

const resolveSectionProducts = (section) => {
  if (!section || !Array.isArray(section.categories)) {
    return [];
  }

  return section.categories.flatMap((category) =>
    Array.isArray(category?.products) ? category.products : [],
  );
};

const DeferredSection = ({
  children,
  minHeightClassName = "min-h-[640px]",
  rootMargin = "600px 0px",
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible || typeof window === "undefined") return undefined;

    const node = containerRef.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef}>
      {isVisible ? (
        children
      ) : (
        <div
          aria-hidden="true"
          className={`${minHeightClassName} bg-white`}
        />
      )}
    </div>
  );
};

const Home = () => {
  const { settings } = usePublicSettings();
  const [catalog, setCatalog] = useState(null);

  useEffect(() => {
    if (!settings) return;

    const website = settings?.website || {};
    const seo = settings?.seo || {};
    const pageSeo = settings?.seoAnalytics?.pages?.home || {};
    const hasExplicitEntries = Boolean(settings?.seoAnalytics?.hasExplicitEntries);
    const seoEntry = getActiveMarketingEntry(settings, {
      type: "seo",
      pathname: "/",
    });
    const storeName =
      String(website.storeName || "E-Commerce").trim() || "E-Commerce";

    applySeoMetadata({
      title: formatDocumentTitle(
        settings,
        applyMarketingTemplate(seoEntry?.metaTitle, {
          storeName,
          pageName: "Home",
        }) ||
          (!hasExplicitEntries ? pageSeo.metaTitle : "") ||
          (!hasExplicitEntries ? seo.metaTitle : "") ||
          "Home",
      ),
      description: String(
        applyMarketingTemplate(seoEntry?.metaDescription, {
          storeName,
          pageName: "Home",
        }) ||
          (!hasExplicitEntries ? pageSeo.metaDescription : "") ||
          (!hasExplicitEntries ? seo.metaDescription : "") ||
          website.tagline ||
          "",
      ).trim(),
      keywords: String(
        applyMarketingTemplate(seoEntry?.metaKeywords, {
          storeName,
          pageName: "Home",
        }) ||
          (!hasExplicitEntries ? pageSeo.metaKeywords : "") ||
          (!hasExplicitEntries ? seo.metaKeywords : "") ||
          "",
      ).trim(),
      image: String(
        applyMarketingTemplate(seoEntry?.openGraphImage, {
          storeName,
          pageName: "Home",
        }) ||
          (!hasExplicitEntries ? pageSeo.openGraphImage : "") ||
          (!hasExplicitEntries ? seo.openGraphImage : "") ||
          website.headerIconUrl ||
          website.logoUrl ||
          "",
      ).trim(),
      url: typeof window !== "undefined" ? window.location.href : "",
      siteName: storeName,
    });
  }, [settings]);

  useEffect(() => {
    let active = true;

    fetchHomeCatalog().then((nextCatalog) => {
      if (active) {
        setCatalog(nextCatalog);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const sectionProducts = useMemo(
    () => ({
      Popular: resolveSectionProducts(catalog?.sections?.Popular),
      "Hot deals": resolveSectionProducts(catalog?.sections?.["Hot deals"]),
      General: resolveSectionProducts(catalog?.sections?.General),
      "Best Selling": resolveSectionProducts(catalog?.sections?.["Best Selling"]),
      Latest: resolveSectionProducts(catalog?.sections?.Latest),
    }),
    [catalog],
  );

  return (
    <div className="zz-page">
      <StorePopupNotice />
      <Banner />
      {/* Just for You - Personalized Section */}
      <DeferredSection minHeightClassName="min-h-[520px]">
        <JustForYouSection />
      </DeferredSection>
      {/* Offer Banner Section (Right below Just for You) */}
      <OfferBannerSection />
      {/* Brand Marquee / Sliding Section */}
      <BrandMarqueeSection />
      {/* Feature Products (under Just for You) */}
      <DeferredSection minHeightClassName="min-h-[500px]">
        <ProductShowcaseSection
          sectionId="top-categories"
          productType="Popular"
          products={sectionProducts.Popular}
          variant="popular"
          eyebrow="Trending Now"
          title="Feature Products"
          description="Top trending selection — curated for style, quality and comfort."
          badgeText="Limited"
          viewAllNoun="Popular Products"
        />
      </DeferredSection>
      {/* Trending Products */}
      <DeferredSection minHeightClassName="min-h-[500px]">
        <ProductShowcaseSection
          productType="Hot deals"
          products={sectionProducts["Hot deals"]}
          variant="hot-deals"
          eyebrow="What shoppers love this week"
          title="Trending Products"
          description="Limited-time offers your shoppers grab quickly."
          badgeText="Hot Deal"
          viewAllNoun="Hot Deals"
        />
      </DeferredSection>
    </div>
  );
};

export default Home;
