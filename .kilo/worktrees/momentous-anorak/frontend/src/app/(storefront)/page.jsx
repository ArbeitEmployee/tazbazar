"use client";



import Home from "@/Home/pages/Home";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function HomePage() {
  return (
    <ClientOnly>
      <Suspense
      fallback={
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BF9B5C]" />
          <p className="text-sm font-medium text-gray-500">Loading store...</p>
        </div>
      }
    >
      <Home />
    </Suspense>
    </ClientOnly>
  );
}
