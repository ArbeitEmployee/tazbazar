"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { configureGlobalToasts } from "@/utils/globalToast";
import { PUBLIC_SETTINGS_UPDATE_SIGNAL_KEY } from "@/utils/publicSettings";
import { loadPublicSettings, selectPublicSettings } from "@/store/publicSettingsSlice";

const normalizeHexColor = (value, fallback) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();

  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(raw)) {
    return raw;
  }

  return fallback;
};

const hexToRgba = (value, alpha) => {
  const normalized = normalizeHexColor(value, "#000000");
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const applyBrandTheme = (website = null) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  try {
    let resolved = website;
    if (!resolved) {
      const raw = window.localStorage.getItem("publicStoreSettings");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      resolved = parsed?.settings?.website || {};
    }

    const themeColor = normalizeHexColor(resolved?.themeColor, "#000000");
    const buttonTextColor = normalizeHexColor(
      resolved?.buttonTextColor,
      "#ffffff",
    );
    const cartButtonColor = normalizeHexColor(
      resolved?.cartButtonColor,
      "#0f172a",
    );
    const cartButtonHoverColor = normalizeHexColor(
      resolved?.cartButtonHoverColor,
      "#2563eb",
    );
    const cartButtonActiveColor = normalizeHexColor(
      resolved?.cartButtonActiveColor,
      "#059669",
    );
    const fontFamily = String(resolved?.fontFamily || "").trim();
    const template = String(resolved?.template || "").trim();

    document.documentElement.style.setProperty("--brand-theme-color", themeColor);
    document.documentElement.style.setProperty(
      "--brand-button-text-color",
      buttonTextColor,
    );
    document.documentElement.style.setProperty(
      "--brand-cart-btn-color",
      cartButtonColor,
    );
    document.documentElement.style.setProperty(
      "--brand-cart-btn-hover-color",
      cartButtonHoverColor,
    );
    document.documentElement.style.setProperty(
      "--brand-cart-btn-active-color",
      cartButtonActiveColor,
    );
    document.documentElement.style.setProperty(
      "--brand-theme-shadow",
      hexToRgba(themeColor, 0.24),
    );
    if (fontFamily && fontFamily !== "inherit") {
      document.documentElement.style.setProperty(
        "--brand-font-family",
        fontFamily,
      );
    }
    if (template) {
      document.documentElement.setAttribute(
        "data-storefront-template",
        template,
      );
    }
  } catch {
    // Keep default CSS fallback colors when cache is unavailable or invalid.
  }
};

const applyFavicon = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    const iconLinks = document.querySelectorAll("link[rel*='icon']");
    if (iconLinks && iconLinks.length > 0) {
      iconLinks.forEach((link) => {
        link.setAttribute("href", "/vite.png");
        link.setAttribute("type", "image/png");
      });
    } else {
      const link = document.createElement("link");
      link.setAttribute("rel", "icon");
      link.setAttribute("type", "image/png");
      link.setAttribute("href", "/vite.png");
      document.head.appendChild(link);
    }
  } catch {
    // Ignore DOM favicon errors
  }
};

export function AppBootstrap() {
  const dispatch = useDispatch();
  const settings = useSelector(selectPublicSettings);

  // Synchronize CSS custom properties whenever settings in Redux update
  useEffect(() => {
    if (settings?.website) {
      applyBrandTheme(settings.website);
      applyFavicon();
    }
  }, [settings?.website]);

  useEffect(() => {
    // Initial fetch from backend if not already loaded
    dispatch(loadPublicSettings());
    applyBrandTheme();
    applyFavicon();
    configureGlobalToasts();

    const refresh = () => {
      dispatch(loadPublicSettings({ force: true }));
      applyBrandTheme();
      applyFavicon();
    };

    // Only react to the dedicated update signal. Listening to every `storage`
    // event created a cross-tab feedback loop: fetching settings writes the
    // cache key, which fires `storage` in the other tabs, which fetch again...
    const handleStorage = (event) => {
      if (event?.key && event.key !== PUBLIC_SETTINGS_UPDATE_SIGNAL_KEY) return;
      refresh();
    };

    window.addEventListener("publicSettingsUpdated", refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("publicSettingsUpdated", refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [dispatch]);

  return null;
}
