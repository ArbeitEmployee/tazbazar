"use client";

import CompareProducts from "@/views/CompareProducts";
import { Suspense } from "react";

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <CompareProducts />
    </Suspense>
  );
}
