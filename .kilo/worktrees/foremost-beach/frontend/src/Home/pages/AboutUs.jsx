"use client";

import React from "react";
import dynamic from "next/dynamic";
import usePublicSettings from "../../hooks/usePublicSettings";
import { hasHtmlContent } from "../../utils/richText";
import {
  DEFAULT_ABOUT_CARDS,
  DEFAULT_ABOUT_STORY_CONTENT,
  DEFAULT_ABOUT_STORY_TITLE,
  getAboutCardIconComponent,
  normalizeAboutCards,
} from "../../utils/aboutSection";

const DeliveryScene = dynamic(() => import("./DeliveryScene"), {
  ssr: false,
  loading: () => <div className="h-[380px] w-full" />
});

const AboutUs = () => {
  const { settings } = usePublicSettings();
  const storeName =
    String(settings?.website?.storeName || "E-Commerce").trim() || "E-Commerce";
  const tagline = String(settings?.website?.tagline || "").trim();
  const aboutStoryTitle =
    String(settings?.about?.storyTitle || "").trim() ||
    DEFAULT_ABOUT_STORY_TITLE;
  const aboutStorySubtitle = String(
    settings?.about?.storySubtitle || "",
  ).trim();
  const aboutStoryContent =
    String(settings?.about?.storyContent || "").trim() ||
    (tagline
      ? `<p>${tagline}</p><p>${storeName} now brings products, banners, categories, support, compare flows, wishlist behavior, and branded landing content into one office ecommerce system that feels much closer to a full marketplace experience.</p><p>Our mission is simple: give shoppers a more polished buying journey while giving operators a stronger control layer for stock, pricing, orders, and storefront presentation.</p>`
      : DEFAULT_ABOUT_STORY_CONTENT);
  const features = normalizeAboutCards(
    settings?.about?.cards || DEFAULT_ABOUT_CARDS,
  );

  // Admin-controllable stats
  const stats = [
    {
      value: settings?.about?.stat1Value || "99.9%",
      label: settings?.about?.stat1Label || "Uptime Guarantee",
    },
    {
      value: settings?.about?.stat2Value || "50K+",
      label: settings?.about?.stat2Label || "Active Merchants",
    },
    {
      value: settings?.about?.stat3Value || "24/7",
      label: settings?.about?.stat3Label || "Premium Support",
    },
  ];

  return (
    <main
      className="bg-white font-sans antialiased text-slate-900"
      style={{ fontFamily: "var(--brand-font-family)" }}
    >
      {/* BEGIN: Our Story Section */}
      <section className="relative overflow-hidden pt-24 pb-32 lg:pt-24 lg:pb-48">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Content Left */}
            <div className="w-full lg:w-3/5 order-2 lg:order-1">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700">
                Our Mission
              </span>
              <h1 className="mt-2 text-5xl lg:text-7xl font-extrabold mb-12 leading-tight">
                {aboutStoryTitle}
                {aboutStorySubtitle ? (
                  <>
                    <br />
                    <span className="text-slate-400 font-bold">
                      {aboutStorySubtitle}
                    </span>
                  </>
                ) : null}
              </h1>

              <div className="max-w-2xl space-y-8 mb-12">
                {hasHtmlContent(aboutStoryContent) ? (
                  <div
                    className="prose prose-lg max-w-none space-y-6 [&_p]:text-xl [&_p]:leading-relaxed [&_p]:text-slate-600 [&_p]:font-medium"
                    dangerouslySetInnerHTML={{ __html: aboutStoryContent }}
                  />
                ) : (
                  <p className="text-xl leading-relaxed text-slate-600 font-medium">
                    {aboutStoryContent}
                  </p>
                )}
              </div>

              {/* Stats Display */}
              <div className="flex flex-wrap gap-12">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-4xl font-extrabold text-slate-900">
                      {stat.value}
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mt-2">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Right */}
            <div className="w-full lg:w-2/5 order-1 lg:order-2 flex justify-center items-center">
              <div className="relative group w-full!">
                {/* Decorative blur behind the image for depth */}
                <div className="absolute -inset-4 opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                <div className="relative  transition-transform duration-700">
                  <DeliveryScene />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: Our Story Section */}

      {/* BEGIN: Trust Section */}
      <section className="bg-slate-50 py-24 lg:py-40">
        <div className="container mx-auto px-6 md:px-12">
          {/* Section Header */}
          <div className="mx-auto max-w-3xl mb-20 lg:mb-32 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-8 md:text-4xl lg:text-5xl">
              Shop With Confidence
            </h2>
            <p className="mx-auto text-base text-slate-600 max-w-2xl md:text-lg">
              We&apos;ve built the storefront around trust, clarity, and
              smoother customer decisions to ensure every interaction feels
              premium.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-12">
            {features && features.length > 0
              ? features.map((feature, index) => {
                  const Icon = getAboutCardIconComponent(feature.icon);
                  return (
                    <div
                      key={`${feature.title}-${index}`}
                      className="group bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col h-full"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:text-white transition-all duration-500"
                        style={{
                          backgroundColor: feature.backgroundColor || "#3B82F6",
                          color: feature.iconColor || "#ffffff",
                        }}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-slate-900">
                        {feature.title}
                      </h3>
                      {hasHtmlContent(feature.description) ? (
                        <div
                          className="text-slate-500 leading-relaxed [&_p]:text-slate-500 [&_p]:leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: feature.description,
                          }}
                        />
                      ) : (
                        <p className="text-slate-500 leading-relaxed">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  );
                })
              : null}
          </div>
        </div>
      </section>
      {/* END: Trust Section */}
    </main>
  );
};

export default AboutUs;
