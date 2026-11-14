"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  isBengali: false,
});

const GOOGLE_TRANSLATE_SCRIPT_ID = "google-translate-script";

// The Google Translate widget is a third-party script that costs network
// requests and main-thread time on every navigation. It is only needed when
// the visitor actually uses Bengali, so it is loaded on demand instead of on
// every page load.
const loadGoogleTranslateScript = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) return;

  window.googleTranslateElementInit = () => {
    if (window.google?.translate?.TranslateElement) {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,bn",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE,
        },
        "google_translate_element"
      );
    }
  };

  const script = document.createElement("script");
  script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
  script.src =
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("en");

  // Read saved language from cookie/localStorage on initial load
  useEffect(() => {
    try {
      const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/i);
      const cookieLang = match?.[1];
      const localLang = localStorage.getItem("preferredLanguage");
      const current = cookieLang || localLang || "en";

      if (current === "bn") {
        setLanguageState("bn");
        document.documentElement.classList.add("lang-bn");
        document.documentElement.lang = "bn";
        // Only preload the translator when Bengali is actually active.
        loadGoogleTranslateScript();
      } else {
        setLanguageState("en");
        document.documentElement.classList.remove("lang-bn");
        document.documentElement.lang = "en";
      }
    } catch {
      /* ignore */
    }
  }, []);

  const applyLanguageToDocument = (targetLang) => {
    if (targetLang === "bn") {
      document.documentElement.classList.add("lang-bn");
      document.documentElement.lang = "bn";
    } else {
      document.documentElement.classList.remove("lang-bn");
      document.documentElement.lang = "en";
    }
  };

  const triggerGoogleTranslate = (targetLang) => {
    const domain = window.location.hostname;
    const cookieVal = targetLang === "bn" ? "/en/bn" : "/en/en";

    // Set Google Translate standard cookies
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;

    if (domain.includes(".")) {
      const rootDomain = "." + domain.split(".").slice(-2).join(".");
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${rootDomain};`;
    }

    try {
      localStorage.setItem("preferredLanguage", targetLang);
    } catch {
      /* ignore */
    }

    applyLanguageToDocument(targetLang);

    // Try finding Google's hidden combo selector to fire change event directly
    const selectElem = document.querySelector(".goog-te-combo");
    if (selectElem) {
      selectElem.value = targetLang;
      selectElem.dispatchEvent(new Event("change"));
      return;
    }

    // Switching back to English never needs the translator.
    if (targetLang !== "bn") return;

    // First time Bengali is selected: load the translator, wait for its widget
    // and apply the language. Reload only as a last resort.
    loadGoogleTranslateScript();

    let attempts = 0;
    const timer = window.setInterval(() => {
      const elem = document.querySelector(".goog-te-combo");
      if (elem) {
        window.clearInterval(timer);
        elem.value = targetLang;
        elem.dispatchEvent(new Event("change"));
        return;
      }

      attempts += 1;
      if (attempts > 20) {
        window.clearInterval(timer);
        window.location.reload();
      }
    }, 150);
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    triggerGoogleTranslate(lang);
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "bn" : "en";
    setLanguage(next);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isBengali: language === "bn",
      }}
    >
      {/* Hidden element required by Google Translate */}
      <div id="google_translate_element" style={{ display: "none" }} />
      {children}
    </LanguageContext.Provider>
  );
};
