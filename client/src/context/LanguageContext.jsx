"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  isBengali: false,
});

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
      } else {
        setLanguageState("en");
        document.documentElement.classList.remove("lang-bn");
        document.documentElement.lang = "en";
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Initialize official Google Translate Script once
  useEffect(() => {
    if (typeof window === "undefined") return;

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

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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

    if (targetLang === "bn") {
      document.documentElement.classList.add("lang-bn");
      document.documentElement.lang = "bn";
    } else {
      document.documentElement.classList.remove("lang-bn");
      document.documentElement.lang = "en";
    }

    // Try finding Google's hidden combo selector to fire change event directly
    const selectElem = document.querySelector(".goog-te-combo");
    if (selectElem) {
      selectElem.value = targetLang;
      selectElem.dispatchEvent(new Event("change"));
    } else {
      // Reload smoothly so Google Translate applies cookie to 100% of the entire page
      window.location.reload();
    }
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
