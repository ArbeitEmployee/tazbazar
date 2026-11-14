"use client";



import MyWishlist from "@/views/MyWishlist";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function WishlistPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <MyWishlist />
    </Suspense>
    </ClientOnly>
  );
}
