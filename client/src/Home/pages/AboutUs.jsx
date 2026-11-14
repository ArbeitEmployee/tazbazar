"use client";

import React from "react";
import { Link } from "@/lib/routing";
import {
  FiArrowRight,
  FiAward,
  FiCheckCircle,
  FiGlobe,
  FiHeadphones,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import usePublicSettings from "../../hooks/usePublicSettings";
import { cleanHtml, hasHtmlContent } from "../../utils/richText";
import {
  DEFAULT_ABOUT_CARDS,
  DEFAULT_ABOUT_STORY_CONTENT,
  DEFAULT_ABOUT_STORY_TITLE,
  getAboutCardIconComponent,
  normalizeAboutCards,
} from "../../utils/aboutSection";

const AboutUs = () => {
  const { settings } = usePublicSettings();

  const storeName =
    String(settings?.website?.storeName || "TazBazar").trim() || "TazBazar";
  const tagline = String(settings?.website?.tagline || "").trim();

  const aboutStoryTitle =
    String(settings?.about?.storyTitle || "").trim() ||
    DEFAULT_ABOUT_STORY_TITLE;
  const aboutStorySubtitle = String(
    settings?.about?.storySubtitle || "",
  ).trim();

  const rawStoryContent =
    String(settings?.about?.storyContent || "").trim() ||
    (tagline
      ? `<p>${tagline}</p><p>${storeName} is dedicated to making everyday shopping effortless, enjoyable, and accessible for everyone across Bangladesh.</p><p>We bring together curated quality products, transparent pricing, responsive support, and reliable nationwide delivery to provide an elevated e-commerce experience you can trust.</p>`
      : DEFAULT_ABOUT_STORY_CONTENT);

  const aboutStoryContent = cleanHtml(rawStoryContent);

  const rawFeatures = normalizeAboutCards(
    settings?.about?.cards || DEFAULT_ABOUT_CARDS,
  );

  const features = rawFeatures.map((f) => ({
    ...f,
    description: cleanHtml(f.description),
  }));

  // Stats from admin or robust defaults
  const stats = [
    {
      value: settings?.about?.stat1Value || "99.9%",
      label: settings?.about?.stat1Label || "Customer Satisfaction",
      subtext: "Verified positive feedback",
      icon: FiAward,
      color: "from-amber-500 to-amber-600",
    },
    {
      value: settings?.about?.stat2Value || "50K+",
      label: settings?.about?.stat2Label || "Orders Delivered",
      subtext: "Across major cities & towns",
      icon: FiPackage,
      color: "from-blue-500 to-indigo-600",
    },
    {
      value: settings?.about?.stat3Value || "24/7",
      label: settings?.about?.stat3Label || "Dedicated Support",
      subtext: "Instant help via chat & call",
      icon: FiHeadphones,
      color: "from-emerald-500 to-teal-600",
    },
    {
      value: "64",
      label: "Districts Covered",
      subtext: "Doorstep delivery nationwide",
      icon: FiGlobe,
      color: "from-purple-500 to-pink-600",
    },
  ];

  const corePillars = [
    {
      title: "Our Mission",
      desc: `To provide customers across Bangladesh with genuine products at competitive prices, backed by fast and transparent delivery.`,
      icon: FiShoppingBag,
      tag: "Purpose Driven",
    },
    {
      title: "Our Vision",
      desc: `To become the most reliable and customer-first online shopping destination, setting new standards for speed, quality, and service.`,
      icon: FiUsers,
      tag: "Forward Thinking",
    },
    {
      title: "Our Promise",
      desc: `We inspect every item, ensure secure payment methods including Cash on Delivery, and stand behind hassle-free customer returns.`,
      icon: FiShield,
      tag: "Guaranteed Trust",
    },
  ];

  return (
    <main
      className="min-h-screen bg-slate-50/60 font-sans antialiased text-slate-800"
      style={{ fontFamily: "var(--brand-font-family)" }}
    >
      {/* 1. Header / Breadcrumb Hero Banner */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 py-12 md:py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/40 via-transparent to-transparent pointer-events-none" />
        <div className="site-container relative z-10">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider">
            <Link href="/" className="hover:text-indigo-600 transition">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-800">About Us</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-xs font-bold text-indigo-700 tracking-wide uppercase mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Discover {storeName}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight break-words [overflow-wrap:anywhere]">
              {aboutStoryTitle}
              {aboutStorySubtitle ? (
                <span className="block mt-2 text-2xl sm:text-3xl font-semibold text-indigo-600 break-words [overflow-wrap:anywhere]">
                  {aboutStorySubtitle}
                </span>
              ) : null}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal break-words [overflow-wrap:anywhere]">
              {tagline ||
                "Delivering happiness, authentic products, and reliable doorstep service straight to your home across Bangladesh."}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Story Narrative & Mission Section */}
      <section className="py-14 md:py-20">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Story text (Left Column) */}
            <div className="lg:col-span-7 min-w-0 max-w-full">
              <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] min-w-0 max-w-full overflow-hidden">
                <div className="flex items-center gap-2.5 mb-6 text-sm font-bold text-indigo-600 uppercase tracking-widest">
                  <FiCheckCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">The Story Behind Our Brand</span>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4 break-words [overflow-wrap:anywhere]">
                  {hasHtmlContent(aboutStoryContent) ? (
                    <div
                      className="break-words [overflow-wrap:anywhere] [&_p]:text-base [&_p]:sm:text-lg [&_p]:leading-relaxed [&_p]:text-slate-600 [&_p]:break-words [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900"
                      dangerouslySetInnerHTML={{ __html: aboutStoryContent }}
                    />
                  ) : (
                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      {aboutStoryContent}
                    </p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                      {storeName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {storeName} Team
                      </p>
                      <p className="text-xs text-slate-400">
                        Committed to your satisfaction
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition group"
                  >
                    <span>Browse Catalog</span>
                    <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Core Pillars Cards (Right Column) */}
            <div className="lg:col-span-5 space-y-4 min-w-0 max-w-full">
              {corePillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-indigo-300 hover:shadow-md transition-all duration-200 min-w-0 max-w-full overflow-hidden"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {pillar.title}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                            {pillar.tag}
                          </span>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed break-words [overflow-wrap:anywhere]">
                          {cleanHtml(pillar.desc)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. By The Numbers / Impact Stats */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="site-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex flex-col items-center text-center group hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all duration-300 min-w-0 max-w-full overflow-hidden"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-200/60 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight break-words">
                    {stat.value}
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800 break-words">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 break-words">
                    {stat.subtext}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us / Trust Features */}
      <section className="py-16 md:py-24">
        <div className="site-container">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              The {storeName} Advantage
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight break-words [overflow-wrap:anywhere]">
              Why Customers Love Shopping With Us
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed break-words [overflow-wrap:anywhere]">
              We focus on delivering genuine quality, secured transactions, and
              the fastest doorstep fulfillment available.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = getAboutCardIconComponent(feature.icon);
              return (
                <div
                  key={`${feature.title}-${index}`}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group min-w-0 max-w-full overflow-hidden"
                >
                  <div className="min-w-0 max-w-full">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0"
                      style={{
                        backgroundColor: feature.backgroundColor || "#2563eb",
                        color: feature.iconColor || "#ffffff",
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 break-words [overflow-wrap:anywhere]">
                      {feature.title}
                    </h3>
                    {hasHtmlContent(feature.description) ? (
                      <div
                        className="text-xs sm:text-sm text-slate-500 leading-relaxed break-words [overflow-wrap:anywhere] [&_p]:text-xs [&_p]:sm:text-sm [&_p]:text-slate-500 [&_p]:leading-relaxed [&_p]:break-words"
                        dangerouslySetInnerHTML={{
                          __html: feature.description,
                        }}
                      />
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed break-words [overflow-wrap:anywhere]">
                        {feature.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition shrink-0">
                    <FiCheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Guaranteed Service</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Modern Call to Action Banner */}
      <section className="pb-16 md:pb-24">
        <div className="site-container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 md:p-16 text-white shadow-2xl">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
                Start Exploring Today
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight break-words [overflow-wrap:anywhere]">
                Ready to Experience Seamless Online Shopping?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal break-words [overflow-wrap:anywhere]">
                Discover authentic products across various categories with fast
                nationwide delivery and flexible Cash on Delivery service.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-900 text-sm font-bold shadow-lg hover:bg-slate-100 transition-all active:scale-95"
                >
                  <FiShoppingBag className="h-4 w-4" />
                  <span>Start Shopping</span>
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/20 transition-all active:scale-95"
                >
                  <FiHeadphones className="h-4 w-4" />
                  <span>Contact Our Team</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutUs;
