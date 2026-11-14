"use client";



import CheckOut from "@/Home/components/CheckOut";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function CheckoutPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <CheckOut />
    </Suspense>
    </ClientOnly>
  );
}
