"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiArrowRight } from "react-icons/fi";

const StorePopupNotice = () => {
  const [popup, setPopup] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const baseUrl = rawApiUrl.endsWith("/api")
      ? rawApiUrl
      : rawApiUrl.replace(/\/+$/, "") + "/api";

    const fetchPopup = async () => {
      try {
        const res = await axios.get(`${baseUrl}/banners/public/store-popup`, {
          params: { _t: Date.now() },
        });
        if (!isMounted) return;

        if (res.data?.success && res.data?.data) {
          const data = res.data.data;
          if (data.isActive && (data.title || data.message)) {
            // Check session only if showOncePerSession is true
            if (data.showOncePerSession) {
              const dismissedKey = `store_popup_dismissed_${data._id || "v1"}`;
              const alreadySeen = sessionStorage.getItem(dismissedKey);
              if (alreadySeen) return;
            }

            setPopup(data);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.warn("Popup notice error:", err?.message);
      }
    };

    fetchPopup();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (popup) {
      try {
        const dismissedKey = `store_popup_dismissed_${popup._id || "v1"}`;
        sessionStorage.setItem(dismissedKey, "true");
      } catch (e) {
        /* ignore */
      }
    }
  };

  const handleActionClick = () => {
    handleClose();
    if (popup?.buttonLink) {
      window.location.href = popup.buttonLink;
    }
  };

  if (!popup || !isOpen) return null;

  const bgImageUrl =
    popup.image ||
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-[4px] animate-in fade-in duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-3xl bg-white rounded-[26px] sm:rounded-[32px] shadow-2xl overflow-hidden border border-slate-200/80 grid grid-cols-1 md:grid-cols-12"
          role="dialog"
          aria-modal="true"
        >
          {/* Subtle Top-Right Close Icon Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xs"
          >
            <FiX className="w-4 h-4" />
          </button>

          {/* LEFT COLUMN: Atmospheric Image & Quote */}
          <div className="relative md:col-span-5 min-h-[220px] md:min-h-[440px] flex flex-col justify-between p-6 sm:p-7 overflow-hidden text-white bg-slate-950">
            {/* Background Image with Dark Vignette Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105 hover:scale-100"
              style={{ backgroundImage: `url(${bgImageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

            {/* Top Pill on Image */}
            <div className="relative z-10 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-sm tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {popup.badgeText || "Member Welcome Privilege"}
              </span>
            </div>

            {/* Bottom Content on Image */}
            <div className="relative z-10 space-y-3 pt-8 md:pt-0">
              {popup.quoteHeading && (
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
                  {popup.quoteHeading}
                </p>
              )}
              {popup.quoteText && (
                <blockquote className="text-sm sm:text-base font-semibold italic text-white/95 leading-snug drop-shadow-sm font-serif">
                  {popup.quoteText}
                </blockquote>
              )}

              {/* Trust Checkmarks */}
              {Array.isArray(popup.trustPills) && popup.trustPills.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-white/80">
                  {popup.trustPills.map((pill, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {pill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Welcome Header, Message & Action CTA */}
          <div className="md:col-span-7 p-6 sm:p-9 flex flex-col justify-between bg-white space-y-5">
            <div className="space-y-3">
              {/* Eyebrow */}
              {popup.eyebrow && (
                <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                  {popup.eyebrow}
                </p>
              )}

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {popup.title || "Grateful to have you with us."}
              </h2>

              {/* Message */}
              {popup.message && (
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                    {popup.message}
                  </p>
                </div>
              )}
            </div>

            {/* Direct Action Button without Input */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleActionClick}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-black px-5 py-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-slate-950/20 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>{popup.buttonText || "Unlock Offer & Shop Now"}</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Footer Dismiss & Privacy */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-400 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="hover:text-slate-700 transition cursor-pointer underline underline-offset-2"
              >
                {popup.footerDismissText || "Continue browsing without offer"}
              </button>
              <span>
                {popup.footerPrivacyText ||
                  "🔒 We value your privacy. No spam, ever."}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StorePopupNotice;
