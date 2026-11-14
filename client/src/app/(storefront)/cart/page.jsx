"use client";

import AddToCart from "@/Home/components/AddToCart";
import { Suspense } from "react";

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AddToCart />
    </Suspense>
  );
}
