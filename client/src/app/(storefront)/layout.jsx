"use client";

import Navbar from "@/Home/components/Navbar";
import Footer from "@/Home/components/Footer";
import MarketingScripts from "@/components/MarketingScripts";
import { Suspense } from "react";

export default function StorefrontLayout({ children }) {
  return (
    <>
      <MarketingScripts />
      <Suspense fallback={<div className="h-20 bg-white" />}>
        <Navbar />
      </Suspense>
      <main className="min-h-screen">{children}</main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
