/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  FiCheck,
  FiGlobe,
  FiSave,
  FiSettings,
  FiUpload,
  FiX,
} from "react-icons/fi";
import axios from "axios";
import SearchableSelect from "../components/SearchableSelect";
import { useAuth } from "../hooks/useAuth";
import { useThemeColors } from "../hooks/useThemeColors";
import {
  ABOUT_CARD_ICON_OPTIONS,
  DEFAULT_ABOUT_CARDS,
  DEFAULT_ABOUT_STORY_CONTENT,
  DEFAULT_ABOUT_STORY_TITLE,
  createEmptyAboutCard,
  getAboutCardIconComponent,
  normalizeAboutCards,
} from "../utils/aboutSection";
import {
  resolveWebsiteIconUrl,
  toPublicAssetUrl,
} from "../utils/publicSettings";
import RichTextEditor from "../components/RichTextEditor";
import {
  loadAdminSettings,
  loadPublicSettings,
  saveAdminSettings,
  selectAdminSettingsDraft,
  selectPublicSettingsState,
  updateAdminField,
  updateAdminNestedField,
  uploadAdminHeaderIcon,
  uploadAdminLogo,
} from "../store/publicSettingsSlice";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const sectionClass = "app-panel space-y-4 p-5 md:p-6";
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-black";
const textareaClass = `${inputClass} min-h-[104px] resize-y`;
const swatchButtonBaseClass =
  "group relative flex items-center gap-3 rounded-2xl border bg-white px-3 py-3 text-left transition";

const THEME_COLOR_OPTIONS = [
  { label: "Midnight", value: "#111827" },
  { label: "Ocean", value: "#0f766e" },
  { label: "Royal", value: "#2563eb" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#d97706" },
  { label: "Rose", value: "#e11d48" },
  { label: "Charcoal", value: "#0f172a" },
];

const BUTTON_TEXT_COLOR_OPTIONS = [
  { label: "White", value: "#ffffff" },
  { label: "Soft White", value: "#f8fafc" },
  { label: "Cream", value: "#fef3c7" },
  { label: "Slate", value: "#e2e8f0" },
  { label: "Ink", value: "#111827" },
  { label: "Black", value: "#000000" },
];

const FONT_FAMILY_OPTIONS = [
  {
    label: "Manrope / Inter (Default)",
    value: '"Manrope", "Inter", system-ui, -apple-system, sans-serif',
  },
  {
    label: "Poppins",
    value: '"Poppins", "Inter", system-ui, sans-serif',
  },
  {
    label: "Hind Siliguri (Bangla)",
    value: '"Hind Siliguri", "Manrope", system-ui, sans-serif',
  },
  {
    label: "Noto Sans Bengali",
    value: '"Noto Sans Bengali", "Inter", system-ui, sans-serif',
  },
  {
    label: "System Sans",
    value: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  {
    label: "Serif Classic",
    value: 'Georgia, "Times New Roman", serif',
  },
];

const TEMPLATE_OPTIONS = [
  {
    value: "classic",
    label: "Classic Store",
    description: "Default banners, category rail and deal shelves.",
  },
  {
    value: "modern",
    label: "Modern Minimal",
    description: "Clean spacing, compact header and minimal shelves.",
  },
  {
    value: "campaign",
    label: "Campaign Focus",
    description: "Campaign hero first, deals pushed above categories.",
  },
];

const WEBSITE_SECTION_IDS = [
  "ws-brand",
  "ws-appearance",
  "ws-font",
  "ws-pages",
  "ws-footer",
  "ws-template",
];

// One dashboard tab per Website Setup submenu entry. Each tab renders only
// its own page — nothing else from Website Setup leaks into it.
const WEBSITE_PAGES = {
  brand: {
    title: "Header",
    description:
      "Manage the store name, tagline, and navbar logo shown in the site header.",
  },
  footer: {
    title: "Footer",
    description:
      "Manage contact details, social links, policies, and the footer caption.",
  },
  about: {
    title: "About Us",
    description:
      "Manage About Us page content, story, vision, mission, and highlights.",
  },
  contact: {
    title: "Contact",
    description:
      "Manage contact cards, hotline, WhatsApp, email, showroom address, map, and inquiry form.",
  },
  theme: {
    title: "Theme & Buttons",
    description:
      "Customize brand theme, product card button colors (normal, hover, and in-cart states), and the browser icon.",
  },
  font: {
    title: "Font Family",
    description: "Pick the typeface used across the public storefront.",
  },
  pages: {
    title: "Pages",
    description: "Control the About page content and order cancellation rules.",
  },
  template: {
    title: "Template",
    description: "Choose the storefront home page layout style.",
  },
};

const POLICY_TABS = [
  { id: "shipping", label: "Shipping Policy" },
  { id: "delivery", label: "Delivery Policy" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "return", label: "Return Policy" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "caption", label: "Footer Caption" },
];

const normalizeLogoMode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase() === "text"
    ? "text"
    : "image";

const parseIdList = (value) =>
  Array.isArray(value)
    ? value
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
        .filter((entry, index, list) => list.indexOf(entry) === index)
    : [];

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const ColorPaletteCard = ({
  title,
  subtitle,
  explanation,
  options,
  selectedValue,
  onChange,
  badge,
}) => (
  <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300">
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase tracking-wider mb-1">
            {badge}
          </span>
          <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div
          className="w-8 h-8 rounded-xl border border-slate-200 shrink-0 shadow-inner"
          style={{ backgroundColor: selectedValue }}
          title={`Active: ${selectedValue}`}
        />
      </div>

      {/* Explanation quote box */}
      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
        💡 {explanation}
      </div>

      {/* Recommended swatches */}
      {Array.isArray(options) && options.length > 0 && (
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Quick Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                  opt.value.toLowerCase() === (selectedValue || "").toLowerCase()
                    ? "border-black bg-black text-white font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: opt.value }}
                />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Color Picker & Manual Input */}
    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-11 cursor-pointer rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs"
          title="Open Color Palette"
        />
      </div>
      <div className="flex-1">
        <input
          type="text"
          value={selectedValue}
          onChange={(e) => {
            const rawVal = e.target.value;
            const val = rawVal.trim();
            if (/^#[0-9a-f]{6}$/i.test(val)) {
              onChange(val);
            } else if (rawVal.startsWith("#") || rawVal === "") {
              onChange(rawVal);
            }
          }}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (/^#[0-9a-f]{6}$/i.test(val)) {
              onChange(val);
            }
          }}
          placeholder="#000000"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-black outline-none"
        />
      </div>
    </div>
  </div>
);

const ModuleWebsiteSetup = ({ initialSection = "brand" }) => {
  const { themeColor } = useThemeColors();
  const { user } = useAuth();
  const activePage = WEBSITE_PAGES[initialSection] ? initialSection : "brand";
  const pageMeta = WEBSITE_PAGES[activePage];
  const showBrand = activePage === "brand";
  const showFooter = activePage === "footer";
  const showAbout = activePage === "about" || activePage === "pages";
  const showContact = activePage === "contact";
  const showTheme = activePage === "theme";
  const showFont = activePage === "font";
  const showPages = activePage === "pages" || activePage === "about";
  const showTemplate = activePage === "template";
  const dispatch = useDispatch();
  const settings = useSelector(selectAdminSettingsDraft);
  const { adminStatus, saveStatus, logoUploadStatus } = useSelector(
    selectPublicSettingsState,
  );
  const loading = adminStatus === "idle" || adminStatus === "loading";
  const saving = saveStatus === "loading";
  const logoUploading = logoUploadStatus === "loading";
  const logoInputRef = useRef(null);
  const headerIconInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [iconUploading, setIconUploading] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState("shipping");
  const logoMode = normalizeLogoMode(settings?.website?.logoMode);
  const logoPreviewUrl = useMemo(
    () => toPublicAssetUrl(settings?.website?.logoUrl || ""),
    [settings?.website?.logoUrl],
  );
  const headerIconPreviewUrl = useMemo(
    () => resolveWebsiteIconUrl(settings?.website || {}),
    [settings?.website],
  );
  const publicStockCategoryIds = useMemo(
    () =>
      parseIdList(
        settings?.publicStockCategoryIds ||
          settings?.marketplace?.publicStockCategoryIds,
      ),
    [
      settings?.marketplace?.publicStockCategoryIds,
      settings?.publicStockCategoryIds,
    ],
  );
  const publicStockSummaryEnabled = Boolean(
    settings?.publicStockSummaryEnabled ??
    settings?.marketplace?.publicStockSummaryEnabled,
  );
  const selectedThemeColor =
    String(settings?.website?.themeColor || "").trim() ||
    THEME_COLOR_OPTIONS[0].value;
  const selectedButtonTextColor =
    String(settings?.website?.buttonTextColor || "").trim() ||
    BUTTON_TEXT_COLOR_OPTIONS[0].value;
  const selectedCartButtonColor =
    String(settings?.website?.cartButtonColor || "").trim() || "#0f172a";
  const selectedCartButtonHoverColor =
    String(settings?.website?.cartButtonHoverColor || "").trim() || "#2563eb";
  const selectedCartButtonActiveColor =
    String(settings?.website?.cartButtonActiveColor || "").trim() || "#059669";
  const useLogoAsHeaderIcon = Boolean(settings?.website?.useLogoAsHeaderIcon);
  const selectedFontFamily =
    String(settings?.website?.fontFamily || "").trim() ||
    FONT_FAMILY_OPTIONS[0].value;
  const selectedTemplate =
    String(settings?.website?.template || "").trim() || "classic";
  const isAdmin = useMemo(
    () => String(user?.userType || "").toLowerCase() === "admin",
    [user?.userType],
  );

  // Sidebar submenu (Header/Footer/Theme/Font/Pages/Template) dispatches
  // this event — scroll to the matching section and highlight it.
  useEffect(() => {
    const scrollToId = (section) => {
      if (!WEBSITE_SECTION_IDS.includes(section)) return;
      // Wait a tick so the section exists even right after tab switch.
      requestAnimationFrame(() => {
        setTimeout(() => {
          document
            .getElementById(section)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      });
    };

    const scrollToSection = (event) => {
      scrollToId(String(event?.detail?.section || "").trim());
    };

    // Handle clicks that fired while this view was still mounting
    // (e.g. switching from another dashboard tab).
    let pending = "";
    try {
      pending = String(
        window.sessionStorage.getItem("websiteSetupSection") || "",
      ).trim();
      window.sessionStorage.removeItem("websiteSetupSection");
    } catch {
      pending = "";
    }
    if (pending && !loading) {
      const timer = setTimeout(() => scrollToId(pending), 150);
      window.addEventListener("websiteSetupSection", scrollToSection);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("websiteSetupSection", scrollToSection);
      };
    }

    window.addEventListener("websiteSetupSection", scrollToSection);
    return () =>
      window.removeEventListener("websiteSetupSection", scrollToSection);
  }, [loading]);

  useEffect(() => {
    if (!isAdmin) return;

    dispatch(loadAdminSettings())
      .unwrap()
      .catch((message) => {
        toast.error(message || "Failed to load website settings");
      });
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await axios.get(`${baseUrl}/categories`, {
          headers: getAuthHeaders(),
        });

        const nextCategories = response.data?.success
          ? response.data.categories || []
          : Array.isArray(response.data?.data)
            ? response.data.data
            : Array.isArray(response.data)
              ? response.data
              : [];

        setCategories(nextCategories);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load categories",
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [isAdmin]);

  const updateNested = (section, key, value) => {
    dispatch(updateAdminNestedField({ section, key, value }));
  };

  const updateRoot = (key, value) => {
    dispatch(updateAdminField({ key, value }));
  };

  const rawCards = settings?.about?.cards;
  const aboutCards = useMemo(
    () => (Array.isArray(rawCards) && rawCards.length > 0 ? rawCards : DEFAULT_ABOUT_CARDS),
    [rawCards],
  );

  const updateAboutCards = (nextCards) => {
    updateNested("about", "cards", normalizeAboutCards(nextCards));
  };

  const addAboutCard = () => {
    if (aboutCards.length >= 4) return;
    updateAboutCards([...aboutCards, createEmptyAboutCard()]);
  };

  const updateAboutCard = (index, updates) => {
    updateAboutCards(
      aboutCards.map((card, currentIndex) =>
        currentIndex === index ? { ...card, ...updates } : card,
      ),
    );
  };

  const removeAboutCard = (index) => {
    updateAboutCards(
      aboutCards.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await dispatch(uploadAdminLogo(file)).unwrap();
      toast.success(result?.message || "Logo uploaded");
    } catch (error) {
      toast.error(error || "Failed to upload logo");
    } finally {
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleHeaderIconUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIconUploading(true);
      const result = await dispatch(uploadAdminHeaderIcon(file)).unwrap();
      toast.success(result?.message || "Header icon uploaded");
    } catch (error) {
      toast.error(error || "Failed to upload header icon");
    } finally {
      setIconUploading(false);
      if (headerIconInputRef.current) {
        headerIconInputRef.current.value = "";
      }
    }
  };

  const togglePublicStockCategory = (categoryId) => {
    const normalizedId = String(categoryId || "").trim();
    if (!normalizedId) return;

    updateRoot(
      "publicStockCategoryIds",
      publicStockCategoryIds.includes(normalizedId)
        ? publicStockCategoryIds.filter((id) => id !== normalizedId)
        : [...publicStockCategoryIds, normalizedId],
    );
  };

  const [savingCard, setSavingCard] = useState("");

  const saveContactCard = async (cardName, label) => {
    setSavingCard(cardName);
    try {
      const payload = {
        website: { ...(settings?.website || {}) },
        contact: { ...(settings?.contact || {}) },
        social: { ...(settings?.social || {}) },
        policies: { ...(settings?.policies || {}) },
        storefront: {
          ...(settings?.storefront || {}),
          footerCaption: String(
            settings?.storefront?.footerCaption || "",
          ).trim(),
        },
        about: {
          ...(settings?.about || {}),
          storyTitle:
            String(settings?.about?.storyTitle || "").trim() ||
            DEFAULT_ABOUT_STORY_TITLE,
          storySubtitle: String(settings?.about?.storySubtitle || "").trim(),
          storyContent:
            String(settings?.about?.storyContent || "").trim() ||
            DEFAULT_ABOUT_STORY_CONTENT,
          cards: aboutCards,
        },
        marketplace: {
          ...(settings?.marketplace || {}),
          publicStockSummaryEnabled,
          publicStockCategoryIds,
        },
        publicStockSummaryEnabled,
        publicStockCategoryIds,
      };

      const result = await dispatch(saveAdminSettings(payload)).unwrap();
      toast.success(result?.message || `${label || "Card"} saved successfully`);
      dispatch(loadPublicSettings({ force: true }));
    } catch (error) {
      toast.error(error || `Failed to save ${label || "card"}`);
    } finally {
      setSavingCard("");
    }
  };

  const saveSettings = async (event) => {
    if (event && event.preventDefault) event.preventDefault();

    try {
      const payload = {
        website: { ...(settings?.website || {}) },
        contact: { ...(settings?.contact || {}) },
        social: { ...(settings?.social || {}) },
        policies: { ...(settings?.policies || {}) },
        storefront: {
          ...(settings?.storefront || {}),
          footerCaption: String(
            settings?.storefront?.footerCaption || "",
          ).trim(),
        },
        about: {
          ...(settings?.about || {}),
          storyTitle:
            String(settings?.about?.storyTitle || "").trim() ||
            DEFAULT_ABOUT_STORY_TITLE,
          storySubtitle: String(settings?.about?.storySubtitle || "").trim(),
          storyContent:
            String(settings?.about?.storyContent || "").trim() ||
            DEFAULT_ABOUT_STORY_CONTENT,
          cards: aboutCards,
        },
        marketplace: {
          ...(settings?.marketplace || {}),
          publicStockSummaryEnabled,
          publicStockCategoryIds,
        },
        publicStockSummaryEnabled,
        publicStockCategoryIds,
      };

      const result = await dispatch(saveAdminSettings(payload)).unwrap();
      toast.success(result?.message || "Settings saved");

      // Reload public settings to reflect changes immediately
      dispatch(loadPublicSettings({ force: true }));
    } catch (error) {
      toast.error(error || "Failed to save settings");
    }
  };

  if (!isAdmin) {
    return (
      <div className="app-panel p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-black">
          Admin Access Required
        </h2>
        <p className="text-gray-600">Only admin can manage website settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="app-hero p-6 md:p-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <FiSettings className="h-6 w-6" />
        </div>
        <p className="app-kicker text-white/65!">Website setup</p>
        <h1 className="mt-3 text-2xl font-black md:text-3xl">{pageMeta.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-200 md:text-base">
          {pageMeta.description}
        </p>
      </div>

      {loading ? (
        <div className="app-panel-soft p-6">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={saveSettings} className="space-y-5">
          <div className={showTheme ? "w-full" : "grid grid-cols-1 gap-5 xl:grid-cols-2"}>
            {showBrand && (
            <section id="ws-brand" className={`${sectionClass} scroll-mt-24`}>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-black">
                <FiGlobe className="h-5 w-5" /> Brand Identity
              </h2>
              <p className="text-sm text-gray-600">
                Manage the store name, tagline, and navbar logo from one compact
                section.
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={settings?.website?.storeName}
                  onChange={(event) =>
                    updateNested("website", "storeName", event.target.value)
                  }
                  placeholder="Store name"
                  className={inputClass}
                />
                <input
                  value={settings?.website?.tagline}
                  onChange={(event) =>
                    updateNested("website", "tagline", event.target.value)
                  }
                  placeholder="Store tagline"
                  className={inputClass}
                />
              </div>

              <div className="app-panel-muted space-y-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-black">
                      Navbar Logo
                    </p>
                    <p className="text-xs text-gray-500">
                      Use a text logo or upload an image for the public
                      storefront.
                    </p>
                  </div>
                  <SearchableSelect
                    value={logoMode}
                    onChange={(value) =>
                      updateNested(
                        "website",
                        "logoMode",
                        normalizeLogoMode(value),
                      )
                    }
                    options={[
                      { value: "image", label: "Image Logo" },
                      { value: "text", label: "Text Logo" },
                    ]}
                    placeholder="Logo mode"
                    searchable={false}
                    className="min-w-0"
                    buttonClassName="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 md:w-44"
                    menuClassName="rounded-xl"
                  />
                </div>

                {logoMode === "text" ? (
                  <input
                    value={settings?.website?.logoText || ""}
                    onChange={(event) =>
                      updateNested("website", "logoText", event.target.value)
                    }
                    placeholder="Text logo for navbar"
                    className={inputClass}
                  />
                ) : (
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="app-btn-secondary h-11 gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
                    >
                      <FiUpload className="h-4 w-4" />
                      {logoUploading ? "Uploading..." : "Upload Logo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateNested("website", "logoUrl", "")}
                      className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:border-black"
                    >
                      Remove Logo
                    </button>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WEBP, or GIF.
                    </p>
                  </div>
                )}

                <div className="rounded-3xl border border-dashed border-black/12 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Logo Preview
                  </p>
                  <div className="mt-3 flex min-h-24 items-center justify-center rounded-[18px] border border-black/8 bg-white px-4 py-3">
                    {logoMode === "text" ? (
                      <div
                        className="inline-flex min-h-11 items-center rounded-xl border px-4 text-base font-black tracking-[0.08em]"
                        style={{
                          borderColor: `${selectedThemeColor}22`,
                          backgroundColor: selectedThemeColor,
                          color: selectedButtonTextColor,
                        }}
                      >
                        {String(
                          settings?.website?.logoText ||
                            settings?.website?.storeName ||
                            "LOGO",
                        ).trim() || "LOGO"}
                      </div>
                    ) : logoPreviewUrl ? (
                      <img
                        src={logoPreviewUrl}
                        alt={String(settings?.website?.storeName || "Logo")}
                        className="h-14 w-auto max-w-full object-contain"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">
                        No logo uploaded yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
            )}

            {showTheme && (
            <section id="ws-appearance" className="space-y-6">
              {/* Header card with Save button right on top as well */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>Theme & Button Styling Center</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    ওয়েবসাইটের ব্র্যান্ড থিম, প্রোডাক্ট কার্ডের বাটন এবং প্রতিটি স্টেট (Normal, Hover, In Cart) এখান থেকেই পরিবর্তন করুন।
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                  <FiSave className="h-4 w-4" />
                  <span>{saving ? "Saving Changes..." : "Save Theme Settings"}</span>
                </button>
              </div>

              {/* Comprehensive Live Interactive Preview Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Live Visual Simulator</h3>
                    <p className="text-xs text-slate-500">
                      Instantly preview how buttons will appear on your storefront when selecting colors:
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Interactive
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Primary theme button */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      1. Brand Primary Button
                    </span>
                    <button
                      type="button"
                      className="inline-flex w-full h-11 items-center justify-center rounded-xl text-xs font-bold shadow-sm transition"
                      style={{
                        backgroundColor: selectedThemeColor,
                        color: selectedButtonTextColor,
                      }}
                    >
                      Primary Button Action
                    </button>
                    <p className="text-[10px] text-slate-400">Main Action Buttons across website</p>
                  </div>

                  {/* Product Card Button (Normal & Hover) */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      2. Product Card (Default & Hover)
                    </span>
                    <button
                      type="button"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = selectedCartButtonHoverColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selectedCartButtonColor;
                      }}
                      className="inline-flex w-full h-11 items-center justify-center rounded-xl text-xs font-bold shadow-sm text-white transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: selectedCartButtonColor,
                      }}
                    >
                      Add to Cart (Hover Here)
                    </button>
                    <p className="text-[10px] text-slate-400">Hover mouse over button to see hover color</p>
                  </div>

                  {/* Product Card Button (Added to Cart state) */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      3. Added to Cart (Active State)
                    </span>
                    <button
                      type="button"
                      className="inline-flex w-full h-11 items-center justify-center rounded-xl text-xs font-bold shadow-sm text-white transition"
                      style={{
                        backgroundColor: selectedCartButtonActiveColor,
                      }}
                    >
                      ✓ In Cart (Added State)
                    </button>
                    <p className="text-[10px] text-slate-400">Displayed when item is in customer's cart</p>
                  </div>
                </div>
              </div>

              {/* 2-Column Responsive Grid for Color Settings Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* 1. Primary Brand Theme */}
                <ColorPaletteCard
                  badge="Website Theme"
                  title="1. Primary Brand / Theme Color"
                  subtitle="Main storefront brand accent and action button"
                  explanation="Background color for primary buttons, header accents, and key storefront actions."
                  options={THEME_COLOR_OPTIONS}
                  selectedValue={selectedThemeColor}
                  onChange={(val) => updateNested("website", "themeColor", val)}
                />

                {/* 2. Button Text Color */}
                <ColorPaletteCard
                  badge="Button Text"
                  title="2. Button Text Color"
                  subtitle="Text color inside primary buttons"
                  explanation="Font color of labels inside primary buttons (e.g. White, Soft White, or Black)."
                  options={BUTTON_TEXT_COLOR_OPTIONS}
                  selectedValue={selectedButtonTextColor}
                  onChange={(val) => updateNested("website", "buttonTextColor", val)}
                />

                {/* 3. Product Card Cart Button (Normal State) */}
                <ColorPaletteCard
                  badge="Product Card (Default)"
                  title="3. Product Card Button (Normal State)"
                  subtitle="Default color of product cart button"
                  explanation="Normal background color of the 'Add to Cart' button across the homepage and shop cards."
                  options={[
                    { label: "Midnight", value: "#0f172a" },
                    { label: "Black", value: "#000000" },
                    { label: "Indigo", value: "#4f46e5" },
                    { label: "Emerald", value: "#059669" },
                    { label: "Rose", value: "#e11d48" },
                  ]}
                  selectedValue={selectedCartButtonColor}
                  onChange={(val) => updateNested("website", "cartButtonColor", val)}
                />

                {/* 4. Product Card Cart Button (Hover State) */}
                <ColorPaletteCard
                  badge="Product Card (Hover)"
                  title="4. Product Card Button (Hover State)"
                  subtitle="Color when mouse hovers over button"
                  explanation="Visual transition color when customer hovers cursor over the Add to Cart button."
                  options={[
                    { label: "Royal Blue", value: "#2563eb" },
                    { label: "Indigo", value: "#4338ca" },
                    { label: "Amber", value: "#d97706" },
                    { label: "Teal", value: "#0d9488" },
                    { label: "Purple", value: "#9333ea" },
                  ]}
                  selectedValue={selectedCartButtonHoverColor}
                  onChange={(val) => updateNested("website", "cartButtonHoverColor", val)}
                />

                {/* 5. Product Card Cart Button (Added / Active State) */}
                <ColorPaletteCard
                  badge="Product Card (In Cart)"
                  title="5. Added to Cart Button (Active State)"
                  subtitle="Color when item is currently in cart"
                  explanation="Background color displayed when this product is already present in customer's cart."
                  options={[
                    { label: "Emerald Green", value: "#059669" },
                    { label: "Teal", value: "#0d9488" },
                    { label: "Forest", value: "#15803d" },
                    { label: "Amber Gold", value: "#d97706" },
                    { label: "Slate Dark", value: "#334155" },
                  ]}
                  selectedValue={selectedCartButtonActiveColor}
                  onChange={(val) => updateNested("website", "cartButtonActiveColor", val)}
                />

                {/* Browser Tab Icon card */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase tracking-wider mb-1">
                      Browser Tab
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">6. Browser Tab Favicon</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Small browser tab icon</p>

                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                      💡 Upload a custom Favicon icon or reuse your storefront header logo.
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1 shrink-0">
                        {headerIconPreviewUrl ? (
                          <img src={headerIconPreviewUrl} alt="Icon" className="h-9 w-9 object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400">No icon</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <input
                          ref={headerIconInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          onChange={handleHeaderIconUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => headerIconInputRef.current?.click()}
                          disabled={iconUploading}
                          className="w-full text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-slate-700 text-center"
                        >
                          {iconUploading ? "Uploading..." : "Upload New Icon"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <label className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLogoAsHeaderIcon}
                      onChange={(e) => updateNested("website", "useLogoAsHeaderIcon", e.target.checked)}
                      className="rounded"
                    />
                    <span>Use navbar logo as browser icon</span>
                  </label>
                </div>

              </div>
            </section>
            )}
          </div>

          {showContact && (
            <div className="flex flex-col gap-6">
              {/* 4 Contact Cards Grid */}
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {/* 1. Hotline Support Card */}
                <section className={`${sectionClass} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                          Card 1
                        </span>
                        <h2 className="text-lg font-semibold text-black">Hotline Support Card</h2>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Fastest response calling channel on the Contact page.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                        <input
                          value={settings?.contact?.hotlineTitle || ""}
                          onChange={(e) => updateNested("contact", "hotlineTitle", e.target.value)}
                          placeholder="Hotline Support"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle</label>
                        <input
                          value={settings?.contact?.hotlineSubtitle || ""}
                          onChange={(e) => updateNested("contact", "hotlineSubtitle", e.target.value)}
                          placeholder="Speak directly with us"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Primary Hotline Phone</label>
                        <input
                          value={settings?.contact?.phone1 || ""}
                          onChange={(e) => updateNested("contact", "phone1", e.target.value)}
                          placeholder="+880 1700-000000"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Secondary Phone (Optional)</label>
                        <input
                          value={settings?.contact?.phone2 || ""}
                          onChange={(e) => updateNested("contact", "phone2", e.target.value)}
                          placeholder="+880 1800-000000"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={savingCard === "card1"}
                      onClick={() => saveContactCard("card1", "Hotline Support Card")}
                      className="app-btn-primary inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold shadow transition cursor-pointer"
                    >
                      <FiSave className="h-3.5 w-3.5" />
                      <span>{savingCard === "card1" ? "Saving..." : "Save Card 1"}</span>
                    </button>
                  </div>
                </section>

                {/* 2. WhatsApp Chat Card */}
                <section className={`${sectionClass} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                          Card 2
                        </span>
                        <h2 className="text-lg font-semibold text-black">WhatsApp Chat Card</h2>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Direct 24/7 instant WhatsApp messaging card.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                        <input
                          value={settings?.contact?.whatsappTitle || ""}
                          onChange={(e) => updateNested("contact", "whatsappTitle", e.target.value)}
                          placeholder="WhatsApp Chat"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle</label>
                        <input
                          value={settings?.contact?.whatsappSubtitle || ""}
                          onChange={(e) => updateNested("contact", "whatsappSubtitle", e.target.value)}
                          placeholder="24/7 direct messaging"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp Number</label>
                        <input
                          value={settings?.social?.whatsapp || ""}
                          onChange={(e) => updateNested("social", "whatsapp", e.target.value)}
                          placeholder="01999-995823 or +8801999995823"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={savingCard === "card2"}
                      onClick={() => saveContactCard("card2", "WhatsApp Chat Card")}
                      className="app-btn-primary inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold shadow transition cursor-pointer"
                    >
                      <FiSave className="h-3.5 w-3.5" />
                      <span>{savingCard === "card2" ? "Saving..." : "Save Card 2"}</span>
                    </button>
                  </div>
                </section>

                {/* 3. Email Support Card */}
                <section className={`${sectionClass} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                          Card 3
                        </span>
                        <h2 className="text-lg font-semibold text-black">Email Support Card</h2>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Official email address for customer tickets and inquiries.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                        <input
                          value={settings?.contact?.emailTitle || ""}
                          onChange={(e) => updateNested("contact", "emailTitle", e.target.value)}
                          placeholder="Email Support"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle</label>
                        <input
                          value={settings?.contact?.emailSubtitle || ""}
                          onChange={(e) => updateNested("contact", "emailSubtitle", e.target.value)}
                          placeholder="Official inquiries"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Support Email Address</label>
                        <input
                          value={settings?.contact?.email || ""}
                          onChange={(e) => updateNested("contact", "email", e.target.value)}
                          placeholder="support@marketplace.com.bd"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={savingCard === "card3"}
                      onClick={() => saveContactCard("card3", "Email Support Card")}
                      className="app-btn-primary inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold shadow transition cursor-pointer"
                    >
                      <FiSave className="h-3.5 w-3.5" />
                      <span>{savingCard === "card3" ? "Saving..." : "Save Card 3"}</span>
                    </button>
                  </div>
                </section>

                {/* 4. Office & Showroom Card */}
                <section className={`${sectionClass} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-800">
                          Card 4
                        </span>
                        <h2 className="text-lg font-semibold text-black">Office & Showroom Card</h2>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Physical showroom/office address and schedule.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                        <input
                          value={settings?.contact?.officeTitle || ""}
                          onChange={(e) => updateNested("contact", "officeTitle", e.target.value)}
                          placeholder="Office & Showroom"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle</label>
                        <input
                          value={settings?.contact?.officeSubtitle || ""}
                          onChange={(e) => updateNested("contact", "officeSubtitle", e.target.value)}
                          placeholder="Visit our location"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Showroom / Office Address</label>
                        <input
                          value={settings?.contact?.address || ""}
                          onChange={(e) => updateNested("contact", "address", e.target.value)}
                          placeholder="House #12, Road #05, Dhanmondi, Dhaka 1205, Bangladesh"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Office Hours / Note</label>
                        <input
                          value={settings?.contact?.officeHours || ""}
                          onChange={(e) => updateNested("contact", "officeHours", e.target.value)}
                          placeholder="Sat - Thu: 10:00 AM - 8:00 PM"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={savingCard === "card4"}
                      onClick={() => saveContactCard("card4", "Office & Showroom Card")}
                      className="app-btn-primary inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold shadow transition cursor-pointer"
                    >
                      <FiSave className="h-3.5 w-3.5" />
                      <span>{savingCard === "card4" ? "Saving..." : "Save Card 4"}</span>
                    </button>
                  </div>
                </section>
              </div>

              {/* Map & Inquiry Form Settings */}
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <section className={`${sectionClass} flex flex-col justify-between`}>
                  <div>
                    <h2 className="text-lg font-semibold text-black mb-1">Google Maps / Navigation</h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Direct map URL or custom embed code to pinpoint your showroom.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Google Maps Direction Link
                        </label>
                        <input
                          value={settings?.contact?.addressLink || ""}
                          onChange={(e) => updateNested("contact", "addressLink", e.target.value)}
                          placeholder="https://maps.google.com/?q=..."
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Custom Map Embed URL (Optional override)
                        </label>
                        <input
                          value={settings?.contact?.mapEmbedUrl || ""}
                          onChange={(e) => updateNested("contact", "mapEmbedUrl", e.target.value)}
                          placeholder="https://www.google.com/maps/embed?..."
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={savingCard === "map"}
                      onClick={() => saveContactCard("map", "Map Settings")}
                      className="app-btn-primary inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold shadow transition cursor-pointer"
                    >
                      <FiSave className="h-3.5 w-3.5" />
                      <span>{savingCard === "map" ? "Saving..." : "Save Map Settings"}</span>
                    </button>
                  </div>
                </section>

                <section className={`${sectionClass} flex flex-col justify-between`}>
                  <div>
                    <h2 className="text-lg font-semibold text-black mb-1">Inquiry Form Headings</h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Customize titles for the Send Us a Message form on the Contact page.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Form Heading</label>
                        <input
                          value={settings?.contact?.formTitle || ""}
                          onChange={(e) => updateNested("contact", "formTitle", e.target.value)}
                          placeholder="Send Us a Message"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Form Subtitle</label>
                        <input
                          value={settings?.contact?.formSubtitle || ""}
                          onChange={(e) => updateNested("contact", "formSubtitle", e.target.value)}
                          placeholder="Fill out the form below and our customer support team will get back to you shortly."
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={savingCard === "form"}
                      onClick={() => saveContactCard("form", "Form Headings")}
                      className="app-btn-primary inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold shadow transition cursor-pointer"
                    >
                      <FiSave className="h-3.5 w-3.5" />
                      <span>{savingCard === "form" ? "Saving..." : "Save Form Headings"}</span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}

          {showFooter && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <section className={sectionClass}>
              <h2 className="text-lg font-semibold text-black">
                Contact Details
              </h2>
              <p className="text-sm text-gray-600">
                Keep the store contact details compact and easy to maintain.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={settings?.contact?.address}
                  onChange={(event) =>
                    updateNested("contact", "address", event.target.value)
                  }
                  placeholder="Store address"
                  className={inputClass}
                />
                <input
                  value={settings?.contact?.addressLink}
                  onChange={(event) =>
                    updateNested("contact", "addressLink", event.target.value)
                  }
                  placeholder="Google Maps link"
                  className={inputClass}
                />
                <input
                  value={settings?.contact?.phone1}
                  onChange={(event) =>
                    updateNested("contact", "phone1", event.target.value)
                  }
                  placeholder="Primary phone"
                  className={inputClass}
                />
                <input
                  value={settings?.contact?.phone2}
                  onChange={(event) =>
                    updateNested("contact", "phone2", event.target.value)
                  }
                  placeholder="Secondary phone"
                  className={inputClass}
                />
                <input
                  value={settings?.contact?.email}
                  onChange={(event) =>
                    updateNested("contact", "email", event.target.value)
                  }
                  placeholder="Support email"
                  className={`${inputClass} md:col-span-2`}
                />
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold text-black">Social Links</h2>
              <p className="text-sm text-gray-600">
                Update the public social links without stretching the page
                layout.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={settings?.social?.facebook}
                  onChange={(event) =>
                    updateNested("social", "facebook", event.target.value)
                  }
                  placeholder="Facebook URL"
                  className={inputClass}
                />
                <input
                  value={settings?.social?.whatsapp}
                  onChange={(event) =>
                    updateNested("social", "whatsapp", event.target.value)
                  }
                  placeholder="WhatsApp URL"
                  className={inputClass}
                />
                <input
                  value={settings?.social?.instagram}
                  onChange={(event) =>
                    updateNested("social", "instagram", event.target.value)
                  }
                  placeholder="Instagram URL"
                  className={inputClass}
                />
                <input
                  value={settings?.social?.youtube}
                  onChange={(event) =>
                    updateNested("social", "youtube", event.target.value)
                  }
                  placeholder="YouTube URL"
                  className={inputClass}
                />
              </div>
            </section>
          </div>
          )}

          {showPages && (
          <section id="ws-pages" className={`${sectionClass} scroll-mt-24`}>
            <h2 className="text-lg font-semibold text-black">About Page</h2>
            <p className="text-sm text-gray-600">
              Control the story copy and feature cards shown on the public About
              page.
            </p>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                Our Story
              </p>
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Story Title
                  </label>
                  <input
                    value={settings?.about?.storyTitle || ""}
                    onChange={(event) =>
                      updateNested("about", "storyTitle", event.target.value)
                    }
                    placeholder="Our Story"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Story Subtitle
                  </label>
                  <input
                    value={settings?.about?.storySubtitle || ""}
                    onChange={(event) =>
                      updateNested("about", "storySubtitle", event.target.value)
                    }
                    placeholder="Optional"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Story Content
                  </label>
                  <RichTextEditor
                    value={settings?.about?.storyContent || ""}
                    onChange={(value) =>
                      updateNested("about", "storyContent", value)
                    }
                    placeholder="Write the About page story content..."
                    minHeight={220}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                Trust Badges / Stats
              </p>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Stat 1 Value
                    </label>
                    <input
                      value={settings?.about?.stat1Value || ""}
                      onChange={(event) =>
                        updateNested("about", "stat1Value", event.target.value)
                      }
                      placeholder="99.9%"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Stat 1 Label
                    </label>
                    <input
                      value={settings?.about?.stat1Label || ""}
                      onChange={(event) =>
                        updateNested("about", "stat1Label", event.target.value)
                      }
                      placeholder="Uptime Guarantee"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Stat 2 Value
                    </label>
                    <input
                      value={settings?.about?.stat2Value || ""}
                      onChange={(event) =>
                        updateNested("about", "stat2Value", event.target.value)
                      }
                      placeholder="50K+"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Stat 2 Label
                    </label>
                    <input
                      value={settings?.about?.stat2Label || ""}
                      onChange={(event) =>
                        updateNested("about", "stat2Label", event.target.value)
                      }
                      placeholder="Active Merchants"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Stat 3 Value
                    </label>
                    <input
                      value={settings?.about?.stat3Value || ""}
                      onChange={(event) =>
                        updateNested("about", "stat3Value", event.target.value)
                      }
                      placeholder="24/7"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Stat 3 Label
                    </label>
                    <input
                      value={settings?.about?.stat3Label || ""}
                      onChange={(event) =>
                        updateNested("about", "stat3Label", event.target.value)
                      }
                      placeholder="Premium Support"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                    About Cards
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-black">
                    Up to four feature cards
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Choose the icon, colors, title, and description shown on the
                    public About page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addAboutCard}
                  disabled={aboutCards.length >= 4}
                  className="app-btn-primary rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
                >
                  Add Card
                </button>
              </div>

              {aboutCards.length ? (
                <div className="mt-4 space-y-4">
                  {aboutCards.map((card, index) => {
                    const IconPreview = getAboutCardIconComponent(card.icon);

                    return (
                      <div
                        key={`about-card-${index}`}
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                              style={{
                                backgroundColor:
                                  card.backgroundColor || "#111827",
                              }}
                            >
                              <IconPreview
                                className="h-5 w-5"
                                style={{ color: card.iconColor || "#ffffff" }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                Card {index + 1}
                              </p>
                              <p className="text-sm text-gray-500">
                                Configure the icon, colors, title, and
                                description.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAboutCard(index)}
                            className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 lg:w-auto"
                          >
                            Remove Card
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,220px)_120px_120px]">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Icon
                            </label>
                            <SearchableSelect
                              value={card.icon || "package"}
                              onChange={(value) =>
                                updateAboutCard(index, {
                                  icon: value,
                                })
                              }
                              options={ABOUT_CARD_ICON_OPTIONS}
                              placeholder="Icon"
                              searchable={false}
                              className="min-w-0"
                              buttonClassName={inputClass}
                              menuClassName="rounded-xl"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Icon Color
                            </label>
                            <input
                              type="color"
                              value={card.iconColor || "#ffffff"}
                              onChange={(event) =>
                                updateAboutCard(index, {
                                  iconColor: event.target.value,
                                })
                              }
                              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 py-2"
                            />
                          </div>

                          <div className="sm:col-span-2 xl:col-span-1">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Background
                            </label>
                            <input
                              type="color"
                              value={card.backgroundColor || "#111827"}
                              onChange={(event) =>
                                updateAboutCard(index, {
                                  backgroundColor: event.target.value,
                                })
                              }
                              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-2 py-2"
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Card Title
                            </label>
                            <input
                              value={card.title || ""}
                              onChange={(event) =>
                                updateAboutCard(index, {
                                  title: event.target.value,
                                })
                              }
                              placeholder="Fast Shipping"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Card Description
                            </label>
                            <RichTextEditor
                              value={card.description || ""}
                              onChange={(value) =>
                                updateAboutCard(index, { description: value })
                              }
                              placeholder="Write the card description..."
                              minHeight={160}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                  No cards added yet. Add up to four cards for the About page.
                </div>
              )}
            </div>
          </section>
          )}

          {showPages && (
            <section className={sectionClass}>
              <h2 className="text-lg font-semibold text-black">
                Order Cancellation
              </h2>
              <p className="text-sm text-gray-600">
                Control how long customers can cancel an order from the
                storefront. Once the time limit expires, or once the order moves
                out of pending, the cancel button turns off automatically.
              </p>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">
                      Cancellation Time Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings?.policies?.cancellationWindowDays ?? 1}
                      onChange={(event) =>
                        updateNested(
                          "policies",
                          "cancellationWindowDays",
                          event.target.value,
                        )
                      }
                      placeholder="Days"
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-500">
                      Use days. Set `0` to disable customer cancellation
                      completely.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">
                      Cancellation Policy
                    </label>
                    <RichTextEditor
                      value={settings?.policies?.cancellationPolicy || ""}
                      onChange={(value) =>
                        updateNested("policies", "cancellationPolicy", value)
                      }
                      placeholder="Explain the cancellation rules customers should see"
                      minHeight={180}
                    />
                  </div>
                </div>
              </div>
            </section>
            )}

            {showFooter && (
            <section id="ws-footer" className={`${sectionClass} scroll-mt-24`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-black">
                    Policies & Footer
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click a button below to edit that specific policy or footer setting.
                  </p>
                </div>
              </div>

              {/* Policy Tab Buttons */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100/80 rounded-xl border border-gray-200/80">
                {POLICY_TABS.map((tab) => {
                  const isActive = activePolicyTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivePolicyTab(tab.id)}
                      className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-white text-indigo-600 shadow-sm border border-gray-200/60"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Editor */}
              <div className="mt-2">
                {activePolicyTab === "shipping" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">
                      Shipping Policy
                    </label>
                    <RichTextEditor
                      value={settings?.policies?.shipmentPolicy}
                      onChange={(value) =>
                        updateNested("policies", "shipmentPolicy", value)
                      }
                      placeholder="Shipping policy"
                      minHeight={260}
                    />
                  </div>
                )}

                {activePolicyTab === "delivery" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">
                      Delivery Policy
                    </label>
                    <RichTextEditor
                      value={settings?.policies?.deliveryPolicy}
                      onChange={(value) =>
                        updateNested("policies", "deliveryPolicy", value)
                      }
                      placeholder="Delivery policy"
                      minHeight={260}
                    />
                  </div>
                )}

                {activePolicyTab === "terms" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">
                      Terms and Conditions
                    </label>
                    <RichTextEditor
                      value={settings?.policies?.termsConditions}
                      onChange={(value) =>
                        updateNested("policies", "termsConditions", value)
                      }
                      placeholder="Terms and conditions"
                      minHeight={260}
                    />
                  </div>
                )}

                {activePolicyTab === "return" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">
                      Return Policy
                    </label>
                    <RichTextEditor
                      value={settings?.policies?.returnPolicy}
                      onChange={(value) =>
                        updateNested("policies", "returnPolicy", value)
                      }
                      placeholder="Return policy"
                      minHeight={260}
                    />
                  </div>
                )}

                {activePolicyTab === "privacy" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">
                      Privacy Policy
                    </label>
                    <RichTextEditor
                      value={settings?.policies?.privacyPolicy}
                      onChange={(value) =>
                        updateNested("policies", "privacyPolicy", value)
                      }
                      placeholder="Privacy policy"
                      minHeight={260}
                    />
                  </div>
                )}

                {activePolicyTab === "caption" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">
                      Footer Caption / Copyright Text
                    </label>
                    <input
                      value={settings?.storefront?.footerCaption || ""}
                      onChange={(event) =>
                        updateNested(
                          "storefront",
                          "footerCaption",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. © 2026 TazBazar. All rights reserved."
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-500">
                      This copyright or branding text appears at the bottom of the storefront footer.
                    </p>
                  </div>
                )}
              </div>
            </section>
            )}

          {!showContact && (
            <div className="sticky bottom-3 z-50">
              <div className="rounded-2xl border border-black/10 bg-white/90 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.10)] backdrop-blur supports-[backdrop-filter]:bg-white/70">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    title="Save settings"
                    aria-label="Save settings"
                    className="app-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 md:px-5"
                  >
                    <FiSave className="h-4 w-4" />
                    <span>{saving ? "Saving..." : "Save Settings"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default ModuleWebsiteSetup;
