"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaFire, FaShoppingBag } from "react-icons/fa";
import { FaBolt, FaLayerGroup, FaRocket } from "react-icons/fa6";
import Banner from "./Banner";
import usePublicSettings from "../../hooks/usePublicSettings";
import { formatDocumentTitle } from "../../utils/publicSettings";
import { applySeoMetadata } from "../../utils/seoManager";
import { fetchHomeCatalog } from "../../utils/homeCatalog";
import ProductShowcaseSection from "../components/ProductShowcaseSection";
import { CategoryGrid, CampaignBanner } from "../components/HomeExtras";
import RecentlyViewedShelf from "../../components/RecentlyViewedShelf";
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
      <Banner />
      {/* Top Categories right after hero */}
      <DeferredSection minHeightClassName="min-h-[320px]">
        <CategoryGrid />
      </DeferredSection>
      {/* Feature Products */}
      <DeferredSection minHeightClassName="min-h-[820px]">
        <ProductShowcaseSection
          sectionId="top-categories"
          productType="Popular"
          products={sectionProducts.Popular}
          variant="popular"
          eyebrow="Trending Now"
          title="Feature Products"
          description="Top trending selection — curated for style, quality and comfort."
          icon={FaFire}
          badgeText="Limited"
          viewAllNoun="Popular Products"
        />
      </DeferredSection>
      {/* Trending Products */}
      <DeferredSection minHeightClassName="min-h-[820px]">
        <ProductShowcaseSection
          productType="Hot deals"
          products={sectionProducts["Hot deals"]}
          variant="hot-deals"
          eyebrow="What shoppers love this week"
          title="Trending Products"
          description="Limited-time offers your shoppers grab quickly."
          icon={FaBolt}
          badgeText="Hot Deal"
          viewAllNoun="Hot Deals"
        />
      </DeferredSection>
      {/* Mid promo */}
      <DeferredSection minHeightClassName="min-h-[420px]">
        <CampaignBanner />
      </DeferredSection>
      {/* Most Selling */}
      <DeferredSection minHeightClassName="min-h-[820px]">
        <ProductShowcaseSection
          productType="Best Selling"
          products={sectionProducts["Best Selling"]}
          variant="best-selling"
          eyebrow="Hot Sellers"
          title="Most Selling Products"
          description="Proven customer favorites with top verified reviews."
          icon={FaLayerGroup}
          badgeText="Best Seller"
          viewAllNoun="Best Sellers"
        />
      </DeferredSection>
      {/* Featured */}
      <DeferredSection minHeightClassName="min-h-[820px]">
        <ProductShowcaseSection
          productType="General"
          products={sectionProducts.General}
          variant="featured"
          eyebrow="Featured Collections"
          title="Featured Products"
          description="Editorial catalogue highlights, carefully chosen."
          icon={FaShoppingBag}
          badgeText="Curated"
          viewAllNoun="Products"
        />
      </DeferredSection>
      {/* Deals of the Day / New */}
      <DeferredSection minHeightClassName="min-h-[820px]">
        <ProductShowcaseSection
          productType="Latest"
          products={sectionProducts.Latest}
          variant="latest"
          eyebrow="New Arrivals"
          title="Deals of the Day"
          description="Fresh inventory and daily special discounts."
          icon={FaRocket}
          badgeText="New"
          viewAllNoun="Latest Products"
        />
      </DeferredSection>
      {/* Recently Viewed */}
      <DeferredSection minHeightClassName="min-h-[200px]">
        <div className="border-t border-slate-200/80 bg-slate-50/50 py-10 sm:py-14">
          <RecentlyViewedShelf className="mx-auto w-full max-w-7xl px-4 sm:px-6" />
        </div>
      </DeferredSection>
    </div>
  );
};

export default Home;
