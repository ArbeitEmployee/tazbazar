"use client";

import Navbar from "@/Home/components/Navbar";
import Footer from "@/Home/components/Footer";
import ClientOnly from "@/components/ClientOnly";
import MarketingScripts from "@/components/MarketingScripts";

import { Suspense } from "react";

export default function StorefrontLayout({ children }) {
  return (
    <>
      {/* Marketing & analytics script loader (fbq / gtag / GTM / TikTok). */}
      <MarketingScripts />
      {/* ClientOnly: Navbar/Footer read cached settings + cart (localStorage)
          on first render, which differs from SSR HTML and causes hydration
          mismatch (logo img vs text fallback). They were ssr:false before. */}
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
      </ClientOnly>
      <main>{children}</main>
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </ClientOnly>
    </>
  );
}
