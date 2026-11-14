"use client";

import MyWishlist from "@/views/MyWishlist";
import { Suspense } from "react";

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <MyWishlist />
    </Suspense>
  );
}
