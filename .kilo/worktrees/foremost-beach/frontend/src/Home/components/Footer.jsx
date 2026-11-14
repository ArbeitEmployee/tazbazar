import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@/lib/routing";
import { FiArrowRight } from "react-icons/fi";
import {
  FaArrowRotateLeft,
  FaChevronRight,
  FaEnvelope,
  FaFacebookF,
  FaGift,
  FaHeadset,
  FaInstagram,
  FaPhone,
  FaTruckFast,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa6";
import { FaMapMarkerAlt } from "react-icons/fa";
import usePublicSettings from "../../hooks/usePublicSettings";
import { toPublicAssetUrl } from "../../utils/publicSettings";

const quickLinks = [
  { name: "Home", path: "/" },
  { name: "Shop All Products", path: "/shop" },
  { name: "About Us", path: "/about" },
  { name: "Contact Us", path: "/contact" },
  { name: "Help & FAQs", path: "/faqs" },
];

const policyLinks = [
  { name: "Shipping Policy", path: "/policy/shipping" },
  { name: "Delivery Information", path: "/policy/delivery" },
  { name: "Terms & Conditions", path: "/policy/terms" },
  { name: "Return & Refund Policy", path: "/policy/return" },
  { name: "Privacy Policy", path: "/policy/privacy" },
];

const normalizeLogoMode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase() === "text"
    ? "text"
    : "image";

const withProtocol = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const lastScrollY = useRef(0);
  const [scrollDir, setScrollDir] = useState("down");
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const { settings } = usePublicSettings();

  const website = useMemo(() => settings?.website || {}, [settings]);
  const contact = useMemo(() => settings?.contact || {}, [settings]);
  const social = useMemo(() => settings?.social || {}, [settings]);
  const storefront = useMemo(() => settings?.storefront || {}, [settings]);

  const brandName =
    String(website?.storeName || "E-Commerce").trim() || "E-Commerce";
  const brandLogoMode = normalizeLogoMode(website?.logoMode);
  const brandLogo =
    brandLogoMode === "image" ? toPublicAssetUrl(website?.logoUrl || "") : "";
  const hasBrandLogoImage = Boolean(brandLogo);
  const brandLogoText =
    String(website?.logoText || "").trim() ||
    String(website?.storeName || "E-Commerce").trim();

  const socialLinks = [
    {
      label: "Facebook",
      href: withProtocol(social?.facebook),
      subtitle: "Follow our page",
      icon: (
        <FaFacebookF className="text-base text-white" />
      ),
      iconWrap:
        "bg-[#1877F2] hover:bg-[#0d65d9] shadow-blue-500/20",
    },
    {
      label: "WhatsApp",
      href: withProtocol(social?.whatsapp),
      subtitle: "Chat with us",
      icon: (
        <FaWhatsapp className="text-lg text-white" />
      ),
      iconWrap:
        "bg-[#25D366] hover:bg-[#1ebc59] shadow-emerald-500/20",
    },
    {
      label: "Instagram",
      href: withProtocol(social?.instagram),
      subtitle: "See latest updates",
      icon: (
        <FaInstagram className="text-base text-white" />
      ),
      iconWrap:
        "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 shadow-pink-500/20",
    },
    {
      label: "YouTube",
      href: withProtocol(social?.youtube),
      subtitle: "Watch our content",
      icon: (
        <FaYoutube className="text-base text-white" />
      ),
      iconWrap:
        "bg-[#FF0000] hover:bg-[#d90000] shadow-red-500/20",
    },
  ].filter((item) => item.href);

  const contactInfo = {
    address:
      String(contact?.address || "").trim() ||
      "Shop 12, Level 3, Bashundhara City, Panthapath, Dhaka 1215, Bangladesh",
    addressLink:
      withProtocol(contact?.addressLink) ||
      `https://maps.google.com/?q=${encodeURIComponent(
        String(
          contact?.address || "Bashundhara City Panthapath Dhaka Bangladesh",
        ).trim(),
      )}`,
    phone1: String(contact?.phone1 || "+880 1700-000000").trim(),
    phone2: String(contact?.phone2 || "").trim(),
    email: String(contact?.email || "support@marketplace.com.bd").trim(),
  };

  const footerCaption =
    String(storefront?.footerCaption || "").trim() ||
    "Built for modern high-speed Bangladesh ecommerce";
  const footerDescription =
    String(website?.tagline || "").trim() ||
    "Premium shopping experience with 100% genuine products, swift nationwide doorstep delivery, and trusted Cash on Delivery.";

  const whatsappUrl = useMemo(() => {
    const directWhatsapp = String(social?.whatsapp || "").trim();
    if (directWhatsapp) {
      if (
        directWhatsapp.startsWith("http://") ||
        directWhatsapp.startsWith("https://")
      ) {
        return directWhatsapp;
      }
      if (directWhatsapp.startsWith("wa.me/")) {
        return `https://${directWhatsapp}`;
      }
      const cleanDigits = directWhatsapp.replace(/[^\d+]/g, "");
      const normalized = cleanDigits.startsWith("+")
        ? cleanDigits.slice(1)
        : cleanDigits;
      return `https://wa.me/${normalized}`;
    }

    const rawPhone = String(
      contact?.phone1 ||
        contact?.phone ||
        contact?.supportPhone ||
        contact?.phone2 ||
        "",
    ).trim();

    if (rawPhone) {
      let digits = rawPhone.replace(/\D/g, "");
      if (digits.startsWith("01") && digits.length === 11) {
        digits = `88${digits}`;
      }
      if (digits) {
        return `https://wa.me/${digits}`;
      }
    }

    return "https://wa.me/";
  }, [social?.whatsapp, contact]);

  const handleNavigation = (path) => {
    navigate(path);
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const updateScrollState = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const doc = document.documentElement;
      const winHeight = window.innerHeight || 0;
      const docHeight = doc.scrollHeight || 0;

      const atTop = y <= 0;
      const atBottom = y + winHeight >= docHeight - 2;

      setIsAtTop(atTop);
      setIsAtBottom(atBottom);

      const delta = y - lastScrollY.current;
      if (Math.abs(delta) > 4) {
        setScrollDir(delta > 0 ? "down" : "up");
        lastScrollY.current = y;
      }
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  return (
    <footer className="relative bg-[#0b1324] text-slate-300 antialiased overflow-hidden">
      {/* Top Accent Line */}
      <div className="h-1 w-full bg-linear-to-r from-blue-600 via-indigo-500 to-sky-400" />

      {/* Feature Strip */}
      <div className="border-b border-slate-800/80 bg-[#0F172A]/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <FaTruckFast className="text-xl text-blue-400" />,
                title: "Fast Delivery",
                text: "Inside Dhaka 24h, outside 48-72h",
                badgeBg: "bg-blue-950/80 border-blue-800/60",
              },
              {
                icon: <FaArrowRotateLeft className="text-xl text-emerald-400" />,
                title: "Easy Returns",
                text: "7-day hassle-free return policy",
                badgeBg: "bg-emerald-950/80 border-emerald-800/60",
              },
              {
                icon: <FaGift className="text-xl text-amber-400" />,
                title: "Special Offers",
                text: "Seasonal deals & bundle savings",
                badgeBg: "bg-amber-950/80 border-amber-800/60",
              },
              {
                icon: <FaHeadset className="text-xl text-sky-400" />,
                title: "24/7 Support",
                text: "Dedicated customer assistance",
                badgeBg: "bg-sky-950/80 border-sky-800/60",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-center gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-850 hover:-translate-y-0.5"
              >
                <div
                  className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl border ${feature.badgeBg} shadow-inner`}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400 font-normal">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
            
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                onClick={() => handleNavigation("/")}
                className="inline-flex max-w-full cursor-pointer items-center text-left"
              >
                {hasBrandLogoImage ? (
                  <img
                    src={brandLogo}
                    alt={brandName}
                    className="h-12 w-auto max-w-[200px] rounded-xl bg-white p-2.5 object-contain shadow-md"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 text-lg font-black text-white shadow-md shadow-blue-500/20">
                      {brandLogoText.charAt(0)}
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-white transition-opacity hover:opacity-90">
                      {brandLogoText}
                    </h2>
                  </div>
                )}
              </button>
              
              <p className="mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-400">
                {footerDescription}
              </p>

              {/* Social Media Links */}
              {socialLinks.length > 0 ? (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Connect With Us
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {socialLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.label}
                        title={item.label}
                        className={`group flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${item.iconWrap}`}
                      >
                        {item.icon}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">
                Quick Links
              </h4>
              <ul className="mt-4 space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => handleNavigation(link.path)}
                      className="group flex w-full items-center gap-2 text-left text-xs sm:text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      <FaChevronRight className="text-[9px] text-blue-500 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                      <span>{link.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Support & Policies */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">
                Customer Care
              </h4>
              <ul className="mt-4 space-y-2.5">
                {policyLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => handleNavigation(link.path)}
                      className="group flex w-full items-center gap-2 text-left text-xs sm:text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      <FaChevronRight className="text-[9px] text-blue-500 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                      <span>{link.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Information & Payment badges */}
            <div className="lg:col-span-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">
                Get In Touch
              </h4>
              <div className="mt-4 space-y-3.5 text-xs sm:text-sm">
                <a
                  href={contactInfo.addressLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 transition-colors duration-200"
                >
                  <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FaMapMarkerAlt className="h-3.5 w-3.5 shrink-0" />
                  </span>
                  <span className="text-slate-400 group-hover:text-white transition-colors leading-relaxed">
                    {contactInfo.address}
                  </span>
                </a>
                
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                    <FaPhone className="h-3.5 w-3.5 shrink-0" />
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
                    <a
                      href={`tel:${contactInfo.phone1.replace(/[^\d+]/g, "")}`}
                      className="hover:text-white transition-colors font-medium"
                    >
                      {contactInfo.phone1}
                    </a>
                    {contactInfo.phone2 ? (
                      <>
                        <span className="text-slate-600">/</span>
                        <a
                          href={`tel:${contactInfo.phone2.replace(/[^\d+]/g, "")}`}
                          className="hover:text-white transition-colors font-medium"
                        >
                          {contactInfo.phone2}
                        </a>
                      </>
                    ) : null}
                  </div>
                </div>

                <a
                  href={`mailto:${contactInfo.email}`}
                  className="group flex items-center gap-3"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FaEnvelope className="h-3.5 w-3.5 shrink-0" />
                  </span>
                  <span className="text-slate-400 group-hover:text-white transition-colors font-medium">
                    {contactInfo.email}
                  </span>
                </a>
              </div>

              {/* Payment Methods */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Accepted Payments
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Cash on Delivery (COD)", cls: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60" },
                    { name: "bKash", cls: "bg-pink-950/70 text-pink-300 border-pink-800/60" },
                    { name: "Nagad", cls: "bg-orange-950/70 text-orange-300 border-orange-800/60" },
                    { name: "Debit / Credit Cards", cls: "bg-blue-950/70 text-blue-300 border-blue-800/60" },
                  ].map((pay) => (
                    <span
                      key={pay.name}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold tracking-wide ${pay.cls}`}
                    >
                      {pay.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Developer Attribution Strip */}
      <div className="border-t border-slate-800/90 bg-[#060a12] py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center text-center">
            <p className="text-xs sm:text-sm text-slate-400 font-medium flex items-center justify-center flex-wrap gap-1.5">
              <span>Developed & Powered by</span>
              <a
                href="https://arbeittechnology.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sky-400 hover:text-sky-300 underline decoration-sky-500/50 underline-offset-4 transition-all duration-200 hover:scale-105 inline-block"
              >
                Arbeit Technology
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-[#20ba59] hover:scale-110 active:scale-95"
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
        >
          <FaWhatsapp className="h-6 w-6" />
        </a>
      )}
    </footer>
  );
};

export default Footer;
