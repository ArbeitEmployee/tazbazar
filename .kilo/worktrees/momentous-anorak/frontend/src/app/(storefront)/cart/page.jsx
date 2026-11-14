"use client";



import AddToCart from "@/Home/components/AddToCart";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function CartPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AddToCart />
    </Suspense>
    </ClientOnly>
  );
}
