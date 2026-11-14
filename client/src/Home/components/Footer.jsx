"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/routing";
import usePublicSettings from "../../hooks/usePublicSettings";
import { toPublicAssetUrl } from "../../utils/publicSettings";
import { fetchPublicCategories } from "../../utils/publicCategories";
import { FiPhone, FiMail, FiMapPin, FiArrowRight } from "react-icons/fi";
import { FaFacebookF, FaWhatsapp, FaInstagram, FaYoutube } from "react-icons/fa";

const normalizeLogoMode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase() === "text"
    ? "text"
    : "image";

const paymentMethods = [
  {
    id: "bkash",
    name: "bKash",
    type: "image",
    src: "/payments/bkash.png",
  },
  {
    id: "nagad",
    name: "Nagad",
    type: "image",
    src: "/payments/nagad.png",
  },
  {
    id: "upay",
    name: "Upay",
    type: "image",
    src: "/payments/upay.png",
  },
  {
    id: "ssl",
    name: "SSLCommerz",
    type: "image",
    src: "/payments/sslcommerz.png",
  },
  {
    id: "cod",
    name: "Cash On Delivery",
    type: "cod",
  },
];

const FooterNavLink = ({ href, children }) => (
  <Link
    href={href}
    className="group flex items-center gap-1.5 cursor-pointer text-left text-slate-400 transition-all duration-150 hover:text-white"
    onClick={() => {
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
    }}
  >
    <FiArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 text-amber-400" />
    <span>{children}</span>
  </Link>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = usePublicSettings();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchPublicCategories()
      .then((items) => {
        if (mounted && Array.isArray(items)) {
          setCategories(items);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const website = useMemo(() => settings?.website || {}, [settings]);
  const contact = useMemo(() => settings?.contact || {}, [settings]);
  const social = useMemo(() => settings?.social || {}, [settings]);
  const storefront = useMemo(() => settings?.storefront || {}, [settings]);

  const brandName =
    String(website?.storeName || "Clotya").trim() || "Clotya";
  const brandLogoMode = normalizeLogoMode(website?.logoMode);
  const brandLogo =
    brandLogoMode === "image" ? toPublicAssetUrl(website?.logoUrl || "") : "";
  const hasBrandLogoImage = Boolean(brandLogo);
  const brandLogoText =
    String(website?.logoText || "").trim() || brandName;

  const contactPhone = String(contact?.phone1 || "+880 1234 5678 90").trim();
  const contactPhone2 = String(contact?.phone2 || "").trim();
  const contactEmail = String(contact?.email || "info@example.com").trim();
  const contactAddress = String(contact?.address || "").trim();
  const addressLink = String(contact?.addressLink || "").trim();

  const formatSocialUrl = (url, type) => {
    const raw = String(url || "").trim();
    if (!raw) return "";
    if (type === "whatsapp") {
      if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
      const digits = raw.replace(/[^0-9]/g, "");
      const fullNumber = digits.startsWith("88") ? digits : digits.startsWith("0") ? `88${digits}` : digits;
      return `https://wa.me/${fullNumber}`;
    }
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `https://${raw}`;
  };

  const socialLinks = useMemo(() => {
    const list = [];
    if (social?.facebook) {
      list.push({
        id: "facebook",
        label: "Facebook",
        url: formatSocialUrl(social.facebook, "facebook"),
        icon: FaFacebookF,
        colorClass: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
      });
    }
    if (social?.whatsapp) {
      list.push({
        id: "whatsapp",
        label: "WhatsApp",
        url: formatSocialUrl(social.whatsapp, "whatsapp"),
        icon: FaWhatsapp,
        colorClass: "hover:bg-[#25D366] hover:text-white hover:border-[#25D366]",
      });
    }
    if (social?.instagram) {
      list.push({
        id: "instagram",
        label: "Instagram",
        url: formatSocialUrl(social.instagram, "instagram"),
        icon: FaInstagram,
        colorClass: "hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F]",
      });
    }
    if (social?.youtube) {
      list.push({
        id: "youtube",
        label: "YouTube",
        url: formatSocialUrl(social.youtube, "youtube"),
        icon: FaYoutube,
        colorClass: "hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]",
      });
    }
    return list;
  }, [social]);

  // 1. Information column links
  const informationLinks = [
    { label: "About Us", path: "/about" },
    { label: "Privacy Policy", path: "/policy/privacy" },
    { label: "Returns Policy", path: "/policy/return" },
    { label: "Shipping Policy", path: "/policy/shipping" },
    { label: "Terms & Conditions", path: "/policy/terms" },
  ];

  // 2. Shop column links
  const shopLinks = [
    { label: "All Products", path: "/shop" },
    { label: "Bestsellers", path: "/shop?sort=bestseller" },
    { label: "Discount Deals", path: "/shop?collection=deals" },
    { label: "Latest Arrivals", path: "/shop?sort=newest" },
    { label: "Featured Products", path: "/shop?sort=price-asc" },
  ];

  // 3. Dynamic Categories column
  const topCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.slice(0, 5).map((cat) => ({
        label: cat.name,
        path: `/shop?category=${encodeURIComponent(cat.slug || cat._id || cat.name)}`,
      }));
    }
    return [
      { label: "Electronics", path: "/shop?category=Electronics" },
      { label: "Fashion & Lifestyle", path: "/shop?category=Fashion" },
      { label: "Beauty & Health", path: "/shop?category=Beauty" },
      { label: "Home & Living", path: "/shop?category=Home" },
      { label: "Gadgets", path: "/shop?category=Gadgets" },
    ];
  }, [categories]);

  return (
    <footer className="relative w-full border-t border-slate-800 bg-[#0B0F19] font-sans text-slate-300 antialiased overflow-hidden">
      {/* Subtle luxury ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(30, 58, 138, 0.25) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(88, 28, 135, 0.2) 0px, transparent 50%),
            radial-gradient(at 50% 100%, rgba(15, 23, 42, 0.8) 0px, transparent 60%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 right-10 h-72 w-72 rounded-full bg-indigo-600/10 blur-[110px]" />

      {/* Main Top Section: Balanced 4-Column Organized Layout */}
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* Column 1: Brand Logo, Tagline & Direct Contact (span 4) */}
          <div className="lg:col-span-4 flex flex-col justify-start">
            <Link
              href="/"
              className="inline-flex cursor-pointer items-center self-start text-left transition-transform duration-200 hover:scale-[1.02]"
            >
              {hasBrandLogoImage ? (
                <div className="inline-flex items-center rounded-2xl bg-white px-4 py-2 shadow-md shadow-black/20">
                  <img
                    src={brandLogo}
                    alt={brandName}
                    className="h-10 sm:h-12 md:h-14 w-auto max-w-[240px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                    {brandLogoText}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 relative -top-3">
                    &reg;
                  </span>
                </div>
              )}
            </Link>

            <p className="mt-3.5 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-400 font-normal">
              {website?.tagline ||
                "Your trusted online shopping destination for premium quality products, fast delivery, and authentic customer satisfaction."}
            </p>

            {/* Direct Contact Details with Clean Icons */}
            <div className="mt-4 space-y-2 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-800/80 text-amber-400 ring-1 ring-slate-700/60 shrink-0">
                  <FiPhone className="h-3 w-3" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="tracking-tight font-medium text-slate-200">{contactPhone}</span>
                  {contactPhone2 && (
                    <>
                      <span className="text-slate-600">/</span>
                      <span className="tracking-tight font-medium text-slate-300">{contactPhone2}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-800/80 text-sky-400 ring-1 ring-slate-700/60 shrink-0">
                  <FiMail className="h-3 w-3" />
                </div>
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-medium text-slate-300 transition hover:text-white hover:underline truncate"
                >
                  {contactEmail}
                </a>
              </div>

              {contactAddress && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-800/80 text-rose-400 ring-1 ring-slate-700/60 shrink-0">
                    <FiMapPin className="h-3 w-3" />
                  </div>
                  {addressLink ? (
                    <a
                      href={addressLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 font-medium line-clamp-2 hover:text-white hover:underline"
                      title="Open in Google Maps"
                    >
                      {contactAddress}
                    </a>
                  ) : (
                    <span className="text-slate-300 font-medium line-clamp-2">{contactAddress}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Links & Social Columns: 4 Balanced Columns (span 8 total) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-6 lg:col-span-8">
            
            {/* 1. Information */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
                Information
              </h4>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-400">
                {informationLinks.map((item) => (
                  <li key={item.label}>
                    <FooterNavLink href={item.path}>{item.label}</FooterNavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Shop Links */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
                Shop
              </h4>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-400">
                {shopLinks.map((item) => (
                  <li key={item.label}>
                    <FooterNavLink href={item.path}>{item.label}</FooterNavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Top Categories */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
                Categories
              </h4>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-400">
                {topCategories.map((item) => (
                  <li key={item.label}>
                    <FooterNavLink href={item.path}>{item.label}</FooterNavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Social Media (Beside Categories in its own aligned column) */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
                Follow Us
              </h4>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed mb-3">
                Connect with our social channels
              </p>
              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {socialLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${item.colorClass}`}
                        title={item.label}
                        aria-label={item.label}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">24/7 online support</p>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Copyright & Payments Bar */}
      <div className="relative border-t border-slate-800/90 bg-[#060911]/90 backdrop-blur-md py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            
            {/* Copyright & Store Caption */}
            <div className="text-center text-xs text-slate-400 md:text-left">
              <span>Copyright {currentYear} &copy; {brandName}. All rights reserved.</span>
              {storefront?.footerCaption ? (
                <span className="hidden sm:inline text-slate-500 ml-1">
                  — {storefront.footerCaption}
                </span>
              ) : null}
            </div>

            {/* Payment Method Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {paymentMethods.map((pay) => {
                if (pay.type === "cod") {
                  return (
                    <div
                      key={pay.id}
                      className="flex h-8.5 px-3 items-center justify-center rounded-lg border border-emerald-500/40 bg-[#059669] shadow-md shadow-emerald-950/40 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                      title="Cash On Delivery"
                    >
                      <span className="font-sans text-[11px] font-black tracking-wider text-white">
                        COD
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={pay.id}
                    className="flex h-8.5 min-w-10 items-center justify-center rounded-lg border border-slate-700/60 bg-white p-1.5 shadow-md shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:shadow-lg"
                    title={pay.name}
                  >
                    <img
                      src={pay.src}
                      alt={pay.name}
                      className="h-full w-auto max-h-5.5 object-contain"
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom Right Policy Links */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
              <Link
                href="/policy/privacy"
                className="cursor-pointer transition hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/policy/terms"
                className="cursor-pointer transition hover:text-white"
              >
                Terms and Conditions
              </Link>
              <Link
                href="/policy/return"
                className="cursor-pointer transition hover:text-white"
              >
                Returns Policy
              </Link>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
