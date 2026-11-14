"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageSquare,
  FiSave,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiUploadCloud,
  FiTrash2,
  FiX,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import {
  dashboardFieldClass,
  dashboardLabelClass,
} from "../../utils/dashboardFormStyles";

const StorePopupManager = () => {
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const baseUrl = rawApiUrl.endsWith("/api")
    ? rawApiUrl
    : rawApiUrl.replace(/\/+$/, "") + "/api";

  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Form Fields
  const [badgeText, setBadgeText] = useState("Member Welcome Privilege");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [quoteHeading, setQuoteHeading] = useState("TAZBAZAR ATELIER");
  const [quoteText, setQuoteText] = useState(
    '"Simplicity is the ultimate sophistication in daily living."',
  );
  const [trustPills, setTrustPills] = useState("100% Genuine, Direct Warranty");

  const [eyebrow, setEyebrow] = useState("A SPECIAL WELCOME TO TAZBAZAR");
  const [title, setTitle] = useState("Grateful to have you with us.");
  const [message, setMessage] = useState(
    "We started TazBazar to bring authentic lifestyle & tech essentials right to your doorstep. Enjoy our special offers on your order today.",
  );

  const [buttonText, setButtonText] = useState("Unlock Offer & Shop Now");
  const [buttonLink, setButtonLink] = useState("/shop");

  const [isActive, setIsActive] = useState(true);
  const [showOncePerSession, setShowOncePerSession] = useState(true);

  // Modal simulation preview state
  const [showLiveModal, setShowLiveModal] = useState(false);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPopupData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/banners/store-popup`, {
        headers: getAuthHeaders(),
      });

      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setBadgeText(item.badgeText || "Member Welcome Privilege");
        setCurrentImage(item.image || "");
        setImagePreview(item.image || "");
        setQuoteHeading(item.quoteHeading || "TAZBAZAR ATELIER");
        setQuoteText(
          item.quoteText ||
            '"Simplicity is the ultimate sophistication in daily living."',
        );
        setTrustPills(
          Array.isArray(item.trustPills)
            ? item.trustPills.join(", ")
            : item.trustPills || "100% Genuine, Direct Warranty",
        );
        setEyebrow(item.eyebrow || "A SPECIAL WELCOME TO TAZBAZAR");
        setTitle(item.title || "Grateful to have you with us.");
        setMessage(
          item.message ||
            "We started TazBazar to bring authentic lifestyle & tech essentials right to your doorstep.",
        );
        setButtonText(item.buttonText || "Unlock Offer & Shop Now");
        setButtonLink(item.buttonLink || "/shop");
        setIsActive(Boolean(item.isActive));
        setShowOncePerSession(
          item.showOncePerSession !== undefined
            ? Boolean(item.showOncePerSession)
            : true,
        );
        setLastUpdated(item.updatedAt);
      }
    } catch (err) {
      console.error("Failed to load store popup data:", err);
      toast.error("Failed to load popup configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopupData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setCurrentImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      toast.error("Please provide a title for the popup");
      return;
    }

    const toastId = toast.loading("Saving popup settings...");
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      formData.append("badgeText", badgeText.trim());
      formData.append("quoteHeading", quoteHeading.trim());
      formData.append("quoteText", quoteText.trim());
      formData.append(
        "trustPills",
        JSON.stringify(
          trustPills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      );
      formData.append("eyebrow", eyebrow.trim());
      formData.append("title", title.trim());
      formData.append("message", message.trim());
      formData.append("buttonText", buttonText.trim());
      formData.append("buttonLink", buttonLink.trim());
      formData.append("isActive", String(isActive));
      formData.append("showOncePerSession", String(showOncePerSession));

      if (imageFile) {
        formData.append("image", imageFile);
      } else {
        formData.append("image", currentImage);
      }

      const res = await axios.post(`${baseUrl}/banners/store-popup`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        toast.success("Store popup saved successfully!", { id: toastId });
        setLastUpdated(new Date().toISOString());
        if (res.data?.data?.image) {
          setCurrentImage(res.data.data.image);
          setImagePreview(res.data.data.image);
          setImageFile(null);
        }
      } else {
        toast.error(res.data?.message || "Failed to save popup", {
          id: toastId,
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || "Failed to save popup", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    const newStatus = !isActive;
    setIsActive(newStatus);

    try {
      const res = await axios.patch(
        `${baseUrl}/banners/store-popup/toggle-active`,
        {},
        { headers: getAuthHeaders() },
      );
      if (res.data?.success) {
        toast.success(
          `Popup is now ${newStatus ? "Active (visible on home)" : "Deactivated"}`,
        );
      }
    } catch (err) {
      console.error("Toggle error:", err);
      setIsActive(!newStatus);
      toast.error("Failed to toggle popup state");
    }
  };

  const effectiveImage =
    imagePreview ||
    currentImage ||
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80";

  const parsedPills = trustPills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">
            Loading popup settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FiMessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Exclusive Welcome Popup Dialog
              </h2>
              <p className="text-xs text-gray-500">
                Luxury split-screen popup with custom image banner, greeting
                message, and direct shop button.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLiveModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            >
              <FiEye className="w-4 h-4 text-gray-500" />
              Preview Live Popup
            </button>

            <button
              type="button"
              onClick={handleToggleActive}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isActive
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isActive ? (
                <>
                  <FiCheckCircle className="w-4 h-4 text-emerald-200" />
                  Status: ACTIVE
                </>
              ) : (
                <>
                  <FiXCircle className="w-4 h-4 text-gray-500" />
                  Status: DEACTIVATED
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN SETTINGS (Cover image & quotes) */}
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                1. Left Side Image & Quote
              </span>
            </div>

            {/* Image Upload Area */}
            <div>
              <label className={dashboardLabelClass}>
                Cover Background Image
              </label>
              <div className="relative mt-1 group">
                <div className="relative h-44 w-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-slate-900 flex items-center justify-center">
                  <img
                    src={effectiveImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white text-xs font-bold text-slate-900 shadow-md flex items-center gap-1.5"
                    >
                      <FiUploadCloud className="w-4 h-4" /> Change Image
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-xs font-semibold text-white flex items-center gap-1"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Click above to upload a new cover banner image (JPEG, PNG, WebP).
              </p>
            </div>

            {/* Badge on Image */}
            <div>
              <label className={dashboardLabelClass}>Top Badge on Image</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Member Welcome Privilege"
                className={dashboardFieldClass}
                maxLength={80}
              />
            </div>

            {/* Quote Heading */}
            <div>
              <label className={dashboardLabelClass}>
                Sub-Brand / Quote Author
              </label>
              <input
                type="text"
                value={quoteHeading}
                onChange={(e) => setQuoteHeading(e.target.value)}
                placeholder="e.g. TAZBAZAR ATELIER"
                className={dashboardFieldClass}
                maxLength={120}
              />
            </div>

            {/* Quote Text */}
            <div>
              <label className={dashboardLabelClass}>Inspiring Quote Text</label>
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="e.g. 'Simplicity is the ultimate sophistication in daily living.'"
                rows={2}
                className={dashboardFieldClass}
                maxLength={300}
              />
            </div>

            {/* Trust Pills */}
            <div>
              <label className={dashboardLabelClass}>
                Trust Badges (comma separated)
              </label>
              <input
                type="text"
                value={trustPills}
                onChange={(e) => setTrustPills(e.target.value)}
                placeholder="e.g. 100% Genuine, Direct Warranty"
                className={dashboardFieldClass}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Separated by commas: 100% Genuine, Direct Warranty
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN SETTINGS (Title, Message, CTA) */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                2. Right Side Content & Action Button
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {isActive ? "Active on Home" : "Disabled"}
              </span>
            </div>

            {/* Eyebrow & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={dashboardLabelClass}>Top Eyebrow Text</label>
                <input
                  type="text"
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  placeholder="e.g. A SPECIAL WELCOME TO TAZBAZAR"
                  className={dashboardFieldClass}
                  maxLength={120}
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>
                  Popup Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grateful to have you with us."
                  className={dashboardFieldClass}
                  maxLength={200}
                  required
                />
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className={dashboardLabelClass}>Welcome Message Text</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your welcome offer, store story, or thank you note..."
                rows={5}
                className={dashboardFieldClass}
                maxLength={2000}
              />
            </div>

            {/* Action CTA Button Setup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={dashboardLabelClass}>
                  Action Button Text
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Unlock Offer & Shop Now"
                  className={dashboardFieldClass}
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>Target Link</label>
                <input
                  type="text"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="/shop"
                  className={dashboardFieldClass}
                />
              </div>
            </div>

            {/* Behavior Switches */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-800">
                    Show Once per Session
                  </span>
                  <p className="text-xs text-gray-500">
                    Customer only sees popup once per browser visit.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showOncePerSession}
                  onClick={() => setShowOncePerSession((prev) => !prev)}
                  className={`app-toggle-switch cursor-pointer transition-all ${
                    showOncePerSession ? "is-on" : ""
                  }`}
                  style={{
                    backgroundColor: showOncePerSession
                      ? "#0f172a"
                      : "rgba(226, 232, 240, 1)",
                    borderColor: showOncePerSession
                      ? "#0f172a"
                      : "rgba(203, 213, 225, 1)",
                  }}
                >
                  <span className="app-toggle-switch__knob" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                <div>
                  <span className="text-sm font-semibold text-gray-800">
                    Enable Popup on Storefront
                  </span>
                  <p className="text-xs text-gray-500">
                    Live visibility status on your store homepage.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((prev) => !prev)}
                  className={`app-toggle-switch cursor-pointer transition-all ${
                    isActive ? "is-on" : ""
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? "#10b981"
                      : "rgba(226, 232, 240, 1)",
                    borderColor: isActive
                      ? "#10b981"
                      : "rgba(203, 213, 225, 1)",
                  }}
                >
                  <span className="app-toggle-switch__knob" />
                </button>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 flex items-center justify-between">
              {lastUpdated && (
                <span className="text-[11px] text-gray-400">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white bg-slate-950 hover:bg-black transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* FULLSCREEN POPUP PREVIEW MODAL */}
      <AnimatePresence>
        {showLiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-[4px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl bg-white rounded-[26px] sm:rounded-[32px] shadow-2xl overflow-hidden border border-slate-200/80 grid grid-cols-1 md:grid-cols-12"
            >
              <button
                type="button"
                onClick={() => setShowLiveModal(false)}
                className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shadow-xs"
              >
                <FiX className="w-4 h-4" />
              </button>

              {/* LEFT ON PREVIEW */}
              <div className="relative md:col-span-5 min-h-[220px] md:min-h-[440px] flex flex-col justify-between p-6 sm:p-7 overflow-hidden text-white bg-slate-950">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${effectiveImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

                <div className="relative z-10 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-sm tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {badgeText || "Member Welcome Privilege"}
                  </span>
                </div>

                <div className="relative z-10 space-y-3 pt-8 md:pt-0">
                  {quoteHeading && (
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
                      {quoteHeading}
                    </p>
                  )}
                  {quoteText && (
                    <blockquote className="text-sm sm:text-base font-semibold italic text-white/95 leading-snug drop-shadow-sm font-serif">
                      {quoteText}
                    </blockquote>
                  )}
                  {parsedPills.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-white/80">
                      {parsedPills.map((pill, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                          {pill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT ON PREVIEW */}
              <div className="md:col-span-7 p-6 sm:p-9 flex flex-col justify-between bg-white space-y-5">
                <div className="space-y-3">
                  {eyebrow && (
                    <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                      {eyebrow}
                    </p>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                    {title || "Grateful to have you with us."}
                  </h2>
                  {message && (
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                        {message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLiveModal(false)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 text-xs sm:text-sm font-bold text-white shadow-md cursor-pointer"
                  >
                    <span>{buttonText || "Unlock Offer & Shop Now"}</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-400 pt-1">
                  <span className="underline">
                    Continue browsing without offer
                  </span>
                  <span>🔒 We value your privacy. No spam, ever.</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StorePopupManager;
