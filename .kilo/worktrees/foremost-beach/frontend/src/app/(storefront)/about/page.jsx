"use client";

import AboutUs from "@/Home/pages/AboutUs";
import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function AboutPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <AboutUs />
      </Suspense>
    </ClientOnly>
  );
}
