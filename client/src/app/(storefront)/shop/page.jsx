"use client";

import ProductGrid from "@/Home/subPages/ProductGrid";
import { Suspense } from "react";

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        </div>
      }
    >
      <ProductGrid />
    </Suspense>
  );
}
