"use client";



import LandingPageView from "@/Home/pages/LandingPageView";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function LandingPageRoute() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <LandingPageView />
    </Suspense>
    </ClientOnly>
  );
}
