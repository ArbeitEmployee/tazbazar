import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { FiType, FiSave, FiTrash2, FiEye, FiAlertCircle } from "react-icons/fi";
import { useThemeColors } from "../../hooks/useThemeColors";
import {
  dashboardFieldClass,
  dashboardFormSurfaceClass,
  dashboardLabelClass,
} from "../../utils/dashboardFormStyles";

const HighlightTextManager = () => {
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const baseUrl = rawApiUrl.endsWith("/api")
    ? rawApiUrl
    : rawApiUrl.replace(/\/+$/, "") + "/api";

  const { themeColor, buttonTextColor } = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);

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

  // Fetch current highlight text
  const fetchHighlightText = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/banners/highlight-text`, {
        headers: getAuthHeaders(),
      });

      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setText(item.text || "");
        setIsActive(item.isActive !== undefined ? item.isActive : true);
        setLastUpdated(item.updatedAt);
      }
    } catch (err) {
      console.error("Failed to load highlight text:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlightText();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error("হাইলাইট টেক্সট অবশ্যই লিখতে হবে");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${baseUrl}/banners/highlight-text`,
        {
          text: text.trim(),
          isActive: isActive,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (res.data?.success) {
        toast.success("হাইলাইট টেক্সট সফলভাবে সংরক্ষিত হয়েছে!");
        if (res.data.data) {
          setLastUpdated(res.data.data.updatedAt);
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(
        err.response?.data?.message || "হাইলাইট টেক্সট সংরক্ষণ করতে ব্যর্থ হয়েছে"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে হাইলাইট টেক্সটটি মুছে ফেলতে চান?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.delete(`${baseUrl}/banners/highlight-text`, {
        headers: getAuthHeaders(),
      });

      if (res.data?.success) {
        toast.success("হাইলাইট টেক্সট সফলভাবে মুছে ফেলা হয়েছে");
        setText("");
        setLastUpdated(null);
      }
    } catch (err) {
      toast.error("মুছে ফেলতে ব্যর্থ হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Highlight Text Management
          </h1>
          <p className="text-sm text-slate-500">
            হোমপেজের ব্যানার/স্লাইডারের ঠিক নিচে প্রদর্শনের জন্য হাইলাইট টেক্সট লিখুন।
          </p>
        </div>
        {lastUpdated && (
          <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 sm:self-auto">
            সর্বশেষ আপডেট: {new Date(lastUpdated).toLocaleDateString("bn-BD")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Container */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className={`${dashboardFormSurfaceClass} space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6`}
          >
            {/* Status Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/50 p-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-slate-900">
                    ডিসপ্লে স্ট্যাটাস
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {isActive ? "সক্রিয় (Active)" : "বন্ধ (Inactive)"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  চালু থাকলে হোমপেজে ব্যানার নিচে টেক্সটটি দেখাবে, বন্ধ থাকলে লুকানো থাকবে।
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((prev) => !prev)}
                  className={`app-toggle-switch cursor-pointer transition-all ${
                    isActive ? "is-on" : ""
                  }`}
                  style={{
                    backgroundColor: isActive ? (themeColor || "#10b981") : "rgba(226, 232, 240, 1)",
                    borderColor: isActive ? (themeColor || "#10b981") : "rgba(203, 213, 225, 1)",
                  }}
                >
                  <span
                    className="app-toggle-switch__knob"
                    style={{
                      backgroundColor: isActive ? (buttonTextColor || "#ffffff") : "#ffffff",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Single Highlight Text Box */}
            <div>
              <label className={dashboardLabelClass}>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <FiType className="text-slate-500" />
                  হাইলাইট টেক্সট (Highlight Text) *
                </span>
              </label>
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="এখানে আপনার হাইলাইট টেক্সটটি লিখুন..."
                required
                className={`${dashboardFieldClass} resize-none`}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClear}
                disabled={isSubmitting || !text}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <FiTrash2 className="text-sm" />
                মুছে ফেলুন
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: themeColor || "#0f172a",
                  color: buttonTextColor || "#ffffff",
                }}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition hover:opacity-95 disabled:opacity-60"
              >
                <FiSave className="text-base" />
                {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Container */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FiEye className="text-slate-600" />
                <h3 className="font-semibold text-slate-800 text-sm">
                  হোমপেজ প্রিভিউ
                </h3>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive && text.trim()
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-amber-50 text-amber-700 border border-amber-200/60"
                }`}
              >
                {isActive && text.trim() ? "দৃশ্যমান" : "লুকানো"}
              </span>
            </div>

            {/* The Actual Preview Box */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              {text.trim() ? (
                <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs text-center">
                  <p className="text-sm font-medium text-slate-800">
                    {text}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                  <FiAlertCircle className="mb-2 text-2xl text-slate-300" />
                  <p className="text-xs">কোনো টেক্সট দেওয়া নেই।</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightTextManager;
