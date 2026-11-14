"use client";



import FAQ from "@/Home/pages/FAQ";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function FaqPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <FAQ />
    </Suspense>
    </ClientOnly>
  );
}
