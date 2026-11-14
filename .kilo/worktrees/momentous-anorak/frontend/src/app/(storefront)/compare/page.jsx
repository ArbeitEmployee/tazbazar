"use client";



import CompareProducts from "@/views/CompareProducts";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function ComparePage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <CompareProducts />
    </Suspense>
    </ClientOnly>
  );
}
