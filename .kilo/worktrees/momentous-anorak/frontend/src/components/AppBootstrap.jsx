"use client";

import { useEffect } from "react";
import { configureGlobalToasts } from "@/utils/globalToast";

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
    const fontFamily = String(resolved?.fontFamily || "").trim();
    const template = String(resolved?.template || "").trim();

    document.documentElement.style.setProperty("--brand-theme-color", themeColor);
    document.documentElement.style.setProperty(
      "--brand-button-text-color",
      buttonTextColor,
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

export function AppBootstrap() {
  useEffect(() => {
    applyBrandTheme();
    configureGlobalToasts();

    const refresh = () => applyBrandTheme();
    window.addEventListener("publicSettingsUpdated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("publicSettingsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return null;
}
