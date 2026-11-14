"use client";

// MarketingScripts
// Loads the configured marketing/analytics scripts ONCE at runtime:
//   - Meta (Facebook) Pixel via fbq
//   - Google Analytics 4 / gtag
//   - Google Tag Manager containers
//   - TikTok Pixel (ttq)
//   - Custom tracking code snippets (from the SEO & Analytics module)
// Also publishes window.__MARKETING_STATE__ (consumed by analyticsTracker.js)
// and flushes any events captured before the scripts finished loading.

import { useEffect } from "react";
import usePublicSettings from "@/hooks/usePublicSettings";
import { resolveTrackingConfiguration } from "@/utils/marketingProfiles";
import { flushPendingTrackingEvents } from "@/utils/analyticsTracker";

const safeString = (value) => String(value || "").trim();

const uniqueValues = (values = []) =>
  Array.from(
    new Set((Array.isArray(values) ? values : []).map(safeString).filter(Boolean)),
  );

const loadScript = (src) =>
  new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(false);
      return;
    }
    const existing = document.querySelector(`script[data-mkt-src="${src}"]`);
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.mktSrc = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

const injectCustomCodes = (codes = []) => {
  codes.forEach((code) => {
    const text = safeString(code);
    if (!text) return;
    const script = document.createElement("script");
    script.textContent = text;
    document.head.appendChild(script);
  });
};

const injectFacebookPixel = (pixelIds = []) => {
  const ids = uniqueValues(pixelIds);
  if (!ids.length) return;

  if (typeof window.fbq !== "function") {
    // Do NOT create a window.fbq stub: Meta's snippet skips initialization when
    // window.fbq already exists. Events captured before the script loads are
    // queued through analyticsTracker's flushPendingTrackingEvents instead.
    loadScript("https://connect.facebook.net/en_US/fbevents.js").then(() => {
      if (typeof window.fbq === "function") {
        ids.forEach((id) => window.fbq("init", id));
        window.fbq("track", "PageView");
      }
      flushPendingTrackingEvents();
    });
    return;
  }

  ids.forEach((id) => window.fbq("init", id));
  window.fbq("track", "PageView");
  flushPendingTrackingEvents();
};

const injectGoogleAnalytics = (ga4Ids = [], googleAnalyticsIds = []) => {
  const ids = uniqueValues([...ga4Ids, ...googleAnalyticsIds]);
  if (!ids.length) return;

  if (typeof window.gtag !== "function") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args) => {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());

    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0])}`).then(() => {
      ids.forEach((id) => window.gtag?.("config", id));
      flushPendingTrackingEvents();
    });
    return;
  }

  ids.forEach((id) => window.gtag?.("config", id));
};

const injectGtmContainers = (gtmIds = []) => {
  uniqueValues(gtmIds).forEach((id) => {
    const key = `__GTM_LOADED__${id}`;
    if (window[key]) return;
    window[key] = true;
    // eslint-disable-next-line no-underscore-dangle
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s);
      j.async = true;
      j.src = `https://www.googletagmanager.com/gtm.js?id=${i}&l=${l}`;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", id);
  });
};

const injectTikTokPixel = (tiktokIds = []) => {
  uniqueValues(tiktokIds).forEach((id) => {
    const key = `__TTQ_LOADED__${id}`;
    if (window[key]) return;
    window[key] = true;

    window.ttq = window.ttq || [];
    if (!window.ttq.methods || !window.ttq.methods.length) {
      window.ttq.methods = [
        "page",
        "track",
        "identify",
        "instances",
        "debug",
        "on",
        "off",
        "once",
        "ready",
        "alias",
        "group",
        "enableCookie",
        "disableCookie",
        "holdConsent",
        "revokeConsent",
        "grantConsent",
      ];
      window.ttq.track = (eventName, payload) =>
        window.ttq.push(["track", eventName, payload || {}]);
      window.ttq.identify = (payload) => window.ttq.push(["identify", payload || {}]);
      window.ttq.page = () => window.ttq.push(["track", "Pageview"]);
    }

    loadScript(
      `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(id)}&lib=ttq`,
    ).then(() => {
      window.ttq?.page();
      window.ttq?.track?.("Pageview");
      flushPendingTrackingEvents();
    });
  });
};

export default function MarketingScripts() {
  const { settings } = usePublicSettings();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const integrations = settings?.integrations || {};
    const config = resolveTrackingConfiguration(settings, {
      pathname: window.location.pathname,
    });

    const pixelIds = uniqueValues([
      ...config.pixelIds,
      integrations.facebookPixelId,
      integrations.metaPixelId,
    ]);
    const googleAnalyticsIds = uniqueValues([
      ...config.googleAnalyticsIds,
      integrations.googleAnalyticsId,
    ]);
    const ga4Ids = uniqueValues([...config.ga4Ids, integrations.ga4MeasurementId]);
    const gtmIds = uniqueValues([...config.gtmIds, integrations.gtmId]);
    const tiktokPixelIds = uniqueValues([
      integrations.tiktokPixelId,
      settings?.integrations?.tiktokPixelId,
    ]);
    const customTrackingCodes = uniqueValues(config.customTrackingCodes);

    window.__MARKETING_STATE__ = {
      pixelIds,
      ga4Ids,
      googleAnalyticsIds,
      gtmIds,
      tiktokPixelIds,
      customTrackingCodes,
      pathname: window.location.pathname,
      loadedAt: new Date().toISOString(),
    };

    injectCustomCodes(customTrackingCodes);
    injectFacebookPixel(pixelIds);
    injectGoogleAnalytics(ga4Ids, googleAnalyticsIds);
    injectGtmContainers(gtmIds);
    injectTikTokPixel(tiktokPixelIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  return null;
}